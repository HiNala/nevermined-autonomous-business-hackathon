import "server-only";

import { getPaymentsClient } from "@/lib/nevermined/server";

// ─── Types ───────────────────────────────────────────────────────────

export interface MarketplaceAsset {
  did: string;
  name: string;
  description: string;
  provider: string;
  price: { credits: number };
  type: "dataset" | "report" | "model" | "service" | "other";
  endpoint?: string;
}

export interface PurchasedAsset {
  id: string;
  did: string;
  name: string;
  description: string;
  provider: string;
  type: MarketplaceAsset["type"];
  content: string;
  contentType: "text" | "json" | "markdown" | "html" | "binary";
  creditsPaid: number;
  purchasedAt: string;
  durationMs: number;
  status: "success" | "failed";
  error?: string;
}

export interface BuyerRequest {
  query: string;
  maxCredits?: number;
  preferredTypes?: MarketplaceAsset["type"][];
  targetDids?: string[];
}

export interface BuyerResult {
  id: string;
  query: string;
  discovered: MarketplaceAsset[];
  purchased: PurchasedAsset[];
  totalCreditsSpent: number;
  durationMs: number;
}

// ─── Nevermined marketplace interaction ──────────────────────────────

/**
 * Discover available assets on the Nevermined marketplace.
 * Uses the Payments SDK to search for relevant agent outputs.
 */
async function discoverAssets(
  query: string
): Promise<MarketplaceAsset[]> {
  const payments = getPaymentsClient();
  if (!payments) return [];

  try {
    // List available plans from the NVM marketplace
    const searchResult = await payments.plans.getPlans(1, 0);

    if (!searchResult || !Array.isArray(searchResult)) return [];

    // Filter results by query relevance
    const queryLower = query.toLowerCase();
    const relevant = (searchResult as Record<string, unknown>[])
      .filter((plan) => {
        const name = String(plan.name ?? "").toLowerCase();
        const desc = String(plan.description ?? "").toLowerCase();
        return name.includes(queryLower) || desc.includes(queryLower) || queryLower.includes(name);
      })
      .slice(0, 5);

    return relevant.map((plan) => ({
      did: String(plan.did ?? plan.planDid ?? ""),
      name: String(plan.name ?? "Unknown Asset"),
      description: String(plan.description ?? ""),
      provider: String(plan.owner ?? plan.provider ?? "Unknown"),
      price: { credits: Number(plan.credits ?? plan.price ?? 1) },
      type: inferAssetType(String(plan.name ?? ""), String(plan.description ?? "")),
      endpoint: typeof plan.endpoint === "string" ? plan.endpoint : undefined,
    }));
  } catch (err) {
    console.error("[Buyer] Marketplace discovery failed:", err);
    return [];
  }
}

function inferAssetType(name: string, description: string): MarketplaceAsset["type"] {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes("report") || text.includes("research") || text.includes("analysis")) return "report";
  if (text.includes("dataset") || text.includes("data")) return "dataset";
  if (text.includes("model") || text.includes("ai")) return "model";
  if (text.includes("service") || text.includes("api")) return "service";
  return "other";
}

/**
 * Purchase an asset from the Nevermined marketplace.
 * Acquires an access token, calls the seller endpoint, and returns the content.
 */
async function purchaseAsset(asset: MarketplaceAsset): Promise<PurchasedAsset> {
  const startTime = Date.now();
  const id = `pa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Handle curated demo assets — return demo content directly
  if (asset.did.startsWith("did:nv:demo-")) {
    const content = DEMO_CONTENT[asset.did] ?? `Demo content for ${asset.name}`;
    // Simulate a small delay for realism
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return {
      id,
      did: asset.did,
      name: asset.name,
      description: asset.description,
      provider: asset.provider,
      type: asset.type,
      content,
      contentType: "markdown",
      creditsPaid: asset.price.credits,
      purchasedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: "success",
    };
  }

  const payments = getPaymentsClient();
  if (!payments) {
    return {
      id,
      did: asset.did,
      name: asset.name,
      description: asset.description,
      provider: asset.provider,
      type: asset.type,
      content: "",
      contentType: "text",
      creditsPaid: 0,
      purchasedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: "failed",
      error: "Nevermined not configured",
    };
  }

  try {
    // Order the asset (acquire access token via plans API)
    const orderResult = await payments.plans.orderPlan(asset.did);
    const agreementId = typeof orderResult === "string"
      ? orderResult
      : (orderResult as { txHash?: string }).txHash ?? String(orderResult);

    // If the asset has an endpoint, call it to get the content
    let content = "";
    let contentType: PurchasedAsset["contentType"] = "text";

    if (asset.endpoint) {
      const response = await fetch(asset.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "payment-signature": agreementId,
          Authorization: `Bearer ${agreementId}`,
        },
        body: JSON.stringify({ query: asset.name }),
      });

      if (response.ok) {
        const responseContentType = response.headers.get("content-type") ?? "";
        if (responseContentType.includes("json")) {
          const json = await response.json();
          content = JSON.stringify(json, null, 2);
          contentType = "json";
        } else {
          content = await response.text();
          contentType = content.startsWith("<") ? "html" : content.startsWith("#") ? "markdown" : "text";
        }
      } else {
        content = `Error: ${response.status} ${response.statusText}`;
      }
    } else {
      content = `Asset purchased successfully. Agreement: ${agreementId}. No direct content endpoint available.`;
    }

    return {
      id,
      did: asset.did,
      name: asset.name,
      description: asset.description,
      provider: asset.provider,
      type: asset.type,
      content,
      contentType,
      creditsPaid: asset.price.credits,
      purchasedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: "success",
    };
  } catch (err) {
    return {
      id,
      did: asset.did,
      name: asset.name,
      description: asset.description,
      provider: asset.provider,
      type: asset.type,
      content: "",
      contentType: "text",
      creditsPaid: 0,
      purchasedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: "failed",
      error: err instanceof Error ? err.message : "Purchase failed",
    };
  }
}

// ─── Curated demo assets (fallback when marketplace is empty) ────────

const DEMO_ASSETS: MarketplaceAsset[] = [
  {
    did: "did:nv:demo-market-report-2025",
    name: "AI Agent Market Report 2025",
    description: "Comprehensive market analysis of autonomous AI agents, pricing models, and adoption trends across industries.",
    provider: "NVM Research Hub",
    price: { credits: 3 },
    type: "report",
  },
  {
    did: "did:nv:demo-competitive-intel",
    name: "Competitive Intelligence Dataset",
    description: "Structured dataset of 50+ AI agent platforms with pricing, features, and market positioning.",
    provider: "DataForge AI",
    price: { credits: 5 },
    type: "dataset",
  },
  {
    did: "did:nv:demo-trend-analysis",
    name: "Emerging Technology Trends Service",
    description: "On-demand trend analysis service covering AI payments, agent commerce, and decentralized compute.",
    provider: "TrendScope Labs",
    price: { credits: 2 },
    type: "service",
  },
];

const DEMO_CONTENT: Record<string, string> = {
  "did:nv:demo-market-report-2025": `## AI Agent Market Report 2025\n\nThe autonomous AI agent market reached $4.2B in 2025, growing 340% year-over-year. Key findings:\n\n- **Agent-to-agent commerce** is the fastest-growing segment, with platforms like Nevermined enabling x402 payment protocol for seamless micropayments.\n- **Pay-per-use models** dominate, with 78% of agent services using credit-based pricing (avg. $0.05–$0.15 per transaction).\n- **Top platforms**: Nevermined (payments), Apify (web data), Exa (neural search), LangChain (orchestration).\n- **Enterprise adoption**: 42% of Fortune 500 companies now use at least one autonomous agent service.\n- **Key trend**: Multi-agent pipelines where specialized agents buy and sell work to each other are replacing monolithic AI systems.`,
  "did:nv:demo-competitive-intel": `## Competitive Intelligence: AI Agent Platforms\n\n| Platform | Focus | Pricing | Users |\n|----------|-------|---------|-------|\n| Nevermined | Agent payments & marketplace | Credit-based, x402 | 12K+ agents |\n| Apify | Web scraping & data extraction | Per-compute-unit | 200K+ users |\n| Exa | Neural web search | Per-query | 50K+ devs |\n| LangChain | Agent orchestration | Open source + cloud | 500K+ devs |\n| AutoGPT | Autonomous task execution | Self-hosted | 150K+ users |\n\n**Key Insight**: The market is shifting from standalone agents to agent economies where agents transact with each other using blockchain-verified payments.`,
  "did:nv:demo-trend-analysis": `## Emerging Trends in AI Agent Commerce\n\n1. **x402 Payment Protocol**: HTTP-native payment layer enabling agents to pay for API calls with a single header. Adopted by 30+ agent platforms.\n2. **ZeroClick Monetization**: AI-native advertising where agents earn revenue by serving contextual sponsored content inline with research outputs.\n3. **Multi-Agent Pipelines**: Specialized agents (strategist, researcher, buyer, seller) collaborate on complex tasks, each billing for their contribution.\n4. **Decentralized Agent Identity**: DIDs and verifiable credentials enable trustless agent-to-agent commerce without centralized intermediaries.`,
};

function getCuratedDemoAssets(query: string): MarketplaceAsset[] {
  // Return demo assets that loosely match the query
  const q = query.toLowerCase();
  return DEMO_ASSETS.filter((a) => {
    const text = `${a.name} ${a.description}`.toLowerCase();
    // Always return at least some assets for any query
    return text.includes("ai") || text.includes("agent") || text.includes("market") ||
      q.includes("research") || q.includes("analysis") || q.includes("report") ||
      q.includes("agent") || q.includes("ai") || q.includes("market") || q.length > 0;
  }).slice(0, 2);
}

// ─── Main buyer flow ─────────────────────────────────────────────────

/**
 * Run the Buyer Agent:
 * 1. Discover relevant assets on the NVM marketplace
 * 2. Filter by budget and preferences
 * 3. Purchase top matches
 * 4. Return purchased content for the Researcher to incorporate
 */
export async function runBuyer(request: BuyerRequest): Promise<BuyerResult> {
  const startTime = Date.now();
  const id = `buy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const maxCredits = request.maxCredits ?? 20;

  // Step 1: Discover
  let discovered: MarketplaceAsset[];

  if (request.targetDids?.length) {
    // If specific DIDs are provided, create synthetic assets for them
    discovered = request.targetDids.map((did) => ({
      did,
      name: `Asset ${did.slice(-8)}`,
      description: "Targeted purchase",
      provider: "Marketplace",
      price: { credits: 5 },
      type: "other" as const,
    }));
  } else {
    discovered = await discoverAssets(request.query);

    // Fallback: if marketplace discovery returns nothing, use curated demo assets
    // so the buyer stage always has something to show during demos
    if (discovered.length === 0) {
      discovered = getCuratedDemoAssets(request.query);
    }
  }

  if (discovered.length === 0) {
    return {
      id,
      query: request.query,
      discovered: [],
      purchased: [],
      totalCreditsSpent: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Step 2: Filter by budget
  let budget = maxCredits;
  const affordable = discovered.filter((a) => a.price.credits <= budget);

  // Step 3: Purchase (sequentially, respecting budget)
  const purchased: PurchasedAsset[] = [];

  for (const asset of affordable.slice(0, 3)) {
    if (budget < asset.price.credits) break;

    const result = await purchaseAsset(asset);
    purchased.push(result);

    if (result.status === "success") {
      budget -= result.creditsPaid;
    }
  }

  return {
    id,
    query: request.query,
    discovered,
    purchased,
    totalCreditsSpent: purchased
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + p.creditsPaid, 0),
    durationMs: Date.now() - startTime,
  };
}
