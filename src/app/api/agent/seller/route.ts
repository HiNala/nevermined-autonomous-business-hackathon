import { NextResponse } from "next/server";
import { fulfillSellerOrder } from "@/lib/agent/pipeline";
import { catalog } from "@/lib/agent/inventory";
import { agentEvents } from "@/lib/agent/event-store";
import { buildPaymentSpec, verifyX402Token, settleX402Token } from "@/lib/nevermined/server";
import { validateQuery, sanitizeError, checkRateLimit, getClientId } from "@/lib/security";
import type { SellerOrder } from "@/lib/agent/seller";
import type { ToolSettings } from "@/lib/tool-settings";

interface RequestBody {
  query?: string;
  productId?: string;
  maxCredits?: number;
  toolSettings?: ToolSettings;
}

const ENDPOINT = "/api/agent/seller";

function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * GET /api/agent/seller — returns product catalog and seller metadata.
 * This is what external buyers hit first to discover available products.
 */
export async function GET() {
  const products = catalog.listProducts();

  return NextResponse.json({
    agent: "Seller",
    version: "1.0.0",
    description:
      "Autonomous seller agent that fulfills orders using a multi-agent pipeline (Strategist → Researcher → optional Buyer). Products are generated on-the-fly from prompt templates.",
    endpoint: ENDPOINT,
    catalog: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      tags: p.tags,
    })),
    pricing: {
      note: "Prices are in credits. Purchase a Nevermined plan to get credits.",
      planId: process.env.NVM_PLAN_ID ?? null,
      agentId: process.env.NVM_AGENT_ID ?? null,
    },
  });
}

/**
 * POST /api/agent/seller — submit an order.
 * External buyers must include a payment-signature header (x402 flow).
 * Internal requests (x-internal-request: true) skip payment.
 */
export async function POST(request: Request) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`seller:${clientId}`, 10, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  const body = (await request.json()) as RequestBody;
  const validation = validateQuery(body.query);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const query = validation.sanitized!;

  const isInternalRequest = request.headers.get("x-internal-request") === "true";
  const paymentSignature = request.headers.get("payment-signature");

  // Estimate credits for the order
  let estimatedCredits = 10; // default
  if (body.productId) {
    const product = catalog.getProduct(body.productId);
    if (product) estimatedCredits = product.price;
  }

  // ── x402 Flow for external agent-to-agent calls ────────────────────
  if (!isInternalRequest && !paymentSignature) {
    const paymentRequired = buildPaymentSpec(ENDPOINT);
    const encoded = paymentRequired
      ? Buffer.from(JSON.stringify(paymentRequired)).toString("base64")
      : "";

    const products = catalog.listProducts();

    return NextResponse.json(
      {
        error: "Payment Required",
        catalog: products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          tags: p.tags,
        })),
        estimatedCredits,
        planId: process.env.NVM_PLAN_ID ?? null,
        agentId: process.env.NVM_AGENT_ID ?? null,
      },
      {
        status: 402,
        headers: encoded ? { "payment-required": encoded } : {},
      }
    );
  }

  // Determine caller identity
  let caller = "internal-ui";

  if (!isInternalRequest && paymentSignature) {
    caller = paymentSignature.slice(0, 12) + "...";

    // Verify token
    const verification = await verifyX402Token(paymentSignature, ENDPOINT, estimatedCredits);

    agentEvents.push({
      id: generateEventId(),
      type: "payment_verified",
      timestamp: new Date().toISOString(),
      data: {
        agent: "seller",
        caller,
        query,
        credits: estimatedCredits,
        paymentSignature: paymentSignature.slice(0, 20),
      },
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason ?? "Invalid payment token" },
        { status: 402 }
      );
    }
  }

  agentEvents.push({
    id: generateEventId(),
    type: "request_received",
    timestamp: new Date().toISOString(),
    data: { agent: "seller", caller, query, productId: body.productId },
  });

  // ── Check if seller is enabled via toolSettings ────────────────────
  if (body.toolSettings?.trading?.sellerEnabled === false) {
    return NextResponse.json(
      { error: "Seller agent is currently disabled in settings" },
      { status: 503 }
    );
  }

  // ── Execute: run the reverse pipeline ─────────────────────────────
  try {
    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const order: SellerOrder = {
      id: orderId,
      query,
      productId: body.productId,
      maxCredits: body.maxCredits,
      caller,
    };

    const result = await fulfillSellerOrder(order, undefined, undefined, body.toolSettings);

    // Settle credits after successful execution
    if (!isInternalRequest && paymentSignature) {
      const creditsToSettle = result.sellerResult.creditsCharged || estimatedCredits;
      const settlement = await settleX402Token(paymentSignature, ENDPOINT, creditsToSettle);

      agentEvents.push({
        id: generateEventId(),
        type: "transaction",
        timestamp: new Date().toISOString(),
        data: {
          agent: "seller",
          caller,
          credits: settlement.creditsRedeemed ?? creditsToSettle,
          mode: "live",
          orderId,
        },
      });
    }

    agentEvents.push({
      id: generateEventId(),
      type: "pipeline_complete",
      timestamp: new Date().toISOString(),
      data: {
        agent: "seller",
        caller,
        query,
        product: result.sellerResult.product.name,
        totalCredits: result.totalCredits,
        durationMs: result.totalDurationMs,
        sections: result.document?.sections.length ?? 0,
        sources: result.document?.sources.length ?? 0,
        externalAssets: result.purchasedAssets?.length ?? 0,
      },
    });

    return NextResponse.json({
      status: "success",
      orderId,
      product: {
        id: result.sellerResult.product.id,
        name: result.sellerResult.product.name,
      },
      fulfillmentPlan: {
        reasoning: result.sellerResult.fulfillmentPlan.reasoning,
        usedExternalData: result.sellerResult.fulfillmentPlan.shouldBuyExternal,
      },
      document: result.document,
      brief: result.brief,
      purchasedAssets: result.purchasedAssets,
      transactions: result.transactions,
      events: result.events,
      totalCredits: result.totalCredits,
      totalDurationMs: result.totalDurationMs,
    });
  } catch (error) {
    const errorMessage = sanitizeError(error);

    agentEvents.push({
      id: generateEventId(),
      type: "error",
      timestamp: new Date().toISOString(),
      data: { agent: "seller", caller, query, error: errorMessage },
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
