import { NextResponse } from "next/server";
import { runBuyer, type BuyerRequest } from "@/lib/agent/buyer";
import { agentEvents } from "@/lib/agent/event-store";
import { ledger, AGENT_PROFILES } from "@/lib/agent/transactions";
import { validateQuery, sanitizeError, checkRateLimit, getClientId } from "@/lib/security";
import type { ToolSettings } from "@/lib/tool-settings";

interface RequestBody {
  query?: string;
  maxCredits?: number;
  preferredTypes?: ("dataset" | "report" | "model" | "service" | "other")[];
  targetDids?: string[];
  toolSettings?: ToolSettings;
}

function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`buyer:${clientId}`, 10, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  const body = (await request.json()) as RequestBody;
  const validation = validateQuery(body.query);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const query = validation.sanitized!;

  agentEvents.push({
    id: generateEventId(),
    type: "request_received",
    timestamp: new Date().toISOString(),
    data: { caller: "internal-ui", query, agent: "buyer" },
  });

  try {
    const buyerRequest: BuyerRequest = {
      query,
      maxCredits: body.maxCredits,
      preferredTypes: body.preferredTypes,
      targetDids: body.targetDids,
    };

    const result = await runBuyer(buyerRequest);

    // Record each successful purchase in the global transaction ledger
    const buyer = AGENT_PROFILES.buyer;
    for (const asset of result.purchased.filter((p) => p.status === "success")) {
      ledger.record({
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: asset.purchasedAt,
        from: { id: buyer.id, name: buyer.name },
        to: { id: "marketplace", name: `Marketplace: ${asset.provider}` },
        credits: asset.creditsPaid,
        purpose: `Standalone purchase: "${asset.name}"`,
        artifactId: asset.id,
        status: "completed",
        durationMs: asset.durationMs,
      });
    }

    agentEvents.push({
      id: generateEventId(),
      type: "buyer_complete",
      timestamp: new Date().toISOString(),
      data: {
        caller: "internal-ui",
        query,
        agent: "buyer",
        discovered: result.discovered.length,
        purchased: result.purchased.length,
        totalCreditsSpent: result.totalCreditsSpent,
        durationMs: result.durationMs,
      },
    });

    return NextResponse.json({ status: "success", result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Buyer agent failed";

    agentEvents.push({
      id: generateEventId(),
      type: "error",
      timestamp: new Date().toISOString(),
      data: { caller: "internal-ui", query, agent: "buyer", error: errorMessage },
    });

    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
