import type { ToolDef } from "./chat-types";

const AREA = { type: "string", enum: ["privat", "jobb", "skola"], description: "Vilket område saken hör till" } as const;
const NAG = {
  type: "string",
  enum: ["av", "mild", "normal", "mamma"],
  description:
    "Tjat-nivå. av = ingen notis, mild = en notis, normal = påminner igen tills klart (standard), mamma = tjatar var 10:e minut. Använd mamma för saker som absolut inte får glömmas.",
} as const;
const REPEAT = {
  type: "string",
  enum: ["ingen", "dagligen", "vardagar", "veckovis"],
  description: "Upprepning, standard ingen",
} as const;
const LOCAL_TIME = {
  type: "string",
  description: "Lokal tid i formatet YYYY-MM-DDTHH:mm, t.ex. 2026-11-12T07:30",
} as const;

/** Verktyg som assistenten kan använda. De körs i webbläsaren, där användarens data finns. */
export const ASSISTANT_TOOLS: ToolDef[] = [
  {
    name: "create_reminder",
    description:
      "Skapar en påminnelse som ger notis vid angiven tid. Använd för allt användaren vill komma ihåg: saker att göra, ta med, deadlines, möten, samtal. Anropa en gång per sak; flera anrop i samma svar går bra.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Kort, konkret titel i imperativ, t.ex. 'Ta med engelskaboken'" },
        due: LOCAL_TIME,
        area: AREA,
        repeat: REPEAT,
        nag: NAG,
        notes: { type: "string", description: "Valfri anteckning med detaljer" },
      },
      required: ["title", "due", "area"],
      additionalProperties: false,
    },
  },
  {
    name: "update_reminder",
    description: "Ändrar en befintlig påminnelse (t.ex. flyttar tiden). Ange bara fälten som ska ändras.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Påminnelsens id från kontexten" },
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
    description: "Markerar en påminnelse som klar (upprepade flyttas till nästa gång). Använd när användaren säger att något är gjort.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_reminder",
    description: "Tar bort en påminnelse permanent. Använd bara när användaren uttryckligen ber om att ta bort den.",
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
      "Skapar en återkommande checklista (rutin) som dyker upp vissa veckodagar vid en viss tid och tjatar tills allt är avbockat, t.ex. 'Packa gymväskan' eller 'Innan du går hemifrån'.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        emoji: { type: "string", description: "En passande emoji" },
        area: AREA,
        time: { type: "string", description: "Tid HH:mm när listan ska påminna" },
        days: {
          type: "array",
          items: { type: "integer", minimum: 0, maximum: 6 },
          description: "Veckodagar: 0 = söndag, 1 = måndag ... 6 = lördag",
        },
        items: { type: "array", items: { type: "string" }, description: "Sakerna på listan" },
        nag: NAG,
      },
      required: ["name", "area", "time", "days", "items"],
      additionalProperties: false,
    },
  },
  {
    name: "add_routine_items",
    description: "Lägger till saker i en befintlig rutin/checklista.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Rutinens id från kontexten" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["id", "items"],
      additionalProperties: false,
    },
  },
  {
    name: "set_subject_items",
    description:
      "Skolschema: anger vad som ska med till ett ämne (ersätter listan). Skapar ämnet om det inte finns. Används för packlistorna kvällen innan.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Ämnets namn, t.ex. 'Engelska'" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["subject", "items"],
      additionalProperties: false,
    },
  },
];

export const SYSTEM_PROMPT = `Du är Minna, en personlig assistent i en app som hjälper användaren att komma ihåg saker, privat, på jobbet och i skolan. Appen påminner med notiser och "tjatar" tills saker är avbockade.

Så arbetar du:
- När användaren nämner något att komma ihåg, en deadline, ett prov, ett möte eller något att ta med: skapa påminnelser direkt med verktygen. Fråga bara om något är så oklart att du inte kan välja en rimlig tid.
- Välj rimliga tider själv: bara ett datum → 08:00 den dagen (eller 07:00 för saker att ta med till skolan/jobbet). "Ikväll" → 19:00. "Efter skolan/jobbet" → 16:00 respektive 17:30.
- Deadlines och prov: skapa en påminnelse för själva tillfället och en eller flera förberedande (t.ex. plugga dagen innan, börja med uppgiften några dagar innan).
- Saker att ta med: lägg påminnelsen kvällen innan (cirka 20:00) och använd tjat-nivå mamma.
- Välj område (privat/jobb/skola) utifrån sammanhanget bland användarens aktiva områden.
- Om användaren räknar upp många saker på en gång, skapa en påminnelse per sak i samma svar.
- Återkommande saker med flera delar (t.ex. packa gymväskan varje måndag) passar bättre som rutin.
- Ändra, bocka av eller ta bort befintliga saker med deras id från kontexten. Ta bara bort när användaren ber om det.
- Gör aldrig anspråk på att ha gjort något du inte gjort med ett verktyg.
- Kalender och mejl är inte kopplade än. Om användaren ber om det, säg att det kommer snart och erbjud en påminnelse i stället.

Stil:
- Svara på svenska, kort och vardagligt, som en omtänksam assistent. Följ användarens valda ton.
- Efter att du använt verktyg: bekräfta kort vad du lagt in, med dag och tid, utan att upprepa varje detalj. Appen visar redan en lista över det du gjort.
- Skriv vanlig text utan markdown-rubriker. Korta punktlistor med "- " går bra.`;
