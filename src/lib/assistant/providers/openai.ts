import OpenAI from "openai";
import type { ChatMessage, ToolCall, TurnResult } from "../chat-types";
import { ASSISTANT_TOOLS, SYSTEM_PROMPT } from "../tools";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
// Låg "reasoning effort" ger snabba svar i chatten. Sätt OPENAI_REASONING_EFFORT=off för modeller som inte stöder det.
const EFFORT = process.env.OPENAI_REASONING_EFFORT || "low";

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = ASSISTANT_TOOLS.map((t) => ({
  type: "function",
  function: { name: t.name, description: t.description, parameters: t.parameters },
}));

function toOpenAI(messages: ChatMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.text });
    } else if (m.role === "assistant") {
      out.push({
        role: "assistant",
        content: m.text || null,
        ...(m.toolCalls.length > 0 && {
          tool_calls: m.toolCalls.map((c) => ({
            id: c.id,
            type: "function" as const,
            function: { name: c.name, arguments: JSON.stringify(c.input ?? {}) },
          })),
        }),
      });
    } else {
      for (const r of m.results) {
        out.push({ role: "tool", tool_call_id: r.id, content: r.isError ? `FEL: ${r.content}` : r.content });
      }
    }
  }
  return out;
}

export async function runOpenAITurn(messages: ChatMessage[], context: string): Promise<TurnResult> {
  const client = new OpenAI();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      // Stabil instruktion först så att OpenAIs automatiska cache kan återanvända den
      { role: "developer", content: SYSTEM_PROMPT },
      { role: "developer", content: context },
      ...toOpenAI(messages),
    ],
    tools: TOOLS,
    ...(EFFORT !== "off" && { reasoning_effort: EFFORT as OpenAI.ReasoningEffort }),
  });

  const choice = completion.choices[0];
  const msg = choice?.message;
  if (!msg) throw new Error("Tomt svar från OpenAI");

  if (msg.refusal) {
    return { message: { role: "assistant", text: msg.refusal, toolCalls: [], provider: "openai" }, stop: "refusal" };
  }

  const toolCalls: ToolCall[] = (msg.tool_calls ?? [])
    .filter((c) => c.type === "function")
    .map((c) => {
      let input: unknown;
      try {
        input = JSON.parse(c.function.arguments || "{}");
      } catch {
        input = { __invalid_json: c.function.arguments };
      }
      return { id: c.id, name: c.function.name, input };
    });

  return {
    message: { role: "assistant", text: msg.content ?? "", toolCalls, provider: "openai" },
    stop: toolCalls.length > 0 ? "tool_use" : "end",
  };
}
