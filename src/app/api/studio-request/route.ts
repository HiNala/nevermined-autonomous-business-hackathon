import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/nevermined/server";
import { buildStudioPreview, getStudioService } from "@/lib/studio";
import { checkRateLimit, getClientId } from "@/lib/security";
import { fulfillSellerOrder } from "@/lib/agent/pipeline";

interface StudioRequestBody {
  serviceId?: string;
  brief?: string;
  contextUrl?: string;
}

/**
 * POST /api/studio-request — Internal route for the "Try Studio" section.
 *
 * IMPORTANT: This route calls the pipeline DIRECTLY as an internal operation.
 * It does NOT go through the x402 payment flow. The previous implementation
 * was calling our own seller endpoint with our own API key, which meant the
 * server was paying itself and burning its own Nevermined credits on every
 * request — a critical self-payment loop bug.
 *
 * External agents that want to use our service must go through the proper
 * x402 flow via /api/agent/seller or /api/agent/research.
 */
export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`studio-request:${clientId}`, 10, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  let body: StudioRequestBody;
  try {
    body = (await request.json()) as StudioRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const serviceId = body.serviceId?.trim();
  const brief = body.brief?.trim();
  const contextUrl = body.contextUrl?.trim();

  if (!serviceId || !brief) {
    return NextResponse.json(
      { error: "serviceId and brief are required." },
      { status: 400 }
    );
  }

  const service = getStudioService(serviceId);

  if (!service) {
    return NextResponse.json({ error: "Unknown service requested." }, { status: 404 });
  }

  const preview = buildStudioPreview(service, brief, contextUrl);
  const paymentStatus = getPaymentStatus();

  // Run the pipeline directly — no x402 self-payment loop
  try {
    const orderId = `studio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const query = contextUrl ? `${brief} (context: ${contextUrl})` : brief;

    const result = await fulfillSellerOrder(
      { id: orderId, query, caller: "studio-ui" },
      undefined, // emit
      undefined, // nvmTracking (no NVM logging for internal calls)
    );

    return NextResponse.json({
      mode: paymentStatus.ready ? "live" : "demo",
      paymentStatus,
      preview,
      sellerResponse: {
        ok: true,
        status: 200,
        body: {
          status: result.sellerResult?.status ?? "fulfilled",
          orderId: result.orderId,
          document: result.document,
          delivery: result.deliveryPackage,
          totalCredits: result.totalCredits,
          totalDurationMs: result.totalDurationMs,
          toolsUsed: result.toolsUsed,
        },
      },
    });
  } catch (error) {
    console.error("[studio-request] Pipeline error:", error);
    return NextResponse.json(
      {
        mode: paymentStatus.ready ? "live" : "demo",
        paymentStatus,
        preview,
        sellerResponse: null,
        error: error instanceof Error ? error.message : "Pipeline execution failed.",
      },
      { status: 500 }
    );
  }
}
