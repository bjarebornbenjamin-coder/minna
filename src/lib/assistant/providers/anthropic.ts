import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ToolCall, TurnResult } from "../chat-types";
import { ASSISTANT_TOOLS, SYSTEM_PROMPT } from "../tools";

const MODEL = process.env.MINNA_MODEL || "claude-opus-5-5";

const TOOLS: Anthropic.Beta.BetaTool[] = ASSISTANT_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.parameters as Anthropic.Beta.BetaTool["input_schema"],
}));

function toAnthropic(messages: ChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  return messages.map((m): Anthropic.Beta.BetaMessageParam => {
    if (m.role === "user") return { role: "user", content: m.text };
    if (m.role === "assistant") {
      // Claudes eget svar skickas tillbaka oförändrat (krävs för thinking-block)
      if (m.provider === "anthropic" && Array.isArray(m.raw)) {
        return { role: "assistant", content: m.raw as Anthropic.Beta.BetaContentBlockParam[] };
      }
      const content: Anthropic.Beta.BetaContentBlockParam[] = [];
      if (m.text) content.push({ type: "text", text: m.text });
      for (const c of m.toolCalls) content.push({ type: "tool_use", id: c.id, name: c.name, input: c.input ?? {} });
      return { role: "assistant", content: content.length ? content : [{ type: "text", text: "…" }] };
    }
    return {
      role: "user",
      content: m.results.map((r) => ({
        type: "tool_result" as const,
        tool_use_id: r.id,
        content: r.content,
        ...(r.isError && { is_error: true }),
      })),
    };
  });
}

export async function runAnthropicTurn(messages: ChatMessage[], context: string): Promise<TurnResult> {
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: context },
    ],
    tools: TOOLS,
    messages: toAnthropic(messages),
  });

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const toolCalls: ToolCall[] = response.content
    .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use")
    .map((b) => ({ id: b.id, name: b.name, input: b.input }));

  return {
    message: { role: "assistant", text, toolCalls, raw: response.content, provider: "anthropic" },
    stop: response.stop_reason === "refusal" ? "refusal" : response.stop_reason === "tool_use" ? "tool_use" : "end",
  };
}
