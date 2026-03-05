import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return NextResponse.json({
    name: "Auto Business Research Agent",
    description:
      "Web research agent that scrapes, analyzes, and structures information into professional documents. Multi-provider AI (OpenAI, Gemini, Anthropic).",
    version: "1.0.0",
    url: `${baseUrl}/api/agent/research`,
    capabilities: {
      streaming: false,
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
      research: `${baseUrl}/api/agent/research`,
      pricing: `${baseUrl}/api/agent/pricing`,
      stats: `${baseUrl}/api/agent/stats`,
    },
    pricing: {
      quick: { credits: 1 },
      standard: { credits: 5 },
      deep: { credits: 10 },
    },
  });
}
