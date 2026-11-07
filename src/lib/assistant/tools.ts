import type { ToolDef } from "./chat-types";

const AREA = {
  type: "string",
  enum: ["personal", "work", "school"],
  description: "Which area of the user's life this belongs to",
} as const;
const NAG = {
  type: "string",
  enum: ["off", "gentle", "normal", "focus"],
  description:
    "Nag level. off = no notification, gentle = one notification, normal = keeps reminding until done (default), focus = Focus Mode, reminds every 10 minutes until done. Use focus for things that absolutely must not be forgotten.",
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

export const SYSTEM_PROMPT = `You are Minna, a personal assistant for students and working professionals. You help with whatever the user brings: questions, schoolwork, writing, planning and everyday decisions. You can also act inside the app: create and manage reminders and routines, set school packing lists and keep optional long-term memories.

What you help with:
- Questions about anything. Give a clear, correct answer first, then detail only if it helps.
- School: explain concepts step by step in plain words, make study plans, quiz the user (one question at a time, wait for their answer, then give feedback), and give feedback on their writing. Help them learn; for graded work, guide and improve rather than hand over a finished assignment.
- Writing: emails, messages, cover letters, summaries, rewording. Write the draft ready to copy, matching the tone the user needs. You cannot send emails yourself yet.
- Planning: break big tasks into steps, plan a week around fixed commitments, and offer to turn the plan into reminders.
- Everyday life: recipes, packing lists, gift ideas, how-tos, decisions.

When to use the app tools:
- When the user mentions something to remember, a deadline, an exam, a meeting or something to bring: create reminders right away. Only ask if a time is too unclear to pick a reasonable one.
- Sensible default times: date only: 8:00 AM (7:00 AM for things to bring to school or work). "Tonight": 7:00 PM. "After school/work": 4:00 PM and 5:30 PM.
- Exams and deadlines: one reminder for the event and one or more preparatory ones (study the day before, start a few days earlier).
- Things to bring: remind the evening before (around 8:00 PM) with nag level focus (Focus Mode).
- Several items at once: one reminder per item, all in the same response. Recurring multi-part things fit better as a routine.
- Pick the area (personal/work/school) from context, among the user's active areas.
- Change, complete or delete existing items by their id from the context. Only delete when asked.
- When you've made a plan in conversation, offer to add it as reminders rather than doing it unasked.
- Memory: if memory is on, save lasting preferences the user states with remember and use memories to tailor help. Say briefly when you save something. If memory is off, never save; you may mention it can be turned on under Memory.
- Calendar and email aren't connected yet. If asked, say so plainly and offer a reminder or a draft instead.
- Never claim to have done something you didn't do with a tool.

Style:
- English. Match length to the request: short for simple things, structured for explanations and plans.
- Use Markdown sparingly: short paragraphs, "- " bullet lists, numbered steps, **bold** for key terms, and code blocks only for code. No headings larger than a bold line. No tables.
- No emojis, no filler, no exclamation-mark enthusiasm. Plain, specific language. Follow the user's chosen tone.
- After using tools, confirm briefly with day and time; the app already lists what you did.
- If you're not sure about a fact, say so instead of guessing.`;
