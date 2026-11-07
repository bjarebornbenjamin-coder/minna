import type { Tone } from "./types";

function pick<T>(arr: T[], n: number): T {
  return arr[Math.min(n, arr.length - 1)];
}

/** Text till en påminnelse, blir mer enträgen ju fler gånger vi tjatat */
export function reminderMessage(title: string, tone: Tone, nagCount: number, name?: string): string {
  const who = name ? `${name}, ` : "";
  const lower = title.charAt(0).toLowerCase() + title.slice(1);
  const variants: Record<Tone, string[]> = {
    varm: [
      `${who}dags att ${lower} 💛`,
      `Hej igen! Har du hunnit ${lower}?`,
      `${who}jag påminner en gång till: ${lower}. Det känns skönt när det är klart!`,
      `Nu ger jag mig inte 😊 ${title}, tryck på Klar när det är gjort.`,
    ],
    saklig: [
      `Påminnelse: ${title}.`,
      `Påminnelse igen: ${title}.`,
      `Ej klarmarkerat: ${title}.`,
      `Fortfarande ej klart: ${title}.`,
    ],
    rolig: [
      `${who}${who ? lower : title}! Din hjärna bad mig säga det. 🧠`,
      `Psst… ${lower}. Jag har inget bättre för mig än att tjata. 😇`,
      `Tredje gången gillt? ${title}! 📣`,
      `Okej, nu låter jag som en mamma: ${title.toUpperCase()}! 🙃`,
    ],
  };
  return pick(variants[tone], nagCount);
}

export function checklistMessage(listName: string, remaining: string[], tone: Tone, nagCount: number): string {
  const list = remaining.slice(0, 4).join(", ") + (remaining.length > 4 ? "…" : "");
  const variants: Record<Tone, string[]> = {
    varm: [`${listName}: glöm inte ${list} 💛`, `Har du fått med allt? Kvar: ${list}`, `Snart klart! Kvar: ${list}`],
    saklig: [`${listName}. Kvar: ${list}.`, `${listName}, ej klar. Kvar: ${list}.`],
    rolig: [`${listName}! ${list} känner sig bortglömda. 🥺`, `Kvar: ${list}. De tjatar på mig att tjata på dig. 📣`],
  };
  return pick(variants[tone], nagCount);
}

export function greeting(now: Date, name: string): string {
  const h = now.getHours();
  const part = h < 5 ? "God natt" : h < 10 ? "God morgon" : h < 17 ? "Hej" : "God kväll";
  return name ? `${part}, ${name}!` : `${part}!`;
}
