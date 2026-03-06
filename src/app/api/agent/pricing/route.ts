import { NextResponse } from "next/server";
import { listAvailableProviders } from "@/lib/ai/providers";
import { catalog } from "@/lib/agent/inventory";

export async function GET() {
  const providers = listAvailableProviders();
  const products = catalog.listProducts();

  return NextResponse.json({
    agent: "Auto Business Agent Studio",
    version: "2.0.0",
    description:
      "Four specialist AI agents — Strategist plans, Researcher discovers, Buyer procures, Seller fulfills — delivering structured work in minutes. Powered by multi-provider AI (OpenAI, Gemini, Anthropic) and Nevermined x402 payments.",
    research: {
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
    seller: {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        tags: p.tags,
      })),
    },
    availableProviders: providers,
    endpoints: {
      research: "POST /api/agent/research",
      seller: "POST /api/agent/seller",
      sellerCatalog: "GET /api/agent/seller",
      inventory: "GET /api/agent/inventory",
      pricing: "GET /api/agent/pricing",
      stats: "GET /api/agent/stats",
      events: "GET /api/agent/events",
      discovery: "GET /.well-known/agent.json",
    },
    paymentInfo: {
      planId: process.env.NVM_PLAN_ID ?? null,
      agentId: process.env.NVM_AGENT_ID ?? null,
      protocol: "x402",
      note: "Send POST without payment-signature to get a 402 response with payment details. Include payment-signature header with x402 access token to execute.",
    },
  });
}
