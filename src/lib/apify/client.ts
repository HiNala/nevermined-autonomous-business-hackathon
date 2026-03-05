import "server-only";

import { ApifyClient } from "apify-client";

// ─── Singleton ───────────────────────────────────────────────────────
let _client: ApifyClient | null = null;

function getClient(): ApifyClient {
  if (!_client) {
    const token = process.env.APIFY_API_TOKEN?.trim();
    if (!token) {
      throw new Error(
        "APIFY_API_TOKEN is not set. Add it to your .env file to enable web search and scraping."
      );
    }
    _client = new ApifyClient({ token });
  }
  return _client;
}

/** Check whether Apify is configured (token present). */
export function isApifyConfigured(): boolean {
  return Boolean(process.env.APIFY_API_TOKEN?.trim());
}

// ─── Google Search via Apify ─────────────────────────────────────────
export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

/**
 * Run a Google Search via the `apify/google-search-scraper` actor.
 * Returns organic result URLs + metadata.
 *
 * @param queries – one or more search terms (newline-separated internally)
 * @param maxPages – pages per query (10 results each). Default 1.
 */
export async function apifyGoogleSearch(
  queries: string[],
  maxPages: number = 1
): Promise<SearchResult[]> {
  const client = getClient();

  const input = {
    queries: queries.join("\n"),
    maxPagesPerQuery: maxPages,
    countryCode: "us",
    languageCode: "en",
    mobileResults: false,
    includeUnfilteredResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
  };

  const run = await client
    .actor("apify/google-search-scraper")
    .call(input, { waitSecs: 120 });

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems();

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const organicResults = (item.organicResults ?? []) as {
      title?: string;
      url?: string;
      description?: string;
    }[];

    for (const r of organicResults) {
      if (r.url && !seen.has(r.url)) {
        seen.add(r.url);
        results.push({
          title: r.title ?? "",
          url: r.url,
          description: r.description ?? "",
        });
      }
    }
  }

  return results;
}

// ─── Web Scraping via Apify ──────────────────────────────────────────
export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  markdown: string;
}

/**
 * Scrape one or more URLs using the `apify/website-content-crawler` actor.
 * Returns clean text/markdown for each page. Each URL is treated as a
 * start URL with maxCrawlDepth=0 (no link following).
 */
export async function apifyScrapeUrls(urls: string[]): Promise<ScrapedPage[]> {
  if (urls.length === 0) return [];

  const client = getClient();

  const input = {
    startUrls: urls.map((url) => ({ url })),
    maxCrawlDepth: 0,
    maxCrawlPages: urls.length,
    crawlerType: "cheerio",
    removeCookieWarnings: true,
    removeElementsCssSelector:
      "nav, footer, header, .cookie-banner, .advertisement, .ads, .sidebar, #comments",
  };

  const run = await client
    .actor("apify/website-content-crawler")
    .call(input, { waitSecs: 120 });

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems();

  return items.map((item) => ({
    url: String(item.url ?? ""),
    title: String(
      (item.metadata as { title?: string })?.title ?? item.url ?? ""
    ),
    text: String(item.text ?? "").slice(0, 10000),
    markdown: String(item.markdown ?? "").slice(0, 10000),
  }));
}
