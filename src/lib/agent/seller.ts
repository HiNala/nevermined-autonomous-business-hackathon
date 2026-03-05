import "server-only";

import { complete, type AIProvider } from "@/lib/ai/providers";
import { catalog, type Product, type ThirdPartyService } from "./inventory";

// ─── Types ───────────────────────────────────────────────────────────

export interface SellerOrder {
  id: string;
  query: string;
  /** If provided, fulfil using this specific product */
  productId?: string;
  /** Budget the external buyer is willing to spend */
  maxCredits?: number;
  /** Caller identity for logging */
  caller?: string;
  provider?: AIProvider;
}

export interface FulfillmentPlan {
  /** Which product best matches the order */
  product: Product;
  /** The expanded prompt sent to the Strategist */
  expandedPrompt: string;
  /** Whether the decision engine recommends buying 3rd-party data */
  shouldBuyExternal: boolean;
  /** If buying external, which services to target */
  externalServices: ThirdPartyService[];
  /** Reasoning trace from the AI decision engine */
  reasoning: string;
  /** Estimated total cost (internal pipeline + external) */
  estimatedCost: number;
}

export interface SellerResult {
  id: string;
  orderId: string;
  query: string;
  product: Product;
  fulfillmentPlan: FulfillmentPlan;
  /** The generated output (set after pipeline execution) */
  output?: unknown;
  creditsCharged: number;
  durationMs: number;
  status: "planned" | "fulfilling" | "complete" | "failed";
  error?: string;
}

// ─── Product Matching ────────────────────────────────────────────────

/**
 * Use AI to match an incoming query to the best product in the catalog.
 * Falls back to keyword matching if AI is unavailable.
 */
async function matchProduct(
  query: string,
  provider?: AIProvider
): Promise<Product> {
  const products = catalog.listProducts();

  if (products.length === 0) {
    throw new Error("No products available in the catalog");
  }

  // Build a compact catalog summary for the AI
  const catalogSummary = products
    .map((p, i) => `[${i}] ${p.id}: ${p.name} — ${p.description} (tags: ${p.tags.join(", ")})`)
    .join("\n");

  const systemPrompt = `You are a product matching engine. Given a buyer's query, select the BEST product from the catalog that can fulfill their request.

Respond with ONLY the product index number (e.g. "0" or "3"). Nothing else.

If no product is a good fit, respond with the index of the most general/closest option.`;

  const userPrompt = `Buyer query: "${query}"

Available products:
${catalogSummary}

Which product index best matches this query?`;

  try {
    const result = await complete({
      provider,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 16,
      temperature: 0,
    });

    const idx = parseInt(result.content.trim(), 10);
    if (!isNaN(idx) && idx >= 0 && idx < products.length) {
      return products[idx];
    }
  } catch {
    // Fall back to keyword matching
  }

  // Keyword fallback
  const queryLower = query.toLowerCase();
  const scored = products.map((p) => {
    let score = 0;
    if (p.name.toLowerCase().includes(queryLower)) score += 3;
    if (p.description.toLowerCase().includes(queryLower)) score += 2;
    for (const tag of p.tags) {
      if (queryLower.includes(tag)) score += 1;
    }
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].product;
}

// ─── Decision Engine ─────────────────────────────────────────────────

/**
 * AI-powered reasoning engine that decides:
 * 1. How to expand the buyer query into an actionable prompt
 * 2. Whether to buy from 3rd-party services to enrich the output
 * 3. Which specific services to target
 *
 * This is the "complex reasoning schema" the Seller uses to make
 * autonomous economic decisions.
 */
async function planFulfillment(
  query: string,
  product: Product,
  provider?: AIProvider
): Promise<FulfillmentPlan> {
  const availableServices = catalog.listServices();
  const servicesSummary =
    availableServices.length > 0
      ? availableServices
          .map(
            (s) =>
              `- ${s.id}: ${s.name} (${s.provider}) — ${s.description} [${s.priceCredits}cr, type: ${s.type}]`
          )
          .join("\n")
      : "No third-party services currently available.";

  const systemPrompt = `You are the Seller Agent's decision engine for Auto Business. You must plan how to fulfill an incoming buyer order.

You have:
1. A buyer query describing what they want
2. A matched product from the catalog (with a prompt template)
3. A list of third-party services available on the marketplace

Your job is to produce a JSON fulfillment plan:
{
  "expandedPrompt": "The full, detailed prompt to send to the Strategist agent. Replace {{query}} in the template with the buyer's specific request. Add context and specificity.",
  "shouldBuyExternal": true/false,
  "externalServiceIds": ["service-id-1", "service-id-2"],
  "reasoning": "2-3 sentences explaining your decision. Why this product? Why buy/not buy external data? What's the expected quality?"
}

Decision rules for external purchasing:
- BUY external data when: the query requires recent/real-time data, specific datasets, or specialized knowledge that web scraping alone can't provide well
- DON'T BUY when: the query is general enough that web research covers it, or no relevant services exist, or the cost would exceed the buyer's budget
- Be cost-conscious: only buy what genuinely improves the output
- Maximum 2 external purchases per order`;

  const userPrompt = `Buyer query: "${query}"

Matched product: ${product.name}
Product template: "${product.promptTemplate}"
Product price: ${product.price}cr
Product may need external data: ${product.mayRequireExternalData}

Available third-party services:
${servicesSummary}

Plan the fulfillment. Output ONLY the JSON.`;

  let shouldBuyExternal = false;
  let externalServiceIds: string[] = [];
  let expandedPrompt = product.promptTemplate.replace("{{query}}", query);
  let reasoning = "Using default fulfillment — generating output from internal pipeline only.";

  try {
    const result = await complete({
      provider,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 1024,
      temperature: 0.2,
    });

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        expandedPrompt?: string;
        shouldBuyExternal?: boolean;
        externalServiceIds?: string[];
        reasoning?: string;
      };

      if (parsed.expandedPrompt) expandedPrompt = parsed.expandedPrompt;
      if (typeof parsed.shouldBuyExternal === "boolean") shouldBuyExternal = parsed.shouldBuyExternal;
      if (Array.isArray(parsed.externalServiceIds)) externalServiceIds = parsed.externalServiceIds.slice(0, 2);
      if (parsed.reasoning) reasoning = parsed.reasoning;
    }
  } catch {
    // Use defaults if AI fails
  }

  const externalServices = externalServiceIds
    .map((id) => catalog.getService(id))
    .filter((s): s is ThirdPartyService => s !== undefined && s.active);

  // Only buy external if we actually found valid services
  if (externalServices.length === 0) {
    shouldBuyExternal = false;
  }

  const externalCost = externalServices.reduce((sum, s) => sum + s.priceCredits, 0);
  const estimatedCost = product.price + externalCost;

  return {
    product,
    expandedPrompt,
    shouldBuyExternal,
    externalServices,
    reasoning,
    estimatedCost,
  };
}

// ─── Main Seller Flow ────────────────────────────────────────────────

/**
 * Process an incoming order from an external buyer:
 * 1. Match the query to a product
 * 2. Run the AI decision engine to plan fulfillment
 * 3. Return the plan (actual pipeline execution happens in the route handler)
 */
export async function planSellerOrder(order: SellerOrder): Promise<SellerResult> {
  const startTime = Date.now();
  const resultId = `sell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Step 1: Match product
  let product: Product;
  if (order.productId) {
    const specific = catalog.getProduct(order.productId);
    if (!specific) {
      return {
        id: resultId,
        orderId: order.id,
        query: order.query,
        product: catalog.listProducts()[0],
        fulfillmentPlan: {
          product: catalog.listProducts()[0],
          expandedPrompt: "",
          shouldBuyExternal: false,
          externalServices: [],
          reasoning: "Requested product not found",
          estimatedCost: 0,
        },
        creditsCharged: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        error: `Product not found: ${order.productId}`,
      };
    }
    product = specific;
  } else {
    product = await matchProduct(order.query, order.provider);
  }

  // Step 2: Budget check
  const maxCredits = order.maxCredits ?? 50;
  if (product.price > maxCredits) {
    return {
      id: resultId,
      orderId: order.id,
      query: order.query,
      product,
      fulfillmentPlan: {
        product,
        expandedPrompt: "",
        shouldBuyExternal: false,
        externalServices: [],
        reasoning: `Product price (${product.price}cr) exceeds buyer budget (${maxCredits}cr)`,
        estimatedCost: product.price,
      },
      creditsCharged: 0,
      durationMs: Date.now() - startTime,
      status: "failed",
      error: `Insufficient budget: product costs ${product.price}cr, buyer max is ${maxCredits}cr`,
    };
  }

  // Step 3: Run decision engine
  const fulfillmentPlan = await planFulfillment(order.query, product, order.provider);

  // Cap external purchases to stay within budget
  if (fulfillmentPlan.estimatedCost > maxCredits) {
    fulfillmentPlan.shouldBuyExternal = false;
    fulfillmentPlan.externalServices = [];
    fulfillmentPlan.reasoning += " (External purchases trimmed to fit budget.)";
    fulfillmentPlan.estimatedCost = product.price;
  }

  return {
    id: resultId,
    orderId: order.id,
    query: order.query,
    product,
    fulfillmentPlan,
    creditsCharged: product.price,
    durationMs: Date.now() - startTime,
    status: "planned",
  };
}
