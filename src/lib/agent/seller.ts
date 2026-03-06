import "server-only";

import { complete, type AIProvider } from "@/lib/ai/providers";
import { catalog, type Product, type ThirdPartyService } from "./inventory";
import { withTimeout } from "@/lib/utils";

const LLM_TIMEOUT_MS = 30_000;

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

export interface DeliveryVariant {
  format: "markdown" | "json" | "summary" | "full_report";
  label: string;
  sizeHint: string;
  content: string;
}

export interface QualityGate {
  passed: boolean;
  score: number;
  checks: { name: string; passed: boolean; detail: string }[];
  blockedReason?: string;
}

export interface DeliveryPackage {
  orderId: string;
  productId: string;
  productName: string;
  variants: DeliveryVariant[];
  primaryVariant: "markdown" | "json" | "summary" | "full_report";
  wordCount: number;
  sectionCount: number;
  sourceCount: number;
  enriched: boolean;
  qualityGate: QualityGate;
  generatedAt: string;
  creditsCharged: number;
  durationMs: number;
  jobId?: string;
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
  status: "planned" | "fulfilling" | "complete" | "failed" | "quality_gate_failed";
  error?: string;
  /** NEW: structured delivery package with variants and quality gate */
  deliveryPackage?: DeliveryPackage;
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
    const result = await withTimeout(
      complete({
        provider,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        maxTokens: 16,
        temperature: 0,
      }),
      LLM_TIMEOUT_MS,
      "Seller matchProduct LLM"
    );

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

  const systemPrompt = `You are the Seller Agent's decision engine for Undermind. You must plan how to fulfill an incoming buyer order.

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
    const result = await withTimeout(
      complete({
        provider,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        maxTokens: 1024,
        temperature: 0.2,
      }),
      LLM_TIMEOUT_MS,
      "Seller planFulfillment LLM"
    );

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

// ─── Quality Gate ────────────────────────────────────────────────────

/**
 * Evaluate a pipeline output against quality thresholds before delivery.
 * Returns a QualityGate with pass/fail per check and a composite score.
 */
export function runQualityGate(
  doc: { title: string; summary: string; sections: { heading: string; content: string }[]; sources: { url: string; title: string }[] },
  product: Product,
  enriched: boolean
): QualityGate {
  const checks: QualityGate["checks"] = [];

  // Check 1: minimum section count
  const minSections = product.tags.includes("deep") ? 4 : 2;
  const sectionsPassed = doc.sections.length >= minSections;
  checks.push({
    name: "Section Coverage",
    passed: sectionsPassed,
    detail: `${doc.sections.length} sections (min: ${minSections})`,
  });

  // Check 2: summary quality
  const summaryPassed = doc.summary.length >= 80;
  checks.push({
    name: "Summary Quality",
    passed: summaryPassed,
    detail: `${doc.summary.length} chars (min: 80)`,
  });

  // Check 3: source count
  const minSources = enriched ? 3 : 2;
  const sourcesPassed = doc.sources.length >= minSources;
  checks.push({
    name: "Source Coverage",
    passed: sourcesPassed,
    detail: `${doc.sources.length} sources (min: ${minSources})`,
  });

  // Check 4: word count across sections
  const totalWords = doc.sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0);
  const minWords = product.tags.includes("brief") ? 150 : 300;
  const wordsPassed = totalWords >= minWords;
  checks.push({
    name: "Content Depth",
    passed: wordsPassed,
    detail: `${totalWords} words (min: ${minWords})`,
  });

  // Check 5: title present
  const titlePassed = doc.title.length >= 5;
  checks.push({
    name: "Title Present",
    passed: titlePassed,
    detail: doc.title.length > 0 ? `"${doc.title.slice(0, 40)}"` : "Missing",
  });

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const passed = score >= 60; // Must pass at least 3/5 checks

  return {
    passed,
    score,
    checks,
    blockedReason: passed ? undefined : `Quality score ${score}/100 — failed: ${checks.filter((c) => !c.passed).map((c) => c.name).join(", ")}`,
  };
}

/**
 * Package a pipeline result into a structured DeliveryPackage with variants,
 * quality gate results, and metadata.
 */
export function buildDeliveryPackage(
  orderId: string,
  product: Product,
  doc: { title: string; summary: string; sections: { heading: string; content: string }[]; sources: { url: string; title: string; excerpt: string; fetchedAt: string }[] },
  enriched: boolean,
  creditsCharged: number,
  durationMs: number,
  jobId?: string
): DeliveryPackage {
  const qualityGate = runQualityGate(doc, product, enriched);

  // Build Markdown variant
  const markdownContent = [
    `# ${doc.title}`,
    "",
    doc.summary,
    "",
    ...doc.sections.flatMap((s) => [`## ${s.heading}`, "", s.content, ""]),
    "## Sources",
    ...doc.sources.map((s) => `- [${s.title}](${s.url})`),
  ].join("\n");

  // Build summary variant (title + summary + bullet highlights)
  const summaryContent = [
    `# ${doc.title}`,
    "",
    doc.summary,
    "",
    "## Key Points",
    ...doc.sections.slice(0, 3).map((s) => `- **${s.heading}**: ${s.content.split("\n")[0].slice(0, 120)}`),
  ].join("\n");

  // Build JSON variant
  const jsonContent = JSON.stringify({
    title: doc.title,
    summary: doc.summary,
    sections: doc.sections,
    sources: doc.sources.map((s) => ({ title: s.title, url: s.url })),
    meta: {
      wordCount: doc.sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0),
      sectionCount: doc.sections.length,
      sourceCount: doc.sources.length,
      enriched,
      quality: qualityGate.score,
    },
  }, null, 2);

  const wordCount = doc.sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0);

  const variants: DeliveryVariant[] = [
    {
      format: "full_report",
      label: "Full Report",
      sizeHint: `${Math.ceil(markdownContent.length / 1000)}KB`,
      content: markdownContent,
    },
    {
      format: "summary",
      label: "Executive Summary",
      sizeHint: `${Math.ceil(summaryContent.length / 1000)}KB`,
      content: summaryContent,
    },
    {
      format: "json",
      label: "Structured JSON",
      sizeHint: `${Math.ceil(jsonContent.length / 1000)}KB`,
      content: jsonContent,
    },
  ];

  return {
    orderId,
    productId: product.id,
    productName: product.name,
    variants,
    primaryVariant: "full_report",
    wordCount,
    sectionCount: doc.sections.length,
    sourceCount: doc.sources.length,
    enriched,
    qualityGate,
    generatedAt: new Date().toISOString(),
    creditsCharged,
    durationMs,
    jobId,
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
