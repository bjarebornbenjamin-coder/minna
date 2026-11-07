"use client";

import { useState } from "react";
import { AREA_IDS, AREAS, TONES } from "@/lib/areas";
import { addDays, atTime } from "@/lib/dates";
import { defaultRoutines } from "@/lib/defaults";
import { useStore } from "@/lib/store";
import type { AreaId, Tone } from "@/lib/types";

const AREA_DESC: Record<AreaId, string> = {
  privat: "Vardag, hem, familj, räkningar, hälsa",
  jobb: "Möten, deadlines, uppföljningar",
  skola: "Schema, packlistor, prov och inlämningar",
};

export function Onboarding() {
  const { updateSettings, saveRoutine, addReminder } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [areas, setAreas] = useState<AreaId[]>(["privat"]);
  const [tone, setTone] = useState<Tone>("varm");

  const toggleArea = (a: AreaId) =>
    setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const finish = () => {
    for (const r of defaultRoutines(areas)) saveRoutine(r);
    const tomorrow = addDays(new Date(), 1);
    addReminder({
      title: "Testa Minna: bocka av den här påminnelsen",
      area: areas[0],
      due: new Date(Date.now() + 60000).toISOString(),
      repeat: "ingen",
      nag: "normal",
    });
    if (areas.includes("jobb")) {
      addReminder({
        title: "Följ upp mejl som väntar på svar",
        area: "jobb",
        due: atTime(tomorrow, "09:00").toISOString(),
        repeat: "ingen",
        nag: "normal",
      });
    }
    updateSettings({ name: name.trim(), areas, tone, onboarded: true });
  };

  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-3xl font-bold tracking-tight">Minna</h1>
          <p className="text-zinc-500 mt-1">Din assistent som kommer ihåg åt dig, och tjatar tills det är gjort.</p>
        </div>

        <div className="card p-6">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(1);
              }}
            >
              <label className="label" htmlFor="name">
                Vad heter du?
              </label>
              <input
                id="name"
                className="input"
                autoFocus
                placeholder="Ditt förnamn"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button className="btn-primary w-full mt-4">Fortsätt</button>
            </form>
          )}

          {step === 1 && (
            <div>
              <p className="font-medium mb-1">Vad vill du ha hjälp med?</p>
              <p className="text-sm text-zinc-500 mb-4">Välj ett eller flera områden. Du kan ändra det senare.</p>
              <div className="flex flex-col gap-2">
                {AREA_IDS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArea(a)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                      areas.includes(a)
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className="text-2xl">{AREAS[a].emoji}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{AREAS[a].label}</span>
                      <span className="block text-sm text-zinc-500">{AREA_DESC[a]}</span>
                    </span>
                    <span className="text-violet-600 text-xl">{areas.includes(a) ? "✓" : ""}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary" onClick={() => setStep(0)}>
                  Tillbaka
                </button>
                <button className="btn-primary flex-1" disabled={areas.length === 0} onClick={() => setStep(2)}>
                  Fortsätt
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="font-medium mb-1">Hur ska jag låta?</p>
              <p className="text-sm text-zinc-500 mb-4">Så här formulerar jag mina påminnelser.</p>
              <div className="flex flex-col gap-2">
                {(Object.keys(TONES) as Tone[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      tone === t
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className="block font-medium">{TONES[t].label}</span>
                    <span className="block text-sm text-zinc-500">”{TONES[t].example}”</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Tillbaka
                </button>
                <button className="btn-primary flex-1" onClick={finish}>
                  Kom igång 🚀
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-zinc-400 mt-4">Allt sparas bara på den här enheten.</p>
      </div>
    </div>
  );
}
