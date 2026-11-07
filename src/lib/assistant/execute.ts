import { AREAS } from "../areas";
import { slug } from "../checklists";
import { formatClock, formatDue, WEEKDAYS_SHORT } from "../dates";
import { uid } from "../defaults";
import type { useStore } from "../store";
import type { AreaId, NagLevel, Repeat } from "../types";

type Store = ReturnType<typeof useStore>;

/** What the user sees in the chat for each thing the assistant did */
export interface ChatAction {
  label: string;
  text: string;
  /** If it can be undone: what to remove */
  undo?: { kind: "reminder" | "routine" | "memory"; id: string };
  undone?: boolean;
  error?: boolean;
}

export interface ToolOutcome {
  content: string;
  isError?: boolean;
  action?: ChatAction;
}

// The model sees English values; storage keeps the original ids so saved data keeps working
const AREA_MAP: Record<string, AreaId> = { personal: "privat", work: "jobb", school: "skola" };
const NAG_MAP: Record<string, NagLevel> = { off: "av", gentle: "mild", normal: "normal", focus: "mamma", mom: "mamma" };
const REPEAT_MAP: Record<string, Repeat> = { none: "ingen", daily: "dagligen", weekdays: "vardagar", weekly: "veckovis" };

class InputError extends Error {}

function str(input: Record<string, unknown>, key: string, required = false): string | undefined {
  const v = input[key];
  if (v === undefined || v === null || v === "") {
    if (required) throw new InputError(`Missing field: ${key}`);
    return undefined;
  }
  if (typeof v !== "string") throw new InputError(`Field ${key} must be text`);
  return v.trim();
}

function mapped<T>(value: string | undefined, map: Record<string, T>, key: string): T | undefined {
  if (value === undefined) return undefined;
  if (!(value in map)) throw new InputError(`Invalid value for ${key}: ${value}`);
  return map[value];
}

function parseLocal(value: string): string {
  // "YYYY-MM-DDTHH:mm" is parsed as local time
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new InputError(`Invalid time: ${value}`);
  return d.toISOString();
}

function strings(input: Record<string, unknown>, key: string): string[] {
  const v = input[key];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new InputError(`${key} must be a list of text`);
  return (v as string[]).map((x) => x.trim()).filter(Boolean);
}

function area(store: Store, value: string | undefined): AreaId {
  const active = store.getState().settings.areas;
  const a = mapped(value, AREA_MAP, "area") ?? active[0] ?? "privat";
  if (!active.includes(a)) {
    const names = active.map((x) => AREAS[x].label.toLowerCase()).join(", ");
    throw new InputError(`The area ${value} isn't active. Active areas: ${names}`);
  }
  return a;
}

/** Runs a tool call from the assistant against the app's data */
export function executeTool(name: string, rawInput: unknown, store: Store): ToolOutcome {
  const input = (rawInput && typeof rawInput === "object" ? rawInput : {}) as Record<string, unknown>;
  try {
    switch (name) {
      case "create_reminder": {
        const title = str(input, "title", true)!;
        const due = parseLocal(str(input, "due", true)!);
        const a = area(store, str(input, "area"));
        const id = store.addReminder({
          title,
          due,
          area: a,
          repeat: mapped(str(input, "repeat"), REPEAT_MAP, "repeat") ?? "ingen",
          nag: mapped(str(input, "nag"), NAG_MAP, "nag") ?? "normal",
          notes: str(input, "notes"),
        });
        return {
          content: `Created reminder ${id}: "${title}" ${formatDue(due)}`,
          action: { label: "Added", text: `${title} · ${formatDue(due)}`, undo: { kind: "reminder", id } },
        };
      }

      case "update_reminder": {
        const id = str(input, "id", true)!;
        const existing = store.getState().reminders.find((r) => r.id === id);
        if (!existing) throw new InputError(`No reminder with id ${id}`);
        const dueRaw = str(input, "due");
        const areaRaw = str(input, "area");
        const patch = {
          ...(str(input, "title") !== undefined && { title: str(input, "title") }),
          ...(dueRaw !== undefined && { due: parseLocal(dueRaw), done: false }),
          ...(areaRaw !== undefined && { area: area(store, areaRaw) }),
          ...(input.repeat !== undefined && { repeat: mapped(str(input, "repeat"), REPEAT_MAP, "repeat") }),
          ...(input.nag !== undefined && { nag: mapped(str(input, "nag"), NAG_MAP, "nag") }),
          ...(input.notes !== undefined && { notes: str(input, "notes") }),
        };
        store.updateReminder(id, patch);
        const title = patch.title ?? existing.title;
        const due = patch.due ?? existing.due;
        return {
          content: `Updated ${id}: "${title}" ${formatDue(due)}`,
          action: { label: "Changed", text: `${title} · ${formatDue(due)}` },
        };
      }

      case "complete_reminder": {
        const id = str(input, "id", true)!;
        const r = store.getState().reminders.find((x) => x.id === id);
        if (!r) throw new InputError(`No reminder with id ${id}`);
        if (r.done) return { content: `"${r.title}" was already done` };
        store.completeReminder(id);
        return {
          content: r.repeat === "ingen" ? `Marked "${r.title}" as done` : `"${r.title}" done, moved to its next time`,
          action: { label: "Done", text: r.title },
        };
      }

      case "delete_reminder": {
        const id = str(input, "id", true)!;
        const r = store.getState().reminders.find((x) => x.id === id);
        if (!r) throw new InputError(`No reminder with id ${id}`);
        store.deleteReminder(id);
        return { content: `Deleted "${r.title}"`, action: { label: "Deleted", text: r.title } };
      }

      case "create_routine": {
        const nameStr = str(input, "name", true)!;
        const time = str(input, "time", true)!;
        if (!/^\d{1,2}:\d{2}$/.test(time)) throw new InputError(`Invalid time: ${time}`);
        const days = input.days;
        if (!Array.isArray(days) || days.length === 0 || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
          throw new InputError("days must be a list of whole numbers 0–6");
        }
        const items = strings(input, "items");
        if (items.length === 0) throw new InputError("The list needs at least one item");
        const id = uid();
        const t = time.padStart(5, "0");
        store.saveRoutine({
          id,
          name: nameStr,
          emoji: "",
          area: area(store, str(input, "area")),
          time: t,
          days: [...new Set(days as number[])],
          items: items.map((text) => ({ id: uid(), text })),
          nag: mapped(str(input, "nag"), NAG_MAP, "nag") ?? "normal",
        });
        const dayText = (days as number[])
          .slice()
          .sort()
          .map((d) => WEEKDAYS_SHORT[d])
          .join(", ");
        return {
          content: `Created routine ${id}: "${nameStr}" ${dayText} at ${t} with ${items.length} items`,
          action: { label: "Routine", text: `${nameStr} · ${dayText} ${formatClock(t)}`, undo: { kind: "routine", id } },
        };
      }

      case "add_routine_items": {
        const id = str(input, "id", true)!;
        const r = store.getState().routines.find((x) => x.id === id);
        if (!r) throw new InputError(`No routine with id ${id}`);
        const items = strings(input, "items");
        store.saveRoutine({ ...r, items: [...r.items, ...items.map((text) => ({ id: uid(), text }))] });
        return {
          content: `Added ${items.length} items to "${r.name}"`,
          action: { label: "Updated", text: `${r.name}: ${items.join(", ")}` },
        };
      }

      case "remember": {
        const text = str(input, "text", true)!;
        if (!store.getState().settings.memoryEnabled) {
          throw new InputError("Memory is turned off. The user can turn it on under Memory.");
        }
        const id = store.addMemory(text, "assistant");
        return { content: `Saved memory ${id}: ${text}`, action: { label: "Remembered", text, undo: { kind: "memory", id } } };
      }

      case "forget": {
        const id = str(input, "id", true)!;
        const m = store.getState().memories.find((x) => x.id === id);
        if (!m) throw new InputError(`No memory with id ${id}`);
        store.deleteMemory(id);
        return { content: `Forgot: ${m.text}`, action: { label: "Forgot", text: m.text } };
      }

      case "set_subject_items": {
        const subject = str(input, "subject", true)!;
        const items = strings(input, "items");
        const { school } = store.getState();
        const existing = school.subjects.find((s) => s.name.toLowerCase() === subject.toLowerCase());
        if (existing) {
          store.updateSchool({ subjects: school.subjects.map((s) => (s.id === existing.id ? { ...s, items } : s)) });
        } else {
          store.updateSchool({
            subjects: [...school.subjects, { id: slug(subject) + "-" + uid().slice(0, 4), name: subject, items }],
          });
        }
        return {
          content: `${subject}: ${items.join(", ")}${existing ? "" : " (new subject, not on the schedule yet)"}`,
          action: { label: "School", text: `${subject}: ${items.join(", ")}` },
        };
      }

      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  } catch (e) {
    const message = e instanceof InputError ? e.message : "Unexpected error";
    return { content: message, isError: true, action: { label: "Couldn't do", text: message, error: true } };
  }
}
