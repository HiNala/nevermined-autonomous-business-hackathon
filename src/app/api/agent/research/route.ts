import { NextResponse } from "next/server";
import { runResearch, type ResearchRequest } from "@/lib/agent/researcher";
import { agentEvents } from "@/lib/agent/event-store";
import { buildPaymentSpec, verifyX402Token, settleX402Token } from "@/lib/nevermined/server";
import type { SearchProvider, ScrapeProvider } from "@/lib/tool-settings";

interface RequestBody {
  query?: string;
  urls?: string[];
  depth?: "quick" | "standard" | "deep";
  provider?: "openai" | "gemini" | "anthropic";
  searchTool?: SearchProvider;
  scrapeTool?: ScrapeProvider;
}

const CREDIT_COSTS = { quick: 1, standard: 5, deep: 10 } as const;
const ENDPOINT = "/api/agent/research";

function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const depth = body.depth ?? "standard";
  const credits = CREDIT_COSTS[depth];
  const isInternalRequest = request.headers.get("x-internal-request") === "true";
  const paymentSignature = request.headers.get("payment-signature");

  // ── x402 Flow for external agent-to-agent calls ────────────────────
  if (!isInternalRequest && !paymentSignature) {
    // Step 1: No token → return 402 Payment Required
    const paymentRequired = buildPaymentSpec(ENDPOINT);
    const encoded = paymentRequired
      ? Buffer.from(JSON.stringify(paymentRequired)).toString("base64")
      : "";

    return NextResponse.json(
      {
        error: "Payment Required",
        pricing: {
          quick: { credits: 1, description: "Fast 3-source scan" },
          standard: { credits: 5, description: "5-source structured research" },
          deep: { credits: 10, description: "8-source deep analysis" },
        },
        planId: process.env.NVM_PLAN_ID ?? null,
        agentId: process.env.NVM_AGENT_ID ?? null,
      },
      {
        status: 402,
        headers: encoded ? { "payment-required": encoded } : {},
      }
    );
  }

  // Determine caller identity
  let caller = "internal-ui";

  if (!isInternalRequest && paymentSignature) {
    caller = paymentSignature.slice(0, 12) + "...";

    // Step 2: Verify token (does NOT burn credits)
    const verification = await verifyX402Token(paymentSignature, ENDPOINT, credits);

    agentEvents.push({
      id: generateEventId(),
      type: "payment_verified",
      timestamp: new Date().toISOString(),
      data: {
        caller,
        query,
        depth,
        credits,
        paymentSignature: paymentSignature.slice(0, 20),
      },
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason ?? "Invalid payment token" },
        { status: 402 }
      );
    }
  }

  // Log the incoming request
  agentEvents.push({
    id: generateEventId(),
    type: "request_received",
    timestamp: new Date().toISOString(),
    data: { caller, query, depth, credits },
  });

  agentEvents.push({
    id: generateEventId(),
    type: "research_started",
    timestamp: new Date().toISOString(),
    data: { caller, query, depth, provider: body.provider },
  });

  // Step 3: Execute — run the research
  try {
    const researchRequest: ResearchRequest = {
      query,
      urls: body.urls,
      provider: body.provider,
      depth,
      searchTool: body.searchTool,
      scrapeTool: body.scrapeTool,
    };

    const document = await runResearch(researchRequest);

    // Step 4: Settle — burn credits after successful execution
    if (!isInternalRequest && paymentSignature) {
      const settlement = await settleX402Token(paymentSignature, ENDPOINT, credits);

      agentEvents.push({
        id: generateEventId(),
        type: "payment_verified",
        timestamp: new Date().toISOString(),
        data: {
          caller,
          query,
          credits: settlement.creditsRedeemed ?? credits,
        },
      });
    }

    agentEvents.push({
      id: generateEventId(),
      type: "research_complete",
      timestamp: new Date().toISOString(),
      data: {
        caller,
        query,
        depth,
        credits: document.creditsUsed,
        provider: document.provider,
        model: document.model,
        durationMs: document.durationMs,
        documentId: document.id,
      },
    });

    return NextResponse.json({
      status: "success",
      document,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Research failed";

    agentEvents.push({
      id: generateEventId(),
      type: "error",
      timestamp: new Date().toISOString(),
      data: { caller, query, error: errorMessage },
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
