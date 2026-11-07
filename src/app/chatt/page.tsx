"use client";

import { useEffect, useRef, useState } from "react";
import type { AssistantMessage, ChatMessage, ToolResultMessage, TurnResult } from "@/lib/assistant/chat-types";
import { buildContext } from "@/lib/assistant/context";
import { executeTool, type ChatAction } from "@/lib/assistant/execute";
import { useStore } from "@/lib/store";

interface ChatState {
  messages: ChatMessage[];
  /** verktygsanropets id -> vad som hände */
  actions: Record<string, ChatAction>;
}

const CHAT_KEY = "minna:chat:v2";
const MAX_STEPS = 8;

function loadChat(): ChatState {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (raw) return JSON.parse(raw) as ChatState;
  } catch {
    // ignorera
  }
  return { messages: [], actions: {} };
}

function saveChat(c: ChatState) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(c));
  } catch {
    // full lagring
  }
}

const SUGGESTIONS: Record<string, string[]> = {
  skola: ["Jag har kemiprov på torsdag", "Imorgon har vi idrott, påminn mig om gympakläderna"],
  jobb: ["Jag lovade skicka offerten till Erik på fredag", "Påminn mig att förbereda mötet med Anna imorgon kl 10"],
  privat: ["Ring tandläkaren imorgon förmiddag", "Gör en packlista för gymmet måndagar och torsdagar"],
};

/* ---------- Röstinmatning (Web Speech API) ---------- */
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function ChatPage() {
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [chat, setChat] = useState<ChatState>({ messages: [], actions: {} });
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [listening, setListening] = useState(false);
  const [speechOk, setSpeechOk] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setChat(loadChat());
    setLoaded(true);
    setSpeechOk(!!getSpeechRecognition());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length, busy]);

  const update = (c: ChatState) => {
    setChat(c);
    saveChat(c);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(null);
    setInput("");
    setBusy(true);

    let state: ChatState = {
      messages: [...chat.messages, { role: "user", text: trimmed }],
      actions: { ...chat.actions },
    };
    update(state);
    const startLength = chat.messages.length;

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(storeRef.current.getState().settings.accessCode && {
              "x-minna-code": storeRef.current.getState().settings.accessCode,
            }),
          },
          body: JSON.stringify({ messages: state.messages, context: buildContext(storeRef.current.getState()) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Inget svar från Claude: ta bort användarens meddelande om vi inte hunnit längre, så att det kan skickas igen
          if (state.messages.length === startLength + 1) {
            state = { ...state, messages: state.messages.slice(0, startLength) };
            update(state);
            setInput(trimmed);
          }
          setError({ message: data.message ?? "Något gick fel.", code: data.error });
          return;
        }

        const turn = data as TurnResult;
        // Svaret sparas oförändrat så att det kan skickas tillbaka nästa gång
        state = { ...state, messages: [...state.messages, turn.message] };
        update(state);

        if (turn.stop === "refusal") {
          setError({ message: "Det där kan jag tyvärr inte hjälpa till med." });
          return;
        }
        if (turn.stop !== "tool_use" || turn.message.toolCalls.length === 0) return;

        const results: ToolResultMessage["results"] = [];
        const actions = { ...state.actions };
        for (const call of turn.message.toolCalls) {
          const outcome = executeTool(call.name, call.input, storeRef.current);
          results.push({ id: call.id, content: outcome.content, ...(outcome.isError && { isError: true }) });
          if (outcome.action) actions[call.id] = outcome.action;
        }
        // Alla resultat i ett och samma meddelande
        state = { messages: [...state.messages, { role: "tool", results }], actions };
        update(state);
      }
    } catch {
      setError({ message: "Kunde inte nå servern. Är du uppkopplad?" });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const undo = (toolUseId: string) => {
    const action = chat.actions[toolUseId];
    if (!action?.undo || action.undone) return;
    if (action.undo.kind === "reminder") store.deleteReminder(action.undo.id);
    else store.deleteRoutine(action.undo.id);
    update({ ...chat, actions: { ...chat.actions, [toolUseId]: { ...action, undone: true } } });
  };

  const toggleMic = () => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "sv-SE";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input ? input.trimEnd() + " " : "";
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(base + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  if (!loaded) return null;

  const areas = store.state.settings.areas;
  const suggestions = areas.flatMap((a) => SUGGESTIONS[a] ?? []).slice(0, 4);
  const name = store.state.settings.name;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8rem)] md:min-h-[calc(100dvh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Chatta med Minna</h1>
        {chat.messages.length > 0 && (
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={() => {
              if (confirm("Starta en ny chatt? Påminnelserna finns kvar.")) update({ messages: [], actions: {} });
            }}
          >
            Ny chatt
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {chat.messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-medium">{name ? `Hej ${name}! ` : "Hej! "}Vad ska jag hålla koll på?</p>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
              Skriv som till en person. Jag lägger in påminnelser och checklistor åt dig. Du kan räkna upp flera saker på
              en gång.
            </p>
            <div className="flex flex-col gap-2 mt-6 max-w-sm mx-auto">
              {suggestions.map((s) => (
                <button key={s} className="card py-2.5 text-sm text-left hover:border-violet-300 dark:hover:border-violet-800" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.messages.map((m, i) => (
          <MessageView key={i} msg={m} actions={chat.actions} onUndo={undo} />
        ))}

        {busy && (
          <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit">
            <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {error && (
          <div className="card border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-sm">
            <p className="font-medium text-rose-700 dark:text-rose-300">{error.message}</p>
            {error.code === "missing_key" && (
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                Lägg in din OpenAI-nyckel som miljövariabeln OPENAI_API_KEY (i Vercel: Settings → Environment Variables) och
                publicera om.
              </p>
            )}
            {error.code === "forbidden" && (
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">Ange åtkomstkoden under Inställningar → Chatt.</p>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="sticky bottom-20 md:bottom-4 mt-4 flex items-end gap-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          ref={inputRef}
          className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-base sm:text-sm max-h-40"
          rows={1}
          placeholder={listening ? "Jag lyssnar…" : "Skriv till Minna…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          aria-label="Meddelande"
        />
        {speechOk && (
          <button
            type="button"
            onClick={toggleMic}
            className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center transition ${
              listening ? "bg-rose-500 text-white animate-pulse" : "bg-zinc-100 dark:bg-zinc-800"
            }`}
            aria-label={listening ? "Sluta lyssna" : "Prata"}
          >
            🎤
          </button>
        )}
        <button className="btn-primary h-10 shrink-0" disabled={busy || !input.trim()}>
          Skicka
        </button>
      </form>
    </div>
  );
}

function MessageView({
  msg,
  actions,
  onUndo,
}: {
  msg: ChatMessage;
  actions: Record<string, ChatAction>;
  onUndo: (id: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 text-white px-4 py-2.5 whitespace-pre-wrap">
        {msg.text}
      </div>
    );
  }
  if (msg.role === "tool") return null; // resultat visas som åtgärder under assistentens svar

  const m: AssistantMessage = msg;
  const text = m.text.trim();

  return (
    <div className="self-start max-w-[90%] flex flex-col gap-2">
      {text && (
        <div className="rounded-2xl rounded-bl-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 whitespace-pre-wrap">
          {text.replace(/\*\*(.+?)\*\*/g, "$1")}
        </div>
      )}
      {m.toolCalls.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {m.toolCalls.map((t) => {
            const a = actions[t.id];
            if (!a) return null;
            return (
              <li
                key={t.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  a.error
                    ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                    : a.undone
                      ? "border-zinc-200 dark:border-zinc-800 opacity-50 line-through"
                      : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                }`}
              >
                <span>{a.icon}</span>
                <span className="flex-1 min-w-0">{a.text}</span>
                {a.undo && !a.undone && (
                  <button className="btn-ghost text-xs" onClick={() => onUndo(t.id)}>
                    Ångra
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
