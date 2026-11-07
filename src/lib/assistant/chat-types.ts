/** Provider-neutral chat format (works with both OpenAI and Claude) */

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

export interface UserMessage {
  role: "user";
  text: string;
}

export interface AssistantMessage {
  role: "assistant";
  text: string;
  toolCalls: ToolCall[];
  /** The provider's original reply, which must be sent back unchanged (used by Claude) */
  raw?: unknown;
  provider?: "openai" | "anthropic";
}

export interface ToolResultMessage {
  role: "tool";
  results: { id: string; content: string; isError?: boolean }[];
}

export type ChatMessage = UserMessage | AssistantMessage | ToolResultMessage;

export interface TurnResult {
  message: AssistantMessage;
  stop: "tool_use" | "end" | "refusal";
}

/** Verktygsdefinition i JSON Schema-form */
export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
