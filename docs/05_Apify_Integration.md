# Apify Integration Guide

> Powers the Researcher agent's web search and content extraction.

## Overview

Auto Business uses [Apify](https://apify.com/) as its primary web search and scraping engine.
The integration uses two official Apify actors:

| Actor | Purpose | Actor ID |
|-------|---------|----------|
| **Google Search Scraper** | Search Google for relevant URLs | `apify/google-search-scraper` |
| **Website Content Crawler** | Extract clean text/markdown from pages | `apify/website-content-crawler` |

When `APIFY_API_TOKEN` is not set, the system falls back to DuckDuckGo HTML scraping + raw HTTP fetch (lower quality, less reliable).

---

## Setup

### 1. Create an Apify account

Sign up at [https://console.apify.com](https://console.apify.com) — the free plan gives you **$5/month** in credits.

### 2. Get your API token

Go to **Settings → Integrations** in the Apify Console:
[https://console.apify.com/account#/integrations](https://console.apify.com/account#/integrations)

Copy your **Personal API token**.

### 3. Add to `.env`

```env
APIFY_API_TOKEN=apify_api_your-token-here
```

That's it. The Researcher agent will automatically use Apify for all searches and scraping.

---

## Architecture

```
src/lib/apify/client.ts          — Centralized Apify client (singleton)
  ├── isApifyConfigured()         — Check if token is present
  ├── apifyGoogleSearch()         — Google Search via actor
  └── apifyScrapeUrls()           — Web Content Crawler via actor

src/lib/agent/researcher.ts       — Researcher agent
  ├── searchWeb()                 — Uses Apify search, falls back to DDG
  ├── fetchPages()                — Uses Apify scraper, falls back to raw fetch
  └── runResearch()               — Orchestrates search → scrape → LLM synthesis
```

### Flow

1. **Search** — Strategist generates search queries → Researcher sends them to `apify/google-search-scraper` → gets back organic results with titles, URLs, descriptions
2. **Scrape** — Takes top N URLs → sends to `apify/website-content-crawler` → gets back clean text (nav/header/footer/ads stripped)
3. **Synthesize** — Feeds scraped content to AI provider (OpenAI/Gemini/Anthropic) → produces structured research document

---

## Apify Actors Reference

### Google Search Scraper (`apify/google-search-scraper`)

**Input:**
```json
{
  "queries": "query one\nquery two",
  "maxPagesPerQuery": 1,
  "countryCode": "us",
  "languageCode": "en",
  "mobileResults": false,
  "includeUnfilteredResults": false,
  "saveHtml": false
}
```

- `queries` — newline-separated search terms
- `maxPagesPerQuery` — pages per query (10 results per page). We use 1.
- `countryCode` / `languageCode` — search locale

**Output (per query):**
```json
{
  "searchQuery": { "term": "...", "page": 1 },
  "organicResults": [
    {
      "title": "Page Title",
      "url": "https://example.com/page",
      "description": "Snippet from Google...",
      "position": 1
    }
  ],
  "relatedQueries": [...],
  "peopleAlsoAsk": [...]
}
```

We extract `organicResults[].url`, `title`, `description`.

**Cost:** ~$1.80 per 1,000 search result pages (PPE pricing).

---

### Website Content Crawler (`apify/website-content-crawler`)

**Input:**
```json
{
  "startUrls": [{ "url": "https://example.com" }],
  "maxCrawlDepth": 0,
  "maxCrawlPages": 5,
  "crawlerType": "cheerio",
  "removeCookieWarnings": true,
  "removeElementsCssSelector": "nav, footer, header, .cookie-banner, .advertisement"
}
```

- `startUrls` — array of `{ url }` objects
- `maxCrawlDepth` — `0` means only scrape the given URLs, don't follow links
- `crawlerType` — `"cheerio"` (fast, HTTP-only) or `"playwright"` (headless browser for JS-heavy sites)
- `removeElementsCssSelector` — CSS selectors for elements to strip

**Output (per page):**
```json
{
  "url": "https://example.com/page",
  "text": "Clean extracted text without navigation...",
  "markdown": "# Page Title\n\nClean markdown content...",
  "metadata": {
    "title": "Page Title",
    "description": "Meta description",
    "languageCode": "en"
  }
}
```

We use the `text` field for LLM input (up to 10,000 chars per page).

**Cost:** ~$0.20 per 1,000 pages (Cheerio), ~$0.50-$5 per 1,000 pages (headless browser).

---

## SDK Usage

We use the official `apify-client` npm package:

```typescript
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// Run an actor and wait for results
const run = await client
  .actor("apify/google-search-scraper")
  .call(input, { waitSecs: 120 });

// Fetch results from the run's dataset
const { items } = await client
  .dataset(run.defaultDatasetId)
  .listItems();
```

Key methods:
- **`client.actor(id).call(input, opts)`** — Run actor synchronously (waits for completion)
- **`client.dataset(id).listItems()`** — Fetch all items from a dataset
- **`{ waitSecs: 120 }`** — Max wait time before timing out

---

## Fallback Behavior

When `APIFY_API_TOKEN` is not set or an Apify call fails:

| Feature | Apify (primary) | Fallback |
|---------|-----------------|----------|
| **Search** | Google Search via actor | DuckDuckGo HTML scrape |
| **Scraping** | Website Content Crawler (clean text, no JS issues) | Raw HTTP fetch + regex HTML stripping |

Fallbacks are automatic and logged to console. This means the app works without Apify, but with lower quality results.

---

## Cost Estimates

For a typical **standard depth** research request (2 search queries, 5 URLs scraped):

| Operation | Apify Cost |
|-----------|-----------|
| 2 Google searches | ~$0.004 |
| 5 page scrapes (Cheerio) | ~$0.001 |
| **Total per request** | **~$0.005** |

The free plan's $5/month credit covers ~1,000 research requests.

---

## Troubleshooting

- **"APIFY_API_TOKEN is not set"** — Add your token to `.env`. Get it from [console.apify.com/account#/integrations](https://console.apify.com/account#/integrations).
- **Search returns no results** — Check your Apify account has credits remaining. The Google Search actor uses PPE (pay-per-event) pricing.
- **Scraper times out** — Some JS-heavy sites need `crawlerType: "playwright"` instead of `"cheerio"`. We default to Cheerio for speed.
- **Scraper blocked by site** — The Website Content Crawler automatically uses Apify Proxy. For stubborn sites, consider residential proxies (additional cost).
- **Fallback triggered** — Check server logs for `[Researcher] Apify search failed` or `Apify scrape failed` messages. Usually means token expired or credits exhausted.
