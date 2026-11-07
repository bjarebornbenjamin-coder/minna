"use client";

import { useState } from "react";
import { LOCALE } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { Memory } from "@/lib/types";

export default function MemoryPage() {
  const { state, updateSettings, addMemory, updateMemory, deleteMemory, clearMemories } = useStore();
  const enabled = !!state.settings.memoryEnabled;
  const [draft, setDraft] = useState("");

  return (
    <div>
      <p className="eyebrow">Memory</p>
      <h1 className="display mt-3 text-[clamp(3.5rem,10vw,6.5rem)]">Your second brain.</h1>
      <p className="mt-4 max-w-lg text-ink-2">
        With memory on, Minna can keep lasting preferences, like when you prefer to study or which projects you&apos;re on, and
        use them to make better suggestions. You decide what stays.
      </p>

      <div className="card mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-medium">{enabled ? "Memory is on" : "Memory is off"}</p>
          <p className="mt-1 text-sm text-ink-2">
            {enabled
              ? "Minna can save things you tell it and will show you each time it does."
              : "Minna won't save anything. Existing memories are kept here but not used."}
          </p>
        </div>
        <button className={enabled ? "btn-secondary" : "btn-primary"} onClick={() => updateSettings({ memoryEnabled: !enabled })}>
          {enabled ? "Turn off" : "Turn on memory"}
        </button>
      </div>

      <ul className="mt-6 grid gap-x-8 gap-y-2 text-sm text-ink-2 sm:grid-cols-2">
        <li>Stored only on this device, never shared.</li>
        <li>Sent to the assistant only while memory is on.</li>
        <li>Minna doesn&apos;t save health, religion, politics or similar personal traits.</li>
        <li>Edit or delete anything, at any time.</li>
      </ul>

      <h2 className="section-title flex justify-between">
        <span>What Minna remembers</span>
        <span className="tabular-nums">{state.memories.length}</span>
      </h2>

      {state.memories.length === 0 ? (
        <p className="py-6 text-ink-2">
          Nothing yet. {enabled ? "Add something below, or tell Minna in the chat, e.g. “I study best in the evening.”" : ""}
        </p>
      ) : (
        <ul>
          {state.memories.map((m) => (
            <MemoryRow key={m.id} m={m} onSave={(t) => updateMemory(m.id, t)} onDelete={() => deleteMemory(m.id)} />
          ))}
        </ul>
      )}

      {enabled && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            addMemory(draft.trim(), "user");
            setDraft("");
          }}
        >
          <input className="input" placeholder="e.g. I have football practice on Tuesdays" aria-label="New memory" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button className="btn-secondary" disabled={!draft.trim()}>
            Add
          </button>
        </form>
      )}

      {state.memories.length > 0 && (
        <button
          className="btn-ghost mt-8 -ml-2 !text-[#b42318]"
          onClick={() => {
            if (confirm("Delete everything Minna remembers? This can't be undone.")) clearMemories();
          }}
        >
          Delete all memories
        </button>
      )}
    </div>
  );
}

function MemoryRow({ m, onSave, onDelete }: { m: Memory; onSave: (t: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(m.text);
  const date = new Date(m.updatedAt ?? m.createdAt).toLocaleDateString(LOCALE, { month: "short", day: "numeric" });

  return (
    <li className="flex items-start gap-4 border-b border-line py-3.5">
      {editing ? (
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) onSave(text.trim());
            setEditing(false);
          }}
        >
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} autoFocus aria-label="Edit memory" />
          <button className="btn-primary">Save</button>
        </form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p>{m.text}</p>
            <p className="mt-1 text-xs text-ink-2">
              {m.source === "assistant" ? "Saved by Minna" : "Added by you"} · {date}
            </p>
          </div>
          <button className="btn-ghost text-xs" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="btn-ghost text-xs" onClick={onDelete} aria-label={`Delete memory: ${m.text}`}>
            Delete
          </button>
        </>
      )}
    </li>
  );
}
