import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ChatMessage, TurnResult } from "@/lib/assistant/chat-types";
import { runAnthropicTurn } from "@/lib/assistant/providers/anthropic";
import { runOpenAITurn } from "@/lib/assistant/providers/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatRequest {
  messages: ChatMessage[];
  context: string;
}

function fail(error: string, message: string, status: number) {
  return Response.json({ error, message }, { status });
}

export async function POST(req: Request) {
  // OpenAI is used if that key exists, otherwise Claude
  const provider = process.env.OPENAI_API_KEY ? "openai" : process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (!provider) {
    return fail("missing_key", "No API key on the server (OPENAI_API_KEY or ANTHROPIC_API_KEY).", 503);
  }

  // Optional access code so not just anyone with the link can use (and pay for) the chat
  const code = process.env.MINNA_ACCESS_CODE;
  if (code && req.headers.get("x-minna-code") !== code) {
    return fail("forbidden", "Wrong or missing access code.", 401);
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return fail("bad_request", "Invalid request.", 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || typeof body.context !== "string") {
    return fail("bad_request", "Invalid request.", 400);
  }

  try {
    const result: TurnResult =
      provider === "openai"
        ? await runOpenAITurn(body.messages, body.context)
        : await runAnthropicTurn(body.messages, body.context);
    return Response.json(result);
  } catch (error) {
    // OpenAI-fel
    if (error instanceof OpenAI.AuthenticationError) return fail("auth", "The OpenAI key is invalid.", 502);
    if (error instanceof OpenAI.RateLimitError) {
      if (error.code === "insufficient_quota") {
        return fail(
          "quota",
          "Your OpenAI account is out of credits. Add some under Billing at platform.openai.com.",
          402,
        );
      }
      return fail("rate_limit", "Too many requests right now, try again in a moment.", 429);
    }
    if (error instanceof OpenAI.NotFoundError) {
      return fail("model", "That model isn't available for your account. Change OPENAI_MODEL.", 502);
    }
    if (error instanceof OpenAI.BadRequestError) {
      console.error("OpenAI bad request:", error.message);
      return fail("bad_request", "The conversation couldn't be sent. Try starting a new chat.", 400);
    }
    if (error instanceof OpenAI.APIError) {
      console.error(`OpenAI API error ${error.status}:`, error.message);
      return fail("api", "OpenAI isn't responding right now. Try again.", 502);
    }
    // Claude-fel
    if (error instanceof Anthropic.AuthenticationError) return fail("auth", "The Claude key is invalid.", 502);
    if (error instanceof Anthropic.RateLimitError) {
      return fail("rate_limit", "Too many requests right now, try again in a moment.", 429);
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Claude bad request:", error.message);
      return fail("bad_request", "The conversation couldn't be sent. Try starting a new chat.", 400);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}:`, error.message);
      return fail("api", "Claude isn't responding right now. Try again.", 502);
    }
    console.error(error);
    return fail("unknown", "Something went wrong.", 500);
  }
}
