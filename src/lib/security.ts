import "server-only";

// ─── Input validation ────────────────────────────────────────────────

const MAX_INPUT_LENGTH = 5000;
const MAX_QUERY_LENGTH = 2000;

export function validateInput(input: string | undefined | null): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || !input.trim()) {
    return { valid: false, error: "Input is required" };
  }

  const trimmed = input.trim();

  if (trimmed.length > MAX_INPUT_LENGTH) {
    return { valid: false, error: `Input too long (max ${MAX_INPUT_LENGTH} characters)` };
  }

  return { valid: true, sanitized: trimmed };
}

export function validateQuery(query: string | undefined | null): { valid: boolean; error?: string; sanitized?: string } {
  if (!query || !query.trim()) {
    return { valid: false, error: "Query is required" };
  }

  const trimmed = query.trim();

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return { valid: false, error: `Query too long (max ${MAX_QUERY_LENGTH} characters)` };
  }

  return { valid: true, sanitized: trimmed };
}

// ─── Origin verification ─────────────────────────────────────────────

/**
 * Check if a request originates from same-origin (browser UI) or localhost.
 * Use this to protect internal-only routes from external abuse.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  if (baseUrl.length > 0 && origin.startsWith(baseUrl)) return true;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  // Allow server-side secret for programmatic internal calls
  const internalSecret = process.env.INTERNAL_API_SECRET || "";
  if (internalSecret.length > 0 && request.headers.get("x-internal-secret") === internalSecret) return true;
  return false;
}

// ─── Error sanitization ──────────────────────────────────────────────

/**
 * Sanitize error messages before returning to the client.
 * Strip stack traces, internal paths, and sensitive details.
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Strip file paths
    const cleaned = msg.replace(/[A-Z]:\\[^\s]+/gi, "[path]").replace(/\/[^\s]*\/[^\s]+/g, "[path]");
    // Strip stack traces
    const firstLine = cleaned.split("\n")[0];
    // Limit length
    return firstLine.slice(0, 200);
  }
  return "An unexpected error occurred";
}

// ─── Rate limiting (simple in-memory) ────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Simple sliding window rate limiter.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Extract a client identifier from a request for rate limiting.
 * Uses x-forwarded-for, then falls back to a generic key.
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;
  return "ip:unknown";
}
