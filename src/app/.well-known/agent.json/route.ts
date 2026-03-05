import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return NextResponse.json({
    name: "Auto Business Agent Team",
    description:
      "Four-agent system: Strategist (planning), Researcher (web research), Buyer (marketplace procurement), and Seller (autonomous order fulfillment). Powered by Nevermined payments. Multi-provider AI (OpenAI, Gemini, Anthropic).",
    version: "2.0.0",
    url: `${baseUrl}/api/pipeline/run`,
    capabilities: {
      streaming: false,
      agents: ["strategist", "researcher", "buyer", "seller"],
      extensions: [
        {
          uri: "urn:nevermined:payment",
          params: {
            paymentType: "dynamic",
            credits: 5,
            planId: process.env.NVM_PLAN_ID ?? "",
            agentId: process.env.NVM_AGENT_ID ?? "",
          },
        },
      ],
    },
    endpoints: {
      pipeline: `${baseUrl}/api/pipeline/run`,
      research: `${baseUrl}/api/agent/research`,
      buyer: `${baseUrl}/api/agent/buyer`,
      seller: `${baseUrl}/api/agent/seller`,
      inventory: `${baseUrl}/api/agent/inventory`,
      contextBuilder: `${baseUrl}/api/agent/context-builder`,
      pricing: `${baseUrl}/api/agent/pricing`,
      stats: `${baseUrl}/api/agent/stats`,
      events: `${baseUrl}/api/agent/events`,
      transactions: `${baseUrl}/api/pipeline/transactions`,
    },
    pricing: {
      quick: { credits: 1 },
      standard: { credits: 5 },
      deep: { credits: 10 },
    },
  });
}
