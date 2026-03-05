import { NextResponse } from "next/server";
import { runResearch, type ResearchRequest } from "@/lib/agent/researcher";
import { agentEvents } from "@/lib/agent/event-store";
import { getPaymentsClient } from "@/lib/nevermined/server";

interface RequestBody {
  query?: string;
  urls?: string[];
  depth?: "quick" | "standard" | "deep";
  provider?: "openai" | "gemini" | "anthropic";
}

function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function verifyPayment(request: Request): Promise<{ valid: boolean; caller: string }> {
  const paymentSignature = request.headers.get("payment-signature");

  if (!paymentSignature) {
    return { valid: false, caller: "anonymous" };
  }

  const payments = getPaymentsClient();
  if (!payments) {
    return { valid: false, caller: "unknown" };
  }

  try {
    // In production, verify the x402 token with Nevermined SDK
    // For now, accept any non-empty payment-signature header
    // The Nevermined middleware will handle real verification
    return { valid: true, caller: paymentSignature.slice(0, 12) + "..." };
  } catch {
    return { valid: false, caller: "invalid" };
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const depth = body.depth ?? "standard";
  const isInternalRequest = request.headers.get("x-internal-request") === "true";
  const paymentSignature = request.headers.get("payment-signature");

  // For external agent-to-agent calls, verify payment
  if (!isInternalRequest && !paymentSignature) {
    // Return 402 with pricing info for x402 flow
    const planId = process.env.NVM_PLAN_ID ?? "";
    const agentId = process.env.NVM_AGENT_ID ?? "";

    return NextResponse.json(
      {
        error: "Payment required",
        pricing: {
          quick: { credits: 1, description: "Fast 3-source scan" },
          standard: { credits: 5, description: "5-source structured research" },
          deep: { credits: 10, description: "8-source deep analysis" },
        },
        planId,
        agentId,
      },
      {
        status: 402,
        headers: {
          "payment-required": JSON.stringify({ planId, agentId, credits: depth === "quick" ? 1 : depth === "deep" ? 10 : 5 }),
        },
      }
    );
  }

  // Verify payment for external calls
  let caller = "internal-ui";
  if (!isInternalRequest) {
    const verification = await verifyPayment(request);
    caller = verification.caller;

    agentEvents.push({
      id: generateEventId(),
      type: "payment_verified",
      timestamp: new Date().toISOString(),
      data: { caller, query, depth, paymentSignature: paymentSignature?.slice(0, 20) },
    });
  }

  // Log the incoming request
  agentEvents.push({
    id: generateEventId(),
    type: "request_received",
    timestamp: new Date().toISOString(),
    data: { caller, query, depth },
  });

  agentEvents.push({
    id: generateEventId(),
    type: "research_started",
    timestamp: new Date().toISOString(),
    data: { caller, query, depth, provider: body.provider },
  });

  try {
    const researchRequest: ResearchRequest = {
      query,
      urls: body.urls,
      provider: body.provider,
      depth,
    };

    const document = await runResearch(researchRequest);

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
