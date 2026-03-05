import { NextResponse } from "next/server";

interface ZeroClickSignal {
  category: string;
  confidence: number;
  subject: string;
  relatedSubjects?: string[];
  sentiment?: string;
  iab?: { type: string; version: string; ids: string[] };
}

interface OffersRequestBody {
  query?: string;
  userAgent?: string;
  sessionId?: string;
  locale?: string;
  signals?: ZeroClickSignal[];
}

export async function POST(request: Request) {
  const apiKey = process.env.ZEROCLICK_API_KEY;

  // No API key configured — return 204 so the client silently skips ads
  if (!apiKey) {
    return new NextResponse(null, { status: 204 });
  }

  let body: OffersRequestBody = {};
  try {
    body = (await request.json()) as OffersRequestBody;
  } catch {
    // malformed body — still attempt with defaults
  }

  const query = body.query?.trim() ?? null;

  // Extract real client IP from Vercel/proxy headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwarded
    ? forwarded.split(",")[0].trim()
    : realIp ?? "127.0.0.1";

  // Locale: explicit from client > Accept-Language header > default
  const userLocale =
    body.locale ??
    request.headers.get("accept-language")?.split(",")[0]?.trim() ??
    "en-US";

  const zcBody: Record<string, unknown> = {
    method: "server",
    ipAddress,
    userAgent: body.userAgent ?? "",
    query,
    limit: 1,
    userLocale,
  };

  if (body.sessionId) zcBody.userSessionId = body.sessionId;
  if (body.signals && body.signals.length > 0) zcBody.signals = body.signals;

  try {
    const zcResponse = await fetch("https://zeroclick.dev/api/v2/offers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zc-api-key": apiKey,
      },
      body: JSON.stringify(zcBody),
      cache: "no-store",
    });

    // Surface rate-limit signal so callers can back off
    if (zcResponse.status === 429) {
      const retryAfter = zcResponse.headers.get("retry-after");
      return new NextResponse(null, {
        status: 204,
        headers: retryAfter ? { "X-ZC-Retry-After": retryAfter } : {},
      });
    }

    if (!zcResponse.ok) {
      return new NextResponse(null, { status: 204 });
    }

    const offers = (await zcResponse.json()) as unknown[];

    if (!Array.isArray(offers) || offers.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(offers[0]);
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
