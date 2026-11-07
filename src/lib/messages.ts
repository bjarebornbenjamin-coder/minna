import type { Tone } from "./types";

function pick<T>(arr: T[], n: number): T {
  return arr[Math.min(n, arr.length - 1)];
}

/** Reminder text that gets more insistent the more times we've nagged */
export function reminderMessage(title: string, tone: Tone, nagCount: number, name?: string): string {
  const who = name ? `${name}, ` : "";
  const lower = title.charAt(0).toLowerCase() + title.slice(1);
  const variants: Record<Tone, string[]> = {
    varm: [
      `${who}time to ${lower}`,
      `Hey again. Have you had a chance to ${lower}?`,
      `${who}one more gentle nudge: ${lower}. It'll feel good once it's done.`,
      `I'm not giving up ${title}. Tap Done when it's finished.`,
    ],
    saklig: [`Reminder: ${title}.`, `Reminder again: ${title}.`, `Not done yet: ${title}.`, `Still not done: ${title}.`],
    rolig: [
      `${who}${who ? lower : title}. Your brain asked me to tell you.`,
      `Psst… ${lower}. I have nothing better to do than nag you.`,
      `Third time's the charm? ${title}.`,
      `Still open: ${title}. Now is a good time.`,
    ],
  };
  return pick(variants[tone], nagCount);
}

export function checklistMessage(listName: string, remaining: string[], tone: Tone, nagCount: number): string {
  const list = remaining.slice(0, 4).join(", ") + (remaining.length > 4 ? "…" : "");
  const variants: Record<Tone, string[]> = {
    varm: [`${listName}: don't forget ${list}`, `Got everything? Still left: ${list}`, `Almost there. Left: ${list}`],
    saklig: [`${listName}. Left: ${list}.`, `${listName} not finished. Left: ${list}.`],
    rolig: [`${listName}. ${list} feel left out.`, `Left: ${list}. They keep asking me to nag you.`],
  };
  return pick(variants[tone], nagCount);
}

export function greeting(now: Date, name: string): string {
  const h = now.getHours();
  const part = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}
