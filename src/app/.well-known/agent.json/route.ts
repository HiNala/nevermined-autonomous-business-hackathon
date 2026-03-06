import { NextResponse } from "next/server";
import { catalog } from "@/lib/agent/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const products = catalog.listProducts();

  return NextResponse.json({
    name: "Auto Business — Job-Based Agent Commerce System",
    description:
      "Canonical pipeline: Seller (intake + delivery) → Interpreter (intent structuring) → Composer (document creation) → Buyer (optional enrichment) → Seller (quality gate + packaging). Powered by Nevermined x402 payments. Multi-provider AI (OpenAI, Gemini, Anthropic).",
    version: "3.0.0",
    url: `${baseUrl}/api/agent/seller`,
    protocol: "x402",
    pipeline: {
      canonical: "Seller → Interpreter → Composer → Buyer (optional) → Seller",
      stages: [
        { step: 1, agent: "Seller", role: "Intake & payment verification. Creates tracked job." },
        { step: 2, agent: "Interpreter", role: "Converts raw request into a structured execution brief." },
        { step: 3, agent: "Composer", role: "Web research, source synthesis, document creation." },
        { step: 4, agent: "Buyer", role: "Optional: Nevermined marketplace enrichment when Composer needs external data.", optional: true },
        { step: 5, agent: "Seller", role: "Quality gate, delivery packaging (markdown/summary/JSON), settlement." },
      ],
    },
    capabilities: {
      streaming: false,
      agents: ["interpreter", "composer", "buyer", "seller"],
      sellsTo: "any-agent-with-x402-token",
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
    sellerInfo: {
      description: "Submit a query to the seller endpoint to receive structured research, analysis, or planning documents generated on-the-fly by our 4-agent pipeline.",
      howToBuy: [
        "1. GET /api/agent/seller — browse product catalog and pricing",
        "2. POST /api/agent/seller with { query, productId? } — receive 402 with payment-required header",
        "3. Acquire x402 access token from Nevermined using the planId/agentId",
        "4. POST /api/agent/seller with payment-signature header — order is fulfilled and credits settled",
      ],
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        tags: p.tags,
      })),
    },
    endpoints: {
      seller: `${baseUrl}/api/agent/seller`,
      sellerCatalog: `${baseUrl}/api/agent/seller`,
      research: `${baseUrl}/api/agent/research`,
      inventory: `${baseUrl}/api/agent/inventory`,
      pricing: `${baseUrl}/api/agent/pricing`,
      pipeline: `${baseUrl}/api/pipeline/run`,
      stats: `${baseUrl}/api/agent/stats`,
      events: `${baseUrl}/api/agent/events`,
      transactions: `${baseUrl}/api/pipeline/transactions`,
    },
    pricing: {
      research: {
        quick: { credits: 1, description: "Fast 3-source scan" },
        standard: { credits: 5, description: "5-source structured document" },
        deep: { credits: 10, description: "8-source deep analysis" },
      },
      seller: products.map((p) => ({ id: p.id, name: p.name, credits: p.price })),
    },
  });
}
