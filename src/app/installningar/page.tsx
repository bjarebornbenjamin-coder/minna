"use client";

import { useEffect, useRef, useState } from "react";
import { AREA_IDS, AREAS, TONES } from "@/lib/areas";
import { WEEKDAYS_SHORT } from "@/lib/dates";
import { defaultRoutines, initialState } from "@/lib/defaults";
import { reminderMessage } from "@/lib/messages";
import { notificationsSupported, requestNotificationPermission, showSystemNotification } from "@/lib/notify";
import { useStore } from "@/lib/store";
import type { AppState, Tone } from "@/lib/types";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function SettingsPage() {
  const { state, updateSettings, replaceState, saveRoutine } = useStore();
  const { settings } = state;
  const [perm, setPerm] = useState<string>("…");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPerm(notificationsSupported() ? Notification.permission : "unsupported");
  }, []);

  const toggleArea = (a: (typeof AREA_IDS)[number]) => {
    const has = settings.areas.includes(a);
    if (has && settings.areas.length === 1) return;
    const areas = has ? settings.areas.filter((x) => x !== a) : [...settings.areas, a];
    updateSettings({ areas });
    // Lägg till standardrutiner för jobb första gången området slås på
    if (!has && a === "jobb" && !state.routines.some((r) => r.area === "jobb")) {
      defaultRoutines(["jobb"]).filter((r) => r.area === "jobb").forEach(saveRoutine);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `minna-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as AppState;
      if (data.version !== 1 || !Array.isArray(data.reminders)) throw new Error();
      replaceState({ ...initialState(), ...data });
      alert("Klart! Dina data är återställda.");
    } catch {
      alert("Filen kunde inte läsas. Är det en backup från Minna?");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Inställningar</h1>

      <h2 className="section-title">Om dig</h2>
      <div className="card flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="name">
            Namn
          </label>
          <input id="name" className="input" value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} />
        </div>
        <div>
          <label className="label">Ton</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TONES) as Tone[]).map((t) => (
              <button key={t} className={`seg ${settings.tone === t ? "seg-on" : ""}`} onClick={() => updateSettings({ tone: t })}>
                {TONES[t].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Exempel: ”{reminderMessage("Ta med gympapåsen", settings.tone, 0, settings.name)}”
          </p>
        </div>
      </div>

      <h2 className="section-title">Områden</h2>
      <div className="card flex flex-col gap-2">
        {AREA_IDS.map((a) => (
          <label key={a} className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              className="h-5 w-5 accent-violet-600"
              checked={settings.areas.includes(a)}
              onChange={() => toggleArea(a)}
            />
            <span className="text-xl">{AREAS[a].emoji}</span>
            <span className="font-medium">{AREAS[a].label}</span>
          </label>
        ))}
      </div>

      {settings.areas.includes("jobb") && (
        <>
          <h2 className="section-title">Arbetstid</h2>
          <div className="card flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Börjar</label>
                <input
                  type="time"
                  className="input"
                  value={settings.workHours.start}
                  onChange={(e) => updateSettings({ workHours: { ...settings.workHours, start: e.target.value } })}
                />
              </div>
              <div>
                <label className="label">Slutar</label>
                <input
                  type="time"
                  className="input"
                  value={settings.workHours.end}
                  onChange={(e) => updateSettings({ workHours: { ...settings.workHours, end: e.target.value } })}
                />
              </div>
            </div>
            <div className="flex gap-1.5">
              {DAY_ORDER.map((d) => {
                const on = settings.workHours.days.includes(d);
                return (
                  <button
                    key={d}
                    className={`seg flex-1 px-0 text-xs ${on ? "seg-on" : ""}`}
                    onClick={() =>
                      updateSettings({
                        workHours: {
                          ...settings.workHours,
                          days: on ? settings.workHours.days.filter((x) => x !== d) : [...settings.workHours.days, d],
                        },
                      })
                    }
                  >
                    {WEEKDAYS_SHORT[d]}
                  </button>
                );
              })}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 mt-0.5 accent-violet-600"
                checked={settings.quietWorkOutsideHours}
                onChange={(e) => updateSettings({ quietWorkOutsideHours: e.target.checked })}
              />
              <span>
                <span className="block font-medium text-sm">Inga jobbnotiser utanför arbetstid</span>
                <span className="block text-xs text-zinc-500">Jobbpåminnelser väntar till nästa arbetsdag.</span>
              </span>
            </label>
          </div>
        </>
      )}

      <h2 className="section-title">Chatt</h2>
      <div className="card flex flex-col gap-2">
        <label className="label" htmlFor="code">
          Åtkomstkod
        </label>
        <input
          id="code"
          type="password"
          className="input"
          placeholder="Bara om din server kräver en kod"
          value={settings.accessCode ?? ""}
          onChange={(e) => updateSettings({ accessCode: e.target.value })}
          autoComplete="off"
        />
        <p className="text-xs text-zinc-500">
          Om MINNA_ACCESS_CODE är satt på servern måste samma kod anges här. Det hindrar andra från att använda din
          chatt (och din API-nyckel).
        </p>
      </div>

      <h2 className="section-title">Notiser</h2>
      <div className="card flex flex-col gap-3">
        <p className="text-sm">
          Status:{" "}
          <strong>
            {perm === "granted" ? "På ✅" : perm === "denied" ? "Blockerade i webbläsaren" : perm === "unsupported" ? "Stöds inte" : "Av"}
          </strong>
        </p>
        <div className="flex gap-2">
          {perm === "default" && (
            <button className="btn-primary" onClick={async () => setPerm(await requestNotificationPermission())}>
              Slå på notiser
            </button>
          )}
          {perm === "granted" && (
            <button
              className="btn-secondary"
              onClick={() =>
                showSystemNotification("🧠 Minna", reminderMessage("Testa notiser", settings.tone, 0, settings.name), "test")
              }
            >
              Skicka testnotis
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          Tips: lägg appen på hemskärmen (Dela → ”Lägg till på hemskärmen”) så att den beter sig som en app. Just nu går
          notiser när appen är öppen eller ligger i bakgrunden. Notiser när den är helt stängd kommer i nästa version.
        </p>
      </div>

      <h2 className="section-title">Dina data</h2>
      <div className="card flex flex-col gap-3">
        <p className="text-sm text-zinc-500">Allt sparas bara på den här enheten. Gör en backup om du byter enhet.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportData}>
            ⬇️ Exportera backup
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            ⬆️ Importera
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
          <button
            className="btn-ghost text-rose-600"
            onClick={() => {
              if (confirm("Radera allt och börja om? Det går inte att ångra.")) replaceState(initialState());
            }}
          >
            Radera allt
          </button>
        </div>
      </div>
    </div>
  );
}
