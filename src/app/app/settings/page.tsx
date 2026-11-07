"use client";

import Link from "next/link";
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
    // Add default work routines the first time Work is turned on
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
      alert("Done! Your data has been restored.");
    } catch {
      alert("That file couldn't be read. Is it a Minna backup?");
    }
  };

  const toggleRow = (checked: boolean, onChange: (v: boolean) => void, title: string, desc: string) => (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#264eff]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-ink-2">{desc}</span>
      </span>
    </label>
  );

  return (
    <div>
      <p className="eyebrow">Settings</p>
      <h1 className="display mt-3 mb-2 text-[clamp(3.5rem,10vw,6.5rem)]">Your way.</h1>

      <h2 className="section-title">About you</h2>
      <div className="card flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" className="input" value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} />
        </div>
        <div>
          <label className="label">Tone</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TONES) as Tone[]).map((t) => (
              <button key={t} className={`seg ${settings.tone === t ? "seg-on" : ""}`} onClick={() => updateSettings({ tone: t })}>
                {TONES[t].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-2">Example: “{reminderMessage("Pack your gym bag", settings.tone, 0, settings.name)}”</p>
        </div>
      </div>

      <h2 className="section-title">Areas</h2>
      <div className="card flex flex-col gap-2">
        {AREA_IDS.map((a) => (
          <label key={a} className="flex items-center gap-3 cursor-pointer py-1">
            <input type="checkbox" className="h-4 w-4 accent-[#264eff]" checked={settings.areas.includes(a)} onChange={() => toggleArea(a)} />
            <span className="font-medium">{AREAS[a].label}</span>
          </label>
        ))}
      </div>

      {settings.areas.includes("jobb") && (
        <>
          <h2 className="section-title">Work hours</h2>
          <div className="card flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <input
                  type="time"
                  className="input"
                  value={settings.workHours.start}
                  onChange={(e) => updateSettings({ workHours: { ...settings.workHours, start: e.target.value } })}
                />
              </div>
              <div>
                <label className="label">End</label>
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
                    className={`seg flex-1 !px-0 !text-xs ${on ? "seg-on" : ""}`}
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
            {toggleRow(
              settings.quietWorkOutsideHours,
              (v) => updateSettings({ quietWorkOutsideHours: v }),
              "No work notifications outside work hours",
              "Work reminders wait until your next workday.",
            )}
          </div>
        </>
      )}

      <h2 className="section-title">Chat</h2>
      <div className="card flex flex-col gap-2">
        <label className="label" htmlFor="code">
          Access code
        </label>
        <input
          id="code"
          type="password"
          className="input"
          placeholder="Only if your server requires one"
          value={settings.accessCode ?? ""}
          onChange={(e) => updateSettings({ accessCode: e.target.value })}
          autoComplete="off"
        />
        <p className="text-xs text-ink-2">
          If MINNA_ACCESS_CODE is set on the server, enter the same code here. It stops others from using your chat (and your
          API key).
        </p>
      </div>

      <h2 className="section-title">Memory</h2>
      <div className="card flex items-center justify-between gap-4">
        <p className="text-sm">
          {settings.memoryEnabled ? `On. Minna remembers ${state.memories.length} ${state.memories.length === 1 ? "thing" : "things"}.` : "Off."}
          <span className="text-ink-2"> Review and control what Minna remembers.</span>
        </p>
        <Link href="/app/memory" className="btn-secondary shrink-0">
          Open
        </Link>
      </div>

      <h2 className="section-title">Notifications</h2>
      <div className="card flex flex-col gap-3">
        <p className="text-sm">
          Status:{" "}
          <strong>
            {perm === "granted" ? "On" : perm === "denied" ? "Blocked in your browser" : perm === "unsupported" ? "Not supported" : "Off"}
          </strong>
        </p>
        <div className="flex gap-2">
          {perm === "default" && (
            <button className="btn-primary" onClick={async () => setPerm(await requestNotificationPermission())}>
              Turn on notifications
            </button>
          )}
          {perm === "granted" && (
            <button
              className="btn-secondary"
              onClick={() => showSystemNotification("Minna", reminderMessage("Test notifications", settings.tone, 0, settings.name), "test")}
            >
              Send a test notification
            </button>
          )}
        </div>
        <p className="text-xs text-ink-2">
          Tip: add Minna to your home screen (Share, then “Add to Home Screen”) so it behaves like an app. Right now notifications
          arrive while the app is open or in the background. Notifications when it&apos;s fully closed are coming next.
        </p>
      </div>

      <h2 className="section-title">Your data</h2>
      <div className="card flex flex-col gap-3">
        <p className="text-sm text-ink-2">Everything is stored on this device only. Make a backup if you switch devices.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportData}>
            Export backup
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          <button
            className="btn-ghost !text-[#b42318]"
            onClick={() => {
              if (confirm("Delete everything and start over? This can't be undone.")) replaceState(initialState());
            }}
          >
            Delete everything
          </button>
        </div>
      </div>
    </div>
  );
}
