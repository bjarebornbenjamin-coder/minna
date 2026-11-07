"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mark, type MarkState } from "@/components/Mark";
import { RichText } from "@/components/RichText";
import type { AssistantMessage, ChatMessage, ToolResultMessage, TurnResult } from "@/lib/assistant/chat-types";
import { buildContext } from "@/lib/assistant/context";
import { executeTool, type ChatAction } from "@/lib/assistant/execute";
import { useStore } from "@/lib/store";

interface ChatState {
  messages: ChatMessage[];
  /** tool call id -> what happened */
  actions: Record<string, ChatAction>;
}

const CHAT_KEY = "minna:chat:v2";
const MAX_STEPS = 8;
/** How many recent messages are sent to the assistant */
const HISTORY_LIMIT = 40;

/** Keeps the latest messages, always starting at a user message so tool calls stay paired */
function recent(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= HISTORY_LIMIT) return messages;
  let start = messages.length - HISTORY_LIMIT;
  while (start < messages.length && messages[start].role !== "user") start++;
  return messages.slice(start);
}

function loadChat(): ChatState {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatState;
      // Older saved actions used an "icon" field
      for (const a of Object.values(parsed.actions ?? {})) {
        const legacy = a as ChatAction & { icon?: string };
        if (!legacy.label) legacy.label = legacy.error ? "Couldn't do" : "Done";
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return { messages: [], actions: {} };
}

function saveChat(c: ChatState) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(c));
  } catch {
    // storage full
  }
}

const SUGGESTIONS: Record<string, string[]> = {
  skola: ["Explain photosynthesis like I'm 14", "I have a chemistry exam on Thursday, help me plan", "Quiz me on World War II"],
  jobb: ["Write a short email asking to move my meeting to Friday", "Help me plan a week with three deadlines"],
  privat: ["What can I cook with eggs, spinach and rice?", "Remind me to call the dentist tomorrow morning"],
};
const GENERAL = ["Write a message to my teacher that I'm sick today", "Help me plan my week"];

/* Voice input (Web Speech API) */
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
  const [phase, setPhase] = useState<MarkState>("idle");
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const flash = (p: MarkState, ms = 1600) => {
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    setPhase(p);
    phaseTimer.current = setTimeout(() => setPhase("idle"), ms);
  };

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
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    setPhase("thinking");
    let didSomething = false;

    let state: ChatState = { messages: [...chat.messages, { role: "user", text: trimmed }], actions: { ...chat.actions } };
    update(state);
    const startLength = chat.messages.length;

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        const code = storeRef.current.getState().settings.accessCode;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(code && { "x-minna-code": code }) },
          body: JSON.stringify({ messages: recent(state.messages), context: buildContext(storeRef.current.getState()) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // No answer: remove the user's message if we got no further, so it can be sent again
          if (state.messages.length === startLength + 1) {
            state = { ...state, messages: state.messages.slice(0, startLength) };
            update(state);
            setInput(trimmed);
          }
          setError({ message: data.message ?? "Something went wrong.", code: data.error });
          flash("error", 2500);
          return;
        }

        const turn = data as TurnResult;
        // The reply is stored unchanged so it can be sent back next time
        state = { ...state, messages: [...state.messages, turn.message] };
        update(state);

        if (turn.stop === "refusal") {
          setError({ message: "Sorry, I can't help with that." });
          flash("error", 2500);
          return;
        }
        if (turn.stop !== "tool_use" || turn.message.toolCalls.length === 0) {
          if (didSomething) flash("complete");
          else setPhase("idle");
          return;
        }
        setPhase("executing");
        didSomething = true;

        const results: ToolResultMessage["results"] = [];
        const actions = { ...state.actions };
        for (const call of turn.message.toolCalls) {
          const outcome = executeTool(call.name, call.input, storeRef.current);
          results.push({ id: call.id, content: outcome.content, ...(outcome.isError && { isError: true }) });
          if (outcome.action) actions[call.id] = outcome.action;
        }
        // All results in one message
        state = { messages: [...state.messages, { role: "tool", results }], actions };
        update(state);
        setPhase("thinking");
      }
    } catch {
      setError({ message: "Couldn't reach the server. Check your connection and try again." });
      flash("error", 2500);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const undo = (toolUseId: string) => {
    const action = chat.actions[toolUseId];
    if (!action?.undo || action.undone) return;
    if (action.undo.kind === "reminder") store.deleteReminder(action.undo.id);
    else if (action.undo.kind === "routine") store.deleteRoutine(action.undo.id);
    else store.deleteMemory(action.undo.id);
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
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input ? input.trimEnd() + " " : "";
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(base + t);
    };
    const stop = () => {
      setListening(false);
      setPhase((p) => (p === "listening" ? "idle" : p));
    };
    rec.onend = stop;
    rec.onerror = stop;
    recRef.current = rec;
    setListening(true);
    setPhase("listening");
    rec.start();
  };

  if (!loaded) return null;

  const areas = store.state.settings.areas;
  const suggestions = [...areas.flatMap((a) => SUGGESTIONS[a] ?? []), ...GENERAL].slice(0, 5);
  const name = store.state.settings.name;
  const empty = chat.messages.length === 0;

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col md:min-h-[calc(100dvh-7rem)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Chat</p>
          {!empty && <h1 className="display mt-2 text-5xl">Minna</h1>}
        </div>
        <div className="flex items-center gap-4">
          {!empty && (
            <button
              className="btn-ghost"
              disabled={busy}
              onClick={() => {
                if (confirm("Start a new chat? Your reminders stay.")) update({ messages: [], actions: {} });
              }}
            >
              New chat
            </button>
          )}
          {!empty && <Mark size={44} state={phase} />}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 pt-6">
        {empty && (
          <div className="grid items-center gap-8 py-4 sm:grid-cols-[1fr_auto]">
            <div className="animate-rise">
              <h1 className="display text-[clamp(3.25rem,9vw,6rem)]">
                {name ? `Hi, ${name}.` : "Hi."}
                <br />
                What can I help with?
              </h1>
              <p className="mt-4 max-w-md text-ink-2">
                Ask anything: homework, an email, a plan for the week. When something needs remembering, Minna adds the
                reminder for you.
              </p>
            </div>
            <Mark size={170} state={phase} draw className="mx-auto" />
            <div className="sm:col-span-2">
              <p className="eyebrow mb-2">Try</p>
              <ul className="border-t border-line">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      className="group flex w-full items-center justify-between border-b border-line py-3 text-left transition-colors hover:text-accent-ink-ink"
                      onClick={() => send(s)}
                    >
                      <span>{s}</span>
                      <span className="text-ink-2 transition-transform group-hover:translate-x-1 group-hover:text-accent-ink" aria-hidden>
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {chat.messages.map((m, i) => (
          <MessageView key={i} msg={m} actions={chat.actions} onUndo={undo} />
        ))}

        {busy && (
          <p className="text-sm text-ink-2" role="status">
            {phase === "executing" ? "Updating your plans" : "Thinking"}
            <span className="inline-block w-6 animate-pulse">…</span>
          </p>
        )}

        {error && (
          <div className="border-l-2 border-[#b42318] bg-surface px-4 py-3 text-sm" role="alert">
            <p className="font-medium">{error.message}</p>
            {error.code === "missing_key" && (
              <p className="mt-1 text-ink-2">
                Add your OpenAI key as the environment variable OPENAI_API_KEY (Vercel: Settings, then Environment Variables) and
                redeploy.
              </p>
            )}
            {error.code === "forbidden" && (
              <p className="mt-1 text-ink-2">
                Enter the access code in{" "}
                <Link href="/app/settings" className="link">
                  Settings
                </Link>
                .
              </p>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="sticky bottom-20 mt-6 flex items-end gap-2 rounded-md border border-line bg-surface p-2 transition-colors focus-within:border-ink md:bottom-6"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          ref={inputRef}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none focus-visible:outline-none placeholder:text-ink-2/70 sm:text-sm"
          rows={1}
          placeholder={listening ? "Listening" : "Ask Minna anything"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          aria-label="Message"
        />
        {speechOk && (
          <button
            type="button"
            onClick={toggleMic}
            className={`h-10 shrink-0 rounded-md px-3 text-sm transition-colors ${
              listening ? "bg-ink text-white" : "text-ink-2 hover:bg-bg hover:text-ink"
            }`}
            aria-pressed={listening}
          >
            {listening ? "Stop" : "Speak"}
          </button>
        )}
        <button className="btn-primary h-10 shrink-0" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

function MessageView({ msg, actions, onUndo }: { msg: ChatMessage; actions: Record<string, ChatAction>; onUndo: (id: string) => void }) {
  if (msg.role === "user") {
    return (
      <div className="max-w-[85%] self-end whitespace-pre-wrap rounded-md bg-ink px-4 py-2.5 text-white animate-fade">{msg.text}</div>
    );
  }
  if (msg.role === "tool") return null; // results are shown as actions under the assistant's reply

  const m: AssistantMessage = msg;
  const text = m.text.trim();

  return (
    <div className="flex max-w-[92%] flex-col gap-2 self-start animate-fade">
      {text && (
        <div className="group/msg">
          <RichText text={text} />
          <CopyButton text={text} />
        </div>
      )}
      {m.toolCalls.length > 0 && (
        <ul className="border-l border-line pl-4">
          {m.toolCalls.map((t) => {
            const a = actions[t.id];
            if (!a) return null;
            return (
              <li key={t.id} className={`flex items-baseline gap-3 py-1 text-sm ${a.undone ? "line-through opacity-40" : ""}`}>
                <span className={`w-24 shrink-0 text-xs font-medium uppercase tracking-wide ${a.error ? "text-[#b42318]" : "text-accent-ink"}`}>
                  {a.undone ? "Undone" : a.label}
                </span>
                <span className="min-w-0 flex-1">{a.text}</span>
                {a.undo && !a.undone && (
                  <button className="btn-ghost text-xs" onClick={() => onUndo(t.id)}>
                    Undo
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn-ghost mt-1 -ml-2 text-xs opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 group-hover/msg:opacity-100"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard blocked
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
