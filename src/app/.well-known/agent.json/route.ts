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
    contracts: {
      schemaVersion: "1.0",
      description: "Versioned handoff contracts between agents. Each includes schemaVersion, jobId, traceId, createdAt, sourceAgent, targetAgent.",
      incomingOrder: {
        contract: "IncomingOrder",
        flow: "Seller → Interpreter",
        fields: ["schemaVersion", "jobId", "traceId", "createdAt", "caller", "rawRequest", "productId", "budget", "deliveryFormat", "paymentContext"],
        description: "Raw commercial request with payment context. Seller validates commerce, then forwards to Interpreter for structuring.",
      },
      structuredBrief: {
        contract: "StructuredBrief",
        flow: "Interpreter → Composer",
        fields: ["id", "title", "objective", "scope", "searchQueries", "keyQuestions", "deliverables", "constraints", "outputType"],
        description: "Execution plan produced by Interpreter. Composer never receives ambiguous intent — only structured briefs.",
      },
      enrichmentRequest: {
        contract: "EnrichmentRequest",
        flow: "Seller/Composer → Buyer",
        fields: ["schemaVersion", "jobId", "traceId", "gapSummary", "neededAssetTypes", "keywords", "maxCredits", "requiredRecency"],
        description: "Buyer is only called with an explicit documented knowledge gap. No speculative enrichment.",
      },
      composedReport: {
        contract: "ComposedReport",
        flow: "Composer → Seller",
        fields: ["schemaVersion", "jobId", "traceId", "title", "summary", "sections", "sources", "usedExternalAssets", "wordCount", "confidenceScore"],
        description: "Finished artifact from Composer. Seller applies quality gate, formatting, and packaging before delivery.",
      },
    },
    jobLifecycle: {
      description: "Every seller job moves through named lifecycle states. Clients can poll /api/workspace/jobs for status.",
      states: ["received", "interpreting", "composing", "enriching", "packaging", "delivered", "failed"],
      statusEndpoint: `${baseUrl}/api/workspace/jobs`,
      eventsEndpoint: `${baseUrl}/api/agent/events`,
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
      jobs: `${baseUrl}/api/workspace/jobs`,
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
