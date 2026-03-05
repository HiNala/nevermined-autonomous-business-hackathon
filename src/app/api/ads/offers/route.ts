import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.ZEROCLICK_API_KEY;

  // No API key configured — return 204 so the client silently skips ads
  if (!apiKey) {
    return new NextResponse(null, { status: 204 });
  }

  let body: { query?: string; userAgent?: string } = {};
  try {
    body = (await request.json()) as { query?: string; userAgent?: string };
  } catch {
    // malformed body — still attempt with null query
  }

  const query = body.query?.trim() ?? null;

  // Extract real client IP from Vercel/proxy headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwarded
    ? forwarded.split(",")[0].trim()
    : realIp ?? "127.0.0.1";

  try {
    const zcResponse = await fetch("https://zeroclick.dev/api/v2/offers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zc-api-key": apiKey,
      },
      body: JSON.stringify({
        method: "server",
        ipAddress,
        userAgent: body.userAgent ?? "",
        query,
        limit: 1,
      }),
      cache: "no-store",
    });

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
