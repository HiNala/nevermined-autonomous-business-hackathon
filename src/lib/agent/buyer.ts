import "server-only";

import { getPaymentsClient } from "@/lib/nevermined/server";
import { withTimeout } from "@/lib/utils";
import type { PurchasedAsset } from "@/types/pipeline";
export type { PurchasedAsset };

const NVM_DISCOVER_TIMEOUT_MS = 15_000;
const ASSET_FETCH_TIMEOUT_MS = 20_000;

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

export interface BuyerRequest {
  query: string;
  maxCredits?: number;
  preferredTypes?: MarketplaceAsset["type"][];
  targetDids?: string[];
  /** Credit threshold above which to flag for approval instead of auto-buying */
  approvalThreshold?: number;
}

export interface PurchaseRationale {
  assetId: string;
  assetName: string;
  gapFilled: string;
  whyWorthIt: string;
  expectedImprovement: string;
  priceValueScore: number; // 0-10
}

export interface BuyerResult {
  id: string;
  query: string;
  discovered: MarketplaceAsset[];
  /** Ranked + scored candidates before purchase decision */
  rankedCandidates: RankedAsset[];
  purchased: PurchasedAsset[];
  rationales: PurchaseRationale[];
  totalCreditsSpent: number;
  durationMs: number;
  /** Set when cost exceeds approvalThreshold */
  requiresApproval?: { assets: MarketplaceAsset[]; totalCost: number; reason: string };
}

export interface RankedAsset {
  asset: MarketplaceAsset;
  relevanceScore: number;  // 0-10
  priceValueScore: number; // 0-10
  informationGainScore: number; // 0-10
  compositeScore: number;  // weighted total
  rankReason: string;
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
    const searchResult = await withTimeout(
      payments.plans.getPlans(20, 0),
      NVM_DISCOVER_TIMEOUT_MS,
      "Marketplace discovery"
    );

    if (!searchResult || !Array.isArray(searchResult)) return [];

    // Score results by query relevance (word-level fuzzy matching)
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const scored = (searchResult as Record<string, unknown>[]).map((plan) => {
      const name = String(plan.name ?? "").toLowerCase();
      const desc = String(plan.description ?? "").toLowerCase();
      const text = `${name} ${desc}`;
      let score = 0;
      for (const word of queryWords) {
        if (text.includes(word)) score += 2;
      }
      if (name.includes(query.toLowerCase())) score += 5;
      return { plan, score };
    });
    scored.sort((a, b) => b.score - a.score);
    // Return top matches; if nothing scored, return first few anyway (any marketplace asset can be useful)
    const relevant = scored
      .filter((s) => s.score > 0 || scored.every((x) => x.score === 0))
      .slice(0, 5)
      .map((s) => s.plan);

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
      const endpointController = new AbortController();
      const endpointTimer = setTimeout(() => endpointController.abort(), ASSET_FETCH_TIMEOUT_MS);
      const response = await fetch(asset.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "payment-signature": agreementId,
          Authorization: `Bearer ${agreementId}`,
        },
        body: JSON.stringify({ query: asset.name }),
        signal: endpointController.signal,
      });
      clearTimeout(endpointTimer);

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

// ─── Value-based ranking ──────────────────────────────────────────────

function rankAssets(assets: MarketplaceAsset[], query: string, maxCredits: number): RankedAsset[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  return assets.map((asset) => {
    const text = `${asset.name} ${asset.description}`.toLowerCase();

    // Relevance: word overlap
    const hits = queryWords.filter((w) => text.includes(w)).length;
    const relevanceScore = Math.min(10, Math.round((hits / Math.max(queryWords.length, 1)) * 10));

    // Price-value: cheaper relative to budget = better value
    const priceValueScore = Math.min(10, Math.round((1 - asset.price.credits / Math.max(maxCredits, 1)) * 10));

    // Information gain: report/dataset types score higher
    const informationGainScore = asset.type === "report" ? 9 : asset.type === "dataset" ? 8 : asset.type === "model" ? 7 : 5;

    const compositeScore = Math.round(relevanceScore * 0.5 + priceValueScore * 0.25 + informationGainScore * 0.25);

    const rankReason = [
      `${relevanceScore}/10 relevance`,
      `${priceValueScore}/10 price-value (${asset.price.credits}cr)`,
      `${informationGainScore}/10 info gain (${asset.type})`,
    ].join(" · ");

    return { asset, relevanceScore, priceValueScore, informationGainScore, compositeScore, rankReason };
  }).sort((a, b) => b.compositeScore - a.compositeScore);
}

function buildRationale(asset: MarketplaceAsset, query: string): PurchaseRationale {
  const type = asset.type;
  const gapFilled = type === "report" ? `External research report on ${asset.name}` :
    type === "dataset" ? `Structured dataset: ${asset.name}` :
    `Specialized ${type} capability: ${asset.name}`;

  return {
    assetId: asset.did,
    assetName: asset.name,
    gapFilled,
    whyWorthIt: `${asset.provider} provides specialized data not available through standard web research`,
    expectedImprovement: `Adds authoritative external evidence to strengthen report conclusions`,
    priceValueScore: Math.min(10, Math.round((1 - asset.price.credits / 20) * 10)),
  };
}

// ─── Main buyer flow ─────────────────────────────────────────────────

/**
 * Run the Buyer Agent:
 * 1. Discover relevant assets on the NVM marketplace
 * 2. Rank by value (relevance × price-value × info-gain)
 * 3. Check approval threshold
 * 4. Purchase top ranked assets within budget
 * 5. Return purchased content + rationales for Researcher
 */
export async function runBuyer(request: BuyerRequest): Promise<BuyerResult> {
  const startTime = Date.now();
  const id = `buy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const maxCredits = request.maxCredits ?? 20;
  const approvalThreshold = request.approvalThreshold ?? 15;

  // Step 1: Discover
  let discovered: MarketplaceAsset[];

  if (request.targetDids?.length) {
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
  }

  if (discovered.length === 0) {
    return {
      id,
      query: request.query,
      discovered: [],
      rankedCandidates: [],
      purchased: [],
      rationales: [],
      totalCreditsSpent: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Step 2: Rank by value
  const ranked = rankAssets(discovered, request.query, maxCredits);
  const affordable = ranked.filter((r) => r.asset.price.credits <= maxCredits);

  // Step 3: Check approval threshold — if top pick is too expensive, flag for approval
  const topAssets = affordable.slice(0, 3).map((r) => r.asset);
  const totalTopCost = topAssets.reduce((s, a) => s + a.price.credits, 0);

  if (totalTopCost > approvalThreshold && totalTopCost > maxCredits * 0.8) {
    return {
      id,
      query: request.query,
      discovered,
      rankedCandidates: ranked.slice(0, 5),
      purchased: [],
      rationales: [],
      totalCreditsSpent: 0,
      durationMs: Date.now() - startTime,
      requiresApproval: {
        assets: topAssets,
        totalCost: totalTopCost,
        reason: `Purchasing top ${topAssets.length} asset(s) costs ${totalTopCost}cr which exceeds the ${approvalThreshold}cr approval threshold`,
      },
    };
  }

  // Step 4: Purchase top ranked assets (sequentially, respecting budget)
  const purchased: PurchasedAsset[] = [];
  const rationales: PurchaseRationale[] = [];
  let budget = maxCredits;

  for (const ranked_item of affordable.slice(0, 3)) {
    const asset = ranked_item.asset;
    if (budget < asset.price.credits) break;

    rationales.push(buildRationale(asset, request.query));
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
    rankedCandidates: ranked.slice(0, 5),
    purchased,
    rationales,
    totalCreditsSpent: purchased
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + p.creditsPaid, 0),
    durationMs: Date.now() - startTime,
  };
}
