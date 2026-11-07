import { AREAS } from "../areas";
import { formatDue, WEEKDAYS_SHORT } from "../dates";
import { uid } from "../defaults";
import { slug } from "../checklists";
import type { useStore } from "../store";
import type { AreaId, NagLevel, Repeat } from "../types";

type Store = ReturnType<typeof useStore>;

/** Det användaren ser i chatten för varje sak assistenten gjort */
export interface ChatAction {
  icon: string;
  text: string;
  /** Om det går att ångra: vad som ska tas bort */
  undo?: { kind: "reminder" | "routine"; id: string };
  undone?: boolean;
  error?: boolean;
}

export interface ToolOutcome {
  content: string;
  isError?: boolean;
  action?: ChatAction;
}

const AREA_IDS: AreaId[] = ["privat", "jobb", "skola"];
const NAGS: NagLevel[] = ["av", "mild", "normal", "mamma"];
const REPEATS: Repeat[] = ["ingen", "dagligen", "vardagar", "veckovis"];

class InputError extends Error {}

function str(input: Record<string, unknown>, key: string, required = false): string | undefined {
  const v = input[key];
  if (v === undefined || v === null || v === "") {
    if (required) throw new InputError(`Fältet ${key} saknas`);
    return undefined;
  }
  if (typeof v !== "string") throw new InputError(`Fältet ${key} måste vara text`);
  return v.trim();
}

function oneOf<T extends string>(value: string | undefined, allowed: T[], key: string): T | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value as T)) throw new InputError(`Ogiltigt värde för ${key}: ${value}`);
  return value as T;
}

function parseLocal(value: string): string {
  // "YYYY-MM-DDTHH:mm" tolkas som lokal tid av Date
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new InputError(`Ogiltig tid: ${value}`);
  return d.toISOString();
}

function strings(input: Record<string, unknown>, key: string): string[] {
  const v = input[key];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new InputError(`${key} måste vara en lista med text`);
  return (v as string[]).map((x) => x.trim()).filter(Boolean);
}

function area(store: Store, value: string | undefined): AreaId {
  const a = oneOf(value, AREA_IDS, "area") ?? store.getState().settings.areas[0] ?? "privat";
  if (!store.getState().settings.areas.includes(a)) {
    throw new InputError(`Området ${a} är inte aktivt. Aktiva: ${store.getState().settings.areas.join(", ")}`);
  }
  return a;
}

/** Kör ett verktygsanrop från Claude mot appens data */
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
          repeat: oneOf(str(input, "repeat"), REPEATS, "repeat") ?? "ingen",
          nag: oneOf(str(input, "nag"), NAGS, "nag") ?? "normal",
          notes: str(input, "notes"),
        });
        return {
          content: `Skapade påminnelse ${id}: "${title}" ${formatDue(due)}`,
          action: {
            icon: AREAS[a].emoji,
            text: `${title} · ${formatDue(due)}`,
            undo: { kind: "reminder", id },
          },
        };
      }

      case "update_reminder": {
        const id = str(input, "id", true)!;
        const existing = store.getState().reminders.find((r) => r.id === id);
        if (!existing) throw new InputError(`Ingen påminnelse med id ${id}`);
        const dueRaw = str(input, "due");
        const areaRaw = str(input, "area");
        const patch = {
          ...(str(input, "title") !== undefined && { title: str(input, "title") }),
          ...(dueRaw !== undefined && { due: parseLocal(dueRaw), done: false }),
          ...(areaRaw !== undefined && { area: area(store, areaRaw) }),
          ...(input.repeat !== undefined && { repeat: oneOf(str(input, "repeat"), REPEATS, "repeat") }),
          ...(input.nag !== undefined && { nag: oneOf(str(input, "nag"), NAGS, "nag") }),
          ...(input.notes !== undefined && { notes: str(input, "notes") }),
        };
        store.updateReminder(id, patch);
        const title = patch.title ?? existing.title;
        const due = patch.due ?? existing.due;
        return {
          content: `Uppdaterade ${id}: "${title}" ${formatDue(due)}`,
          action: { icon: "✏️", text: `Ändrade: ${title} · ${formatDue(due)}` },
        };
      }

      case "complete_reminder": {
        const id = str(input, "id", true)!;
        const r = store.getState().reminders.find((x) => x.id === id);
        if (!r) throw new InputError(`Ingen påminnelse med id ${id}`);
        if (r.done) return { content: `"${r.title}" var redan klar` };
        store.completeReminder(id);
        return {
          content: r.repeat === "ingen" ? `Markerade "${r.title}" som klar` : `"${r.title}" klar, flyttad till nästa gång`,
          action: { icon: "✅", text: `Klar: ${r.title}` },
        };
      }

      case "delete_reminder": {
        const id = str(input, "id", true)!;
        const r = store.getState().reminders.find((x) => x.id === id);
        if (!r) throw new InputError(`Ingen påminnelse med id ${id}`);
        store.deleteReminder(id);
        return { content: `Tog bort "${r.title}"`, action: { icon: "🗑️", text: `Borttagen: ${r.title}` } };
      }

      case "create_routine": {
        const nameStr = str(input, "name", true)!;
        const time = str(input, "time", true)!;
        if (!/^\d{1,2}:\d{2}$/.test(time)) throw new InputError(`Ogiltig tid: ${time}`);
        const days = input.days;
        if (!Array.isArray(days) || days.length === 0 || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
          throw new InputError("days måste vara en lista med heltal 0–6");
        }
        const items = strings(input, "items");
        if (items.length === 0) throw new InputError("Listan behöver minst en sak");
        const id = uid();
        store.saveRoutine({
          id,
          name: nameStr,
          emoji: str(input, "emoji") || "✅",
          area: area(store, str(input, "area")),
          time: time.padStart(5, "0"),
          days: [...new Set(days as number[])],
          items: items.map((text) => ({ id: uid(), text })),
          nag: oneOf(str(input, "nag"), NAGS, "nag") ?? "normal",
        });
        const dayText = (days as number[])
          .slice()
          .sort()
          .map((d) => WEEKDAYS_SHORT[d].toLowerCase())
          .join(", ");
        return {
          content: `Skapade rutin ${id}: "${nameStr}" ${dayText} kl ${time} med ${items.length} saker`,
          action: {
            icon: str(input, "emoji") || "📋",
            text: `Rutin: ${nameStr} · ${dayText} ${time}`,
            undo: { kind: "routine", id },
          },
        };
      }

      case "add_routine_items": {
        const id = str(input, "id", true)!;
        const r = store.getState().routines.find((x) => x.id === id);
        if (!r) throw new InputError(`Ingen rutin med id ${id}`);
        const items = strings(input, "items");
        store.saveRoutine({ ...r, items: [...r.items, ...items.map((text) => ({ id: uid(), text }))] });
        return {
          content: `La till ${items.length} saker i "${r.name}"`,
          action: { icon: r.emoji, text: `${r.name}: + ${items.join(", ")}` },
        };
      }

      case "set_subject_items": {
        const subject = str(input, "subject", true)!;
        const items = strings(input, "items");
        const { school } = store.getState();
        const existing = school.subjects.find((s) => s.name.toLowerCase() === subject.toLowerCase());
        if (existing) {
          store.updateSchool({
            subjects: school.subjects.map((s) => (s.id === existing.id ? { ...s, items } : s)),
          });
        } else {
          store.updateSchool({ subjects: [...school.subjects, { id: slug(subject) + "-" + uid().slice(0, 4), name: subject, items }] });
        }
        return {
          content: `${subject}: ${items.join(", ")}${existing ? "" : " (nytt ämne, inte inlagt i schemat än)"}`,
          action: { icon: "🎒", text: `${subject}: ${items.join(", ")}` },
        };
      }

      default:
        return { content: `Okänt verktyg: ${name}`, isError: true };
    }
  } catch (e) {
    const message = e instanceof InputError ? e.message : "Oväntat fel";
    return { content: message, isError: true, action: { icon: "⚠️", text: message, error: true } };
  }
}
