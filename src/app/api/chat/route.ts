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
  // OpenAI används om den nyckeln finns, annars Claude
  const provider = process.env.OPENAI_API_KEY ? "openai" : process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (!provider) {
    return fail("missing_key", "Ingen API-nyckel på servern (OPENAI_API_KEY eller ANTHROPIC_API_KEY).", 503);
  }

  // Valfri åtkomstkod så att inte vem som helst med länken kan använda (och betala för) chatten
  const code = process.env.MINNA_ACCESS_CODE;
  if (code && req.headers.get("x-minna-code") !== code) {
    return fail("forbidden", "Fel eller saknad åtkomstkod.", 401);
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return fail("bad_request", "Ogiltig förfrågan.", 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || typeof body.context !== "string") {
    return fail("bad_request", "Ogiltig förfrågan.", 400);
  }

  try {
    const result: TurnResult =
      provider === "openai"
        ? await runOpenAITurn(body.messages, body.context)
        : await runAnthropicTurn(body.messages, body.context);
    return Response.json(result);
  } catch (error) {
    // OpenAI-fel
    if (error instanceof OpenAI.AuthenticationError) return fail("auth", "OpenAI-nyckeln är ogiltig.", 502);
    if (error instanceof OpenAI.RateLimitError) {
      if (error.code === "insufficient_quota") {
        return fail(
          "quota",
          "OpenAI-kontot saknar krediter. Fyll på under Billing på platform.openai.com.",
          402,
        );
      }
      return fail("rate_limit", "För många förfrågningar just nu, försök igen om en stund.", 429);
    }
    if (error instanceof OpenAI.NotFoundError) {
      return fail("model", "Modellen finns inte för ditt konto. Byt OPENAI_MODEL.", 502);
    }
    if (error instanceof OpenAI.BadRequestError) {
      console.error("OpenAI bad request:", error.message);
      return fail("bad_request", "Konversationen kunde inte skickas. Testa att starta en ny chatt.", 400);
    }
    if (error instanceof OpenAI.APIError) {
      console.error(`OpenAI API error ${error.status}:`, error.message);
      return fail("api", "OpenAI svarar inte just nu. Försök igen.", 502);
    }
    // Claude-fel
    if (error instanceof Anthropic.AuthenticationError) return fail("auth", "Claude-nyckeln är ogiltig.", 502);
    if (error instanceof Anthropic.RateLimitError) {
      return fail("rate_limit", "För många förfrågningar just nu, försök igen om en stund.", 429);
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Claude bad request:", error.message);
      return fail("bad_request", "Konversationen kunde inte skickas. Testa att starta en ny chatt.", 400);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}:`, error.message);
      return fail("api", "Claude svarar inte just nu. Försök igen.", 502);
    }
    console.error(error);
    return fail("unknown", "Något gick fel.", 500);
  }
}
