import { put, del, list } from "@vercel/blob";

/**
 * Vercel Blob Storage utility — durable storage for generated images,
 * deliverable JSON artifacts, and other non-text pipeline outputs.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var (auto-injected on Vercel,
 * must be set manually for local dev).
 */

// ── Configuration ─────────────────────────────────────────────────────

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// ── Upload: image from URL ────────────────────────────────────────────

/**
 * Downloads an image from an ephemeral external URL (e.g. NanoBanana)
 * and re-uploads it to Vercel Blob for permanent storage.
 *
 * Returns the permanent blob URL, or the original URL if Blob is not configured.
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  options: {
    filename?: string;
    folder?: string;
    contentType?: string;
  } = {}
): Promise<string> {
  if (!isBlobConfigured()) {
    // Gracefully degrade — return original URL when Blob isn't set up
    return sourceUrl;
  }

  try {
    // Fetch the image from the ephemeral source
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.warn(`[Blob] Failed to fetch source image: ${response.status}`);
      return sourceUrl;
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = options.contentType ?? response.headers.get("content-type") ?? "image/png";
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const folder = options.folder ?? "vision";
    const filename = options.filename ?? `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, Buffer.from(imageBuffer), {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return blob.url;
  } catch (err) {
    console.warn(`[Blob] Upload failed, falling back to source URL:`, err instanceof Error ? err.message : err);
    return sourceUrl;
  }
}

// ── Upload: raw buffer or string ──────────────────────────────────────

/**
 * Upload arbitrary content (JSON deliverable, markdown export, etc.)
 * to Vercel Blob.
 *
 * Returns the permanent blob URL, or null if Blob is not configured.
 */
export async function uploadContent(
  content: string | Buffer,
  options: {
    filename: string;
    contentType?: string;
  }
): Promise<string | null> {
  if (!isBlobConfigured()) return null;

  try {
    const blob = await put(options.filename, content, {
      access: "public",
      contentType: options.contentType ?? "application/json",
      addRandomSuffix: false,
    });
    return blob.url;
  } catch (err) {
    console.warn(`[Blob] Content upload failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Upload: pipeline deliverable ──────────────────────────────────────

/**
 * Persist a full pipeline deliverable (document + metadata) as a JSON blob.
 * Useful for sharing links to completed reports.
 */
export async function uploadDeliverable(
  deliverable: Record<string, unknown>,
  options: {
    orderId?: string;
    workspaceId?: string;
  } = {}
): Promise<string | null> {
  const id = options.orderId ?? `delivery-${Date.now()}`;
  const folder = options.workspaceId ? `deliverables/${options.workspaceId}` : "deliverables";
  const filename = `${folder}/${id}.json`;

  return uploadContent(JSON.stringify(deliverable, null, 2), {
    filename,
    contentType: "application/json",
  });
}

// ── List blobs in a folder ────────────────────────────────────────────

export async function listBlobs(prefix: string) {
  if (!isBlobConfigured()) return { blobs: [] };

  try {
    return await list({ prefix });
  } catch {
    return { blobs: [] };
  }
}

// ── Delete a blob ─────────────────────────────────────────────────────

export async function deleteBlob(url: string): Promise<boolean> {
  if (!isBlobConfigured()) return false;

  try {
    await del(url);
    return true;
  } catch {
    return false;
  }
}
