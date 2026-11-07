"use client";

import { useState } from "react";
import { AREA_IDS, AREAS, TONES } from "@/lib/areas";
import { addDays, atTime } from "@/lib/dates";
import { defaultRoutines } from "@/lib/defaults";
import { useStore } from "@/lib/store";
import type { AreaId, Tone } from "@/lib/types";
import { CoreView } from "./core/CoreView";

const AREA_DESC: Record<AreaId, string> = {
  privat: "Everyday life, home, family, bills, health",
  jobb: "Meetings, deadlines, follow-ups",
  skola: "Schedule, packing lists, exams and assignments",
};

export function Onboarding() {
  const { updateSettings, saveRoutine, addReminder } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [areas, setAreas] = useState<AreaId[]>(["privat"]);
  const [tone, setTone] = useState<Tone>("varm");

  const toggleArea = (a: AreaId) => setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const finish = () => {
    for (const r of defaultRoutines(areas)) saveRoutine(r);
    const tomorrow = addDays(new Date(), 1);
    addReminder({
      title: "Try Minna: check off this reminder",
      area: areas[0],
      due: new Date(Date.now() + 60000).toISOString(),
      repeat: "ingen",
      nag: "normal",
    });
    if (areas.includes("jobb")) {
      addReminder({
        title: "Follow up on emails waiting for a reply",
        area: "jobb",
        due: atTime(tomorrow, "09:00").toISOString(),
        repeat: "ingen",
        nag: "normal",
      });
    }
    updateSettings({ name: name.trim(), areas, tone, onboarded: true });
  };

  const choice = (on: boolean) =>
    `flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
      on
        ? "border-violet-400/60 bg-violet-500/15 shadow-[0_0_30px_-10px_rgba(139,92,246,0.9)]"
        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
    }`;

  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <CoreView size={200} state={step === 2 ? "listening" : "idle"} />
          <h1 className="font-display text-4xl font-semibold tracking-tight gradient-text -mt-2">Minna</h1>
          <p className="text-zinc-400 mt-2">Your assistant that remembers for you, and keeps nudging until it&apos;s done.</p>
        </div>

        <div className="card p-6 animate-fadeup" key={step}>
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(1);
              }}
            >
              <label className="label" htmlFor="name">
                What&apos;s your name?
              </label>
              <input
                id="name"
                className="input"
                autoFocus
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button className="btn-primary w-full mt-4">Continue</button>
            </form>
          )}

          {step === 1 && (
            <div>
              <p className="font-medium mb-1">What do you want help with?</p>
              <p className="text-sm text-zinc-400 mb-4">Pick one or more. You can change this later.</p>
              <div className="flex flex-col gap-2">
                {AREA_IDS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleArea(a)} className={choice(areas.includes(a))}>
                    <span className="text-2xl">{AREAS[a].emoji}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{AREAS[a].label}</span>
                      <span className="block text-sm text-zinc-400">{AREA_DESC[a]}</span>
                    </span>
                    <span className="text-cyan-300 text-lg">{areas.includes(a) ? "✓" : ""}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary" onClick={() => setStep(0)}>
                  Back
                </button>
                <button className="btn-primary flex-1" disabled={areas.length === 0} onClick={() => setStep(2)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="font-medium mb-1">How should I sound?</p>
              <p className="text-sm text-zinc-400 mb-4">This is how I&apos;ll word your reminders.</p>
              <div className="flex flex-col gap-2">
                {(Object.keys(TONES) as Tone[]).map((t) => (
                  <button key={t} type="button" onClick={() => setTone(t)} className={choice(tone === t)}>
                    <span className="flex-1">
                      <span className="block font-medium">{TONES[t].label}</span>
                      <span className="block text-sm text-zinc-400">“{TONES[t].example}”</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button className="btn-primary flex-1" onClick={finish}>
                  Get started
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-zinc-500 mt-4">Everything is stored on this device only.</p>
      </div>
    </div>
  );
}
