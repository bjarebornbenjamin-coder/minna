import Anthropic from "@anthropic-ai/sdk";
import { ASSISTANT_TOOLS, SYSTEM_PROMPT } from "@/lib/assistant/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.MINNA_MODEL || "claude-opus-5-5";

interface ChatRequest {
  messages: Anthropic.Beta.BetaMessageParam[];
  context: string;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "missing_key", message: "ANTHROPIC_API_KEY saknas på servern." },
      { status: 503 },
    );
  }

  // Valfri åtkomstkod så att inte vem som helst med länken kan använda (och betala för) chatten
  const code = process.env.MINNA_ACCESS_CODE;
  if (code && req.headers.get("x-minna-code") !== code) {
    return Response.json({ error: "forbidden", message: "Fel eller saknad åtkomstkod." }, { status: 401 });
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "bad_request", message: "Ogiltig förfrågan." }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || typeof body.context !== "string") {
    return Response.json({ error: "bad_request", message: "Ogiltig förfrågan." }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Chatt: låg effort räcker och ger snabba svar
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      // Om modellen avböjer av säkerhetsskäl får en reservmodell ta över i samma anrop
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        // Stabil del först så att den kan cachas
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        // Aktuell tid och användarens data ändras varje gång
        { type: "text", text: body.context },
      ],
      tools: ASSISTANT_TOOLS,
      messages: body.messages,
    });

    return Response.json({ content: response.content, stop_reason: response.stop_reason });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "auth", message: "API-nyckeln är ogiltig." }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "rate_limit", message: "För många förfrågningar just nu, försök igen om en stund." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Claude bad request:", error.message);
      return Response.json(
        { error: "bad_request", message: "Konversationen kunde inte skickas. Testa att starta en ny chatt." },
        { status: 400 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}:`, error.message);
      return Response.json({ error: "api", message: "Claude svarar inte just nu. Försök igen." }, { status: 502 });
    }
    console.error(error);
    return Response.json({ error: "unknown", message: "Något gick fel." }, { status: 500 });
  }
}
