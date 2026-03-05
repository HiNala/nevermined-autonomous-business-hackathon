import { NextResponse } from "next/server";
import { getPaymentStatus, getPaymentsClient, getSellerConfig } from "@/lib/nevermined/server";
import { buildStudioPreview, getStudioService } from "@/lib/studio";

interface StudioRequestBody {
  serviceId?: string;
  brief?: string;
  contextUrl?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as StudioRequestBody;
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

  if (!paymentStatus.ready) {
    return NextResponse.json({
      mode: "demo",
      paymentStatus,
      preview,
      sellerResponse: null,
    });
  }

  const payments = getPaymentsClient();
  const sellerConfig = getSellerConfig();

  if (!payments || !sellerConfig) {
    return NextResponse.json({
      mode: "demo",
      paymentStatus: getPaymentStatus(),
      preview,
      sellerResponse: null,
    });
  }

  try {
    const { accessToken } = await payments.x402.getX402AccessToken(
      sellerConfig.planId,
      sellerConfig.agentId
    );

    const sellerRequest = {
      prompt: brief,
      query: brief,
      serviceId: service.id,
      contextUrl,
    };

    const sellerResponse = await fetch(sellerConfig.sellerEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "payment-signature": accessToken,
      },
      body: JSON.stringify(sellerRequest),
      cache: "no-store",
    });

    const rawText = await sellerResponse.text();
    const parsedBody = tryParseJson(rawText);

    return NextResponse.json(
      {
        mode: "live",
        paymentStatus: getPaymentStatus(),
        preview,
        sellerResponse: {
          ok: sellerResponse.ok,
          status: sellerResponse.status,
          body: parsedBody ?? rawText,
        },
      },
      { status: sellerResponse.ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        mode: "demo",
        paymentStatus: getPaymentStatus(),
        preview,
        sellerResponse: null,
        error: error instanceof Error ? error.message : "Failed to call seller endpoint.",
      },
      { status: 500 }
    );
  }
}

function tryParseJson(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}
