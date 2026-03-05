import "server-only";

import Exa from "exa-js";

// ─── Singleton ───────────────────────────────────────────────────────
let _client: Exa | null = null;

function getClient(): Exa {
  if (!_client) {
    const key = process.env.EXA_API_KEY?.trim();
    if (!key) {
      throw new Error(
        "EXA_API_KEY is not set. Add it to your .env file to enable Exa search."
      );
    }
    _client = new Exa(key);
  }
  return _client;
}

/** Check whether Exa is configured (API key present). */
export function isExaConfigured(): boolean {
  return Boolean(process.env.EXA_API_KEY?.trim());
}

// ─── Types ───────────────────────────────────────────────────────────
export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text: string;
  summary?: string;
}

// ─── Search + Contents in one call ───────────────────────────────────
/**
 * Search the web via Exa and return results with inline text content.
 * Exa's search can return page text in the same call — no separate
 * scrape step needed.
 *
 * @param query – natural language search query
 * @param numResults – number of results (max 10 for cost efficiency)
 */
export async function exaSearch(
  query: string,
  numResults: number = 10
): Promise<ExaSearchResult[]> {
  const exa = getClient();

  const response = await exa.search(query, {
    type: "auto",
    numResults,
    contents: {
      text: {
        maxCharacters: 8000,
      },
    },
  });

  return (response.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    publishedDate: r.publishedDate ?? undefined,
    author: r.author ?? undefined,
    text: r.text ?? "",
    summary: (r as unknown as { summary?: string }).summary ?? undefined,
  }));
}

// ─── Get contents for specific URLs ──────────────────────────────────
/**
 * Fetch clean text content for a list of URLs via Exa's getContents.
 * Useful when you already have URLs (e.g. from user input or strategist).
 */
export async function exaGetContents(
  urls: string[]
): Promise<ExaSearchResult[]> {
  if (urls.length === 0) return [];

  const exa = getClient();

  const response = await exa.getContents(urls, {
    text: {
      maxCharacters: 10000,
    },
  });

  return (response.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    text: r.text ?? "",
  }));
}

// ─── Find Similar ────────────────────────────────────────────────────
/**
 * Find pages semantically similar to a given URL.
 * Great for expanding research from a known good source.
 */
export async function exaFindSimilar(
  url: string,
  numResults: number = 5
): Promise<ExaSearchResult[]> {
  const exa = getClient();

  const response = await exa.findSimilar(url, {
    numResults,
    excludeSourceDomain: true,
    contents: {
      text: {
        maxCharacters: 8000,
      },
    },
  });

  return (response.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    publishedDate: r.publishedDate ?? undefined,
    author: r.author ?? undefined,
    text: r.text ?? "",
  }));
}
