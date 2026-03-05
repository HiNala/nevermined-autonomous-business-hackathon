import { NextResponse } from "next/server";
import { runBuyer, type BuyerRequest } from "@/lib/agent/buyer";
import { agentEvents } from "@/lib/agent/event-store";

interface RequestBody {
  query?: string;
  maxCredits?: number;
  preferredTypes?: ("dataset" | "report" | "model" | "service" | "other")[];
  targetDids?: string[];
}

function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

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

    agentEvents.push({
      id: generateEventId(),
      type: "research_complete",
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

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
