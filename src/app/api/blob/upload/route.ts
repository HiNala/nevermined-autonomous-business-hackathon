import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { checkRateLimit, getClientId } from "@/lib/security";

export const runtime = "nodejs";

/**
 * POST /api/blob/upload
 *
 * Client-side upload route for persisting artifacts to Vercel Blob.
 * Accepts multipart/form-data with a `file` field, or raw body with
 * `x-blob-filename` and `content-type` headers.
 *
 * Rate limited to 20 uploads per minute per client.
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  const rateCheck = checkRateLimit(`blob:${clientId}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage not configured", configured: false },
      { status: 503 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";

    // ── Multipart form upload ───────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const filename = `uploads/${Date.now()}-${(file as File).name ?? "file"}`;
      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type || "application/octet-stream",
      });

      return NextResponse.json({
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
      });
    }

    // ── Raw body upload (with x-blob-filename header) ───────────────
    const filename = req.headers.get("x-blob-filename");
    if (!filename) {
      return NextResponse.json(
        { error: "Provide x-blob-filename header or use multipart/form-data" },
        { status: 400 }
      );
    }

    const body = await req.arrayBuffer();
    const blob = await put(filename, Buffer.from(body), {
      access: "public",
      contentType: contentType || "application/octet-stream",
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
