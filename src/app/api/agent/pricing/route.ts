import { NextResponse } from "next/server";
import { listAvailableProviders } from "@/lib/ai/providers";

export async function GET() {
  const providers = listAvailableProviders();

  return NextResponse.json({
    agent: "Auto Business Agent Studio",
    version: "1.0.0",
    description:
      "Four specialist AI agents — Strategist plans, Researcher discovers, Buyer procures, Seller fulfills — delivering structured work in minutes. Powered by multi-provider AI (OpenAI, Gemini, Anthropic) and Nevermined payments.",
    pricing: {
      quick: {
        credits: 1,
        description: "Fast 3-source research scan",
        turnaround: "~15 seconds",
      },
      standard: {
        credits: 5,
        description: "5-source structured research document",
        turnaround: "~30 seconds",
      },
      deep: {
        credits: 10,
        description: "8-source deep analysis with full citations",
        turnaround: "~60 seconds",
      },
    },
    availableProviders: providers,
    endpoints: {
      research: "POST /api/agent/research",
      pricing: "GET /api/agent/pricing",
      stats: "GET /api/agent/stats",
      events: "GET /api/agent/events",
    },
    paymentInfo: {
      planId: process.env.NVM_PLAN_ID ?? null,
      agentId: process.env.NVM_AGENT_ID ?? null,
      protocol: "x402",
    },
  });
}
