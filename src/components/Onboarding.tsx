"use client";

import Link from "next/link";
import { useState } from "react";
import { AREA_IDS, AREAS, TONES } from "@/lib/areas";
import { addDays, atTime } from "@/lib/dates";
import { defaultRoutines } from "@/lib/defaults";
import { useStore } from "@/lib/store";
import type { AreaId, Tone } from "@/lib/types";
import { Mark } from "./Mark";

const AREA_DESC: Record<AreaId, string> = {
  privat: "Everyday life, home, family, bills, health",
  jobb: "Meetings, deadlines, follow-ups",
  skola: "Schedule, packing lists, exams and assignments",
};

const STEPS = ["Name", "Areas", "Tone"];

export function Onboarding() {
  const { updateSettings, saveRoutine, addReminder } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [areas, setAreas] = useState<AreaId[]>(["privat"]);
  const [tone, setTone] = useState<Tone>("varm");

  const toggleArea = (a: AreaId) => setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const finish = () => {
    for (const r of defaultRoutines(areas)) saveRoutine(r);
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
        due: atTime(addDays(new Date(), 1), "09:00").toISOString(),
        repeat: "ingen",
        nag: "normal",
      });
    }
    updateSettings({ name: name.trim(), areas, tone, onboarded: true });
  };

  const option = (on: boolean) =>
    `flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
      on ? "border-ink bg-surface" : "border-line bg-transparent hover:border-ink/40"
    }`;

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-bg-2 lg:block">
        <h1 className="display pointer-events-none absolute left-10 top-10 text-[13vw] leading-[0.8] text-ink">
          Hello
          <br />
          there.
        </h1>
        <Mark size="78%" draw decorative className="absolute -bottom-[14%] -right-[16%]" />
      </div>

      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mark size={22} decorative />
            <span className="display text-2xl tracking-normal">
              Minna<span className="text-vermilion">.</span>
            </span>
          </Link>
          <p className="text-xs text-ink-2">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <div className="my-auto w-full max-w-md py-12">
          <div className="mb-8 lg:hidden">
            <Mark size={72} draw />
          </div>
          <div key={step} className="animate-rise">
            {step === 0 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(1);
                }}
              >
                <h2 className="display text-6xl">What&apos;s your name?</h2>
                <p className="mt-3 text-ink-2">So Minna knows who it&apos;s talking to.</p>
                <input
                  id="name"
                  className="input mt-8"
                  autoFocus
                  placeholder="First name"
                  aria-label="First name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button className="btn-primary mt-4 w-full">Continue</button>
              </form>
            )}

            {step === 1 && (
              <div>
                <h2 className="display text-6xl">Where do you need help?</h2>
                <p className="mt-3 text-ink-2">Pick one or more. You can change this later.</p>
                <div className="mt-8 flex flex-col gap-2">
                  {AREA_IDS.map((a) => (
                    <button key={a} type="button" aria-pressed={areas.includes(a)} onClick={() => toggleArea(a)} className={option(areas.includes(a))}>
                      <span
                        aria-hidden
                        className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-sm border ${areas.includes(a) ? "border-ink bg-ink" : "border-ink-2/50"}`}
                      />
                      <span>
                        <span className="block font-medium">{AREAS[a].label}</span>
                        <span className="block text-sm text-ink-2">{AREA_DESC[a]}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
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
                <h2 className="display text-6xl">How should Minna sound?</h2>
                <p className="mt-3 text-ink-2">This is how your reminders will be worded.</p>
                <div className="mt-8 flex flex-col gap-2" role="radiogroup" aria-label="Tone">
                  {(Object.keys(TONES) as Tone[]).map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={tone === t} onClick={() => setTone(t)} className={option(tone === t)}>
                      <span>
                        <span className="block font-medium">{TONES[t].label}</span>
                        <span className="block text-sm text-ink-2">“{TONES[t].example}”</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <button className="btn-secondary" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button className="btn-primary flex-1" onClick={finish}>
                    Start using Minna
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-ink-2">Everything is stored on this device only.</p>
      </div>
    </div>
  );
}
