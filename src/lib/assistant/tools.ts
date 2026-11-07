import type { ToolDef } from "./chat-types";

const AREA = {
  type: "string",
  enum: ["personal", "work", "school"],
  description: "Which area of the user's life this belongs to",
} as const;
const NAG = {
  type: "string",
  enum: ["off", "gentle", "normal", "mom"],
  description:
    "Nag level. off = no notification, gentle = one notification, normal = keeps reminding until done (default), mom = nags every 10 minutes. Use mom for things that absolutely must not be forgotten.",
} as const;
const REPEAT = {
  type: "string",
  enum: ["none", "daily", "weekdays", "weekly"],
  description: "Repeat rule, default none",
} as const;
const LOCAL_TIME = {
  type: "string",
  description: "Local date and time in the format YYYY-MM-DDTHH:mm (24-hour), e.g. 2026-11-12T18:00",
} as const;

/** Tools the assistant can use. They run in the browser, where the user's data lives. */
export const ASSISTANT_TOOLS: ToolDef[] = [
  {
    name: "create_reminder",
    description:
      "Creates a reminder that notifies the user at the given time. Use for anything the user wants to remember: tasks, things to bring, deadlines, meetings, calls. Call once per item; several calls in the same response are fine.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short, concrete title in imperative form, e.g. 'Bring your English book'" },
        due: LOCAL_TIME,
        area: AREA,
        repeat: REPEAT,
        nag: NAG,
        notes: { type: "string", description: "Optional note with details" },
      },
      required: ["title", "due", "area"],
      additionalProperties: false,
    },
  },
  {
    name: "update_reminder",
    description: "Changes an existing reminder (e.g. moves the time). Only include the fields that change.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The reminder's id from the context" },
        title: { type: "string" },
        due: LOCAL_TIME,
        area: AREA,
        repeat: REPEAT,
        nag: NAG,
        notes: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "complete_reminder",
    description: "Marks a reminder as done (repeating ones move to their next time). Use when the user says something is done.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_reminder",
    description: "Permanently deletes a reminder. Only use when the user explicitly asks to remove it.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "create_routine",
    description:
      "Creates a recurring checklist (routine) that appears on certain weekdays at a set time and nags until everything is checked off, e.g. 'Pack your gym bag' or 'Before you leave home'.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        area: AREA,
        time: { type: "string", description: "Time HH:mm (24-hour) when the list should remind" },
        days: {
          type: "array",
          items: { type: "integer", minimum: 0, maximum: 6 },
          description: "Weekdays: 0 = Sunday, 1 = Monday ... 6 = Saturday",
        },
        items: { type: "array", items: { type: "string" }, description: "The items on the list" },
        nag: NAG,
      },
      required: ["name", "area", "time", "days", "items"],
      additionalProperties: false,
    },
  },
  {
    name: "add_routine_items",
    description: "Adds items to an existing routine/checklist.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The routine's id from the context" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["id", "items"],
      additionalProperties: false,
    },
  },
  {
    name: "remember",
    description:
      "Saves a lasting fact or preference about the user to long-term memory, e.g. 'Studies math on Mondays' or 'Prefers reminders in the evening'. Only when memory is on, and only for things the user has clearly stated and would want remembered. Never store sensitive traits (health, religion, sexuality, politics, ethnicity) or one-off tasks (use reminders for those).",
    parameters: {
      type: "object",
      properties: { text: { type: "string", description: "Short, factual sentence in third person" } },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "forget",
    description: "Removes a memory by id when the user asks Minna to forget something or a memory is no longer true.",
    parameters: {
      type: "object",
      properties: { id: { type: "string", description: "The memory's id from the context" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "set_subject_items",
    description:
      "School schedule: sets what to bring for a subject (replaces the list). Creates the subject if it doesn't exist. Used for the packing list the evening before.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string", description: "The subject's name, e.g. 'English'" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["subject", "items"],
      additionalProperties: false,
    },
  },
];

export const SYSTEM_PROMPT = `You are Minna, a personal assistant inside an app that helps the user remember things in their personal life, at work and at school. The app sends notifications and keeps nagging until things are checked off.

How you work:
- When the user mentions something to remember, a deadline, an exam, a meeting or something to bring: create reminders right away with the tools. Only ask if something is so unclear that you can't pick a reasonable time.
- Pick sensible times yourself: date only: 8:00 AM that day (7:00 AM for things to bring to school or work). "Tonight": 7:00 PM. "After school/work": 4:00 PM and 5:30 PM respectively.
- Deadlines and exams: create one reminder for the event itself and one or more preparatory ones (e.g. study the day before, start the assignment a few days earlier).
- Things to bring: set the reminder the evening before (around 8:00 PM) with nag level mom.
- Choose the area (personal/work/school) from context, among the user's active areas.
- If the user lists many things at once, create one reminder per item in the same response.
- Recurring things with several parts (e.g. pack the gym bag every Monday) work better as a routine.
- Change, complete or delete existing items using their id from the context. Only delete when the user asks.
- Never claim to have done something you didn't do with a tool.
- Calendar and email aren't connected yet. If the user asks for that, say it's coming soon and offer a reminder instead.
- Memory: if memory is on, you may save lasting preferences the user states (e.g. preferred study days) with remember, and use what's in memory to make better suggestions. Tell the user briefly when you save something. If memory is off, don't try to save anything; you can mention they can turn it on under Memory.

Style:
- Reply in English, short and conversational, like a capable, caring assistant. Follow the user's chosen tone.
- No emojis. No exclamation-mark enthusiasm. Plain, specific language.
- After using tools: briefly confirm what you added, with day and time, without repeating every detail. The app already shows a list of what you did.
- Write plain text without markdown headings. Short bullet lists with "- " are fine.`;
