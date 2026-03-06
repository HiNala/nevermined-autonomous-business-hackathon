import "server-only";

import { complete, type AIProvider } from "@/lib/ai/providers";
import { withTimeout } from "@/lib/utils";
import type { AgentToolSettings, SearchProvider, ScrapeProvider } from "@/lib/tool-settings";
import type { SponsorToolUsage, ResearchDocument, ResearchSource, ResearchConfidence } from "@/types/pipeline";
export type { SponsorToolUsage, ResearchDocument, ResearchSource, ResearchConfidence };
import {
  isApifyConfigured,
  apifyGoogleSearch,
  apifyScrapeUrls,
} from "@/lib/apify/client";
import {
  isExaConfigured,
  exaSearch,
  exaGetContents,
} from "@/lib/exa/client";

const LLM_TIMEOUT_MS = 30_000;
const DDG_FETCH_TIMEOUT_MS = 8_000;

export interface ResearchRequest {
  query: string;
  searchQueries?: string[];
  urls?: string[];
  provider?: AIProvider;
  depth?: "quick" | "standard" | "deep";
  toolSettings?: AgentToolSettings;
  searchTool?: SearchProvider;
  scrapeTool?: ScrapeProvider;
}


const CREDIT_COSTS = { quick: 1, standard: 5, deep: 10 } as const;

// ─── Unified search + fetch router ──────────────────────────────────
/**
 * Routes based on toolSettings. Exa path returns full text inline —
 * no separate scrape step needed. Falls back gracefully if keys missing.
 */
async function searchAndFetch(
  queries: string[],
  maxUrls: number,
  toolSettings?: AgentToolSettings,
  toolsUsed?: SponsorToolUsage[]
): Promise<{ url: string; title: string; text: string }[]> {
  const searchPref = toolSettings?.search ?? "duckduckgo";
  const scrapePref = toolSettings?.scrape ?? "raw";
  const track = (tool: SponsorToolUsage["tool"], label: string, sponsor: SponsorToolUsage["sponsor"], detail?: string) => {
    toolsUsed?.push({ tool, label, sponsor, timestamp: new Date().toISOString(), detail });
  };

  // ── Path A: Exa — neural search returns full content inline ──────────
  if (searchPref === "exa" && isExaConfigured()) {
    try {
      const perQuery = Math.ceil(maxUrls / Math.max(queries.length, 1)) + 2;
      const seen = new Set<string>();
      const results: { url: string; title: string; text: string }[] = [];
      for (const query of queries) {
        const hits = await exaSearch(query, perQuery);
        for (const r of hits) {
          if (!seen.has(r.url) && r.text && results.length < maxUrls) {
            seen.add(r.url);
            results.push({ url: r.url, title: r.title, text: r.text });
          }
        }
      }
      if (results.length > 0) {
        track("exa-search", `Exa Neural Search — ${results.length} results`, "Exa", `${queries.length} queries`);
        return results;
      }
    } catch (err) {
      console.error("[Researcher] Exa search failed, falling back:", err);
    }
  }

  // ── Path B: URL discovery via Apify Google Search or DuckDuckGo ──────
  let rawUrls: string[] = [];
  if (searchPref === "apify" && isApifyConfigured()) {
    try {
      const sr = await apifyGoogleSearch(queries, 1);
      rawUrls = [...new Set(sr.map((r) => r.url))].slice(0, maxUrls);
      track("apify-search", `Apify Google Search — ${rawUrls.length} URLs`, "Apify", `${queries.length} queries`);
    } catch (err) {
      console.error("[Researcher] Apify search failed, falling back to DDG:", err);
      rawUrls = (await fallbackSearchDDG(queries)).map((r) => r.url).slice(0, maxUrls);
      track("duckduckgo", `DuckDuckGo Fallback — ${rawUrls.length} URLs`, "DuckDuckGo");
    }
  } else {
    rawUrls = (await fallbackSearchDDG(queries)).map((r) => r.url).slice(0, maxUrls);
    track("duckduckgo", `DuckDuckGo Search — ${rawUrls.length} URLs`, "DuckDuckGo", `${queries.length} queries`);
  }

  if (rawUrls.length === 0) return [];

  // ── Path C: Exa getContents for clean text ────────────────────────────
  if (scrapePref === "exa" && isExaConfigured()) {
    try {
      const contents = await exaGetContents(rawUrls);
      if (contents.length > 0) {
        track("exa-contents", `Exa Content Extraction — ${contents.length} pages`, "Exa");
        return contents.map((r) => ({ url: r.url, title: r.title, text: r.text }));
      }
    } catch (err) {
      console.error("[Researcher] Exa getContents failed, falling back:", err);
    }
  }

  // ── Path D: Apify Website Content Crawler ────────────────────────────
  if (scrapePref !== "raw" && isApifyConfigured()) {
    try {
      const pages = await apifyScrapeUrls(rawUrls);
      if (pages.length > 0) {
        track("apify-crawl", `Apify Website Crawler — ${pages.length} pages`, "Apify");
        return pages.map((p) => ({ url: p.url, title: p.title, text: p.markdown || p.text }));
      }
    } catch (err) {
      console.error("[Researcher] Apify scrape failed, falling back to raw fetch:", err);
    }
  }

  // ── Path E: Raw HTML fetch (always available) ─────────────────────────
  const raw = await Promise.all(rawUrls.map(fallbackFetchAndExtract));
  const filtered = raw.filter(Boolean) as { url: string; title: string; text: string }[];
  if (filtered.length > 0) {
    track("raw-fetch", `Raw HTTP Fetch — ${filtered.length} pages`, "LLM");
  }
  return filtered;
}

/** Scrape explicit URLs via the configured scrape provider. */
async function scrapeUrls(
  urls: string[],
  toolSettings?: AgentToolSettings
): Promise<{ url: string; title: string; text: string }[]> {
  const pref = toolSettings?.scrape ?? "raw";
  if (pref === "exa" && isExaConfigured()) {
    try {
      const contents = await exaGetContents(urls);
      if (contents.length > 0) return contents.map((r) => ({ url: r.url, title: r.title, text: r.text }));
    } catch (err) {
      console.error("[Researcher] Exa getContents failed, falling back:", err);
    }
  }
  if (pref !== "raw" && isApifyConfigured()) {
    try {
      const pages = await apifyScrapeUrls(urls);
      if (pages.length > 0) return pages.map((p) => ({ url: p.url, title: p.title, text: p.markdown || p.text }));
    } catch (err) {
      console.error("[Researcher] Apify scrape failed, falling back to raw fetch:", err);
    }
  }
  const raw = await Promise.all(urls.map(fallbackFetchAndExtract));
  return raw.filter(Boolean) as { url: string; title: string; text: string }[];
}

async function fallbackSearchDDG(queries: string[]): Promise<{ url: string }[]> {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const query of queries) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    try {
      const ddgController = new AbortController();
      const ddgTimer = setTimeout(() => ddgController.abort(), DDG_FETCH_TIMEOUT_MS);
      const response = await fetch(searchUrl, {
        headers: { "User-Agent": "AutoBusiness-ResearchAgent/1.0", Accept: "text/html" },
        signal: ddgController.signal,
      });
      clearTimeout(ddgTimer);
      const html = await response.text();
      const linkRegex = /class="result__a"[^>]*href="([^"]+)"/g;
      let match;
      while ((match = linkRegex.exec(html)) !== null && urls.length < 20) {
        let href = match[1];
        if (href.startsWith("//duckduckgo.com/l/?")) {
          const udMatch = href.match(/uddg=([^&]+)/);
          if (udMatch) href = decodeURIComponent(udMatch[1]);
        }
        if (href.startsWith("http") && !seen.has(href)) {
          seen.add(href);
          urls.push(href);
        }
      }
    } catch {
      // silently skip
    }
  }
  return urls.map((u) => ({ url: u }));
}

async function fallbackFetchAndExtract(url: string): Promise<{ url: string; title: string; text: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AutoBusiness-ResearchAgent/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? url;
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    return { url, title, text };
  } catch {
    return null;
  }
}

// ── Source scoring ────────────────────────────────────────────────────
export interface ScoredSource extends ResearchSource {
  relevanceScore: number;   // 0-10
  authorityScore: number;   // 0-10 (heuristic from domain)
  freshnessLabel: "recent" | "moderate" | "stale" | "unknown";
  overallScore: number;     // weighted average
}

function scoreSource(s: { url: string; title: string; text: string }, query: string): ScoredSource {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const text = `${s.title} ${s.text}`.toLowerCase();

  // Relevance: how many query words appear
  const hits = queryWords.filter((w) => text.includes(w)).length;
  const relevanceScore = Math.min(10, Math.round((hits / Math.max(queryWords.length, 1)) * 10));

  // Authority heuristic by domain
  let authorityScore = 5;
  try {
    const domain = new URL(s.url).hostname.replace("www.", "");
    if (/\.gov|\.edu|reuters|bloomberg|techcrunch|forbes|mckinsey|gartner|forrester/.test(domain)) authorityScore = 9;
    else if (/\.org|medium|substack|wired|hbr|ft\.com|wsj/.test(domain)) authorityScore = 7;
    else if (/reddit|quora|twitter|x\.com/.test(domain)) authorityScore = 3;
  } catch { /* ignore */ }

  // Freshness: look for year markers in content
  const currentYear = new Date().getFullYear();
  const yearMatches = text.match(/20(2[3-9]|[3-9]\d)/g)?.map(Number) ?? [];
  let freshnessLabel: ScoredSource["freshnessLabel"] = "unknown";
  if (yearMatches.length > 0) {
    const maxYear = Math.max(...yearMatches);
    freshnessLabel = maxYear >= currentYear - 1 ? "recent" : maxYear >= currentYear - 3 ? "moderate" : "stale";
  }

  const overallScore = Math.round((relevanceScore * 0.5 + authorityScore * 0.3 + (freshnessLabel === "recent" ? 10 : freshnessLabel === "moderate" ? 6 : 3) * 0.2));

  return {
    url: s.url,
    title: s.title,
    excerpt: s.text.slice(0, 200),
    fetchedAt: new Date().toISOString(),
    relevanceScore,
    authorityScore,
    freshnessLabel,
    overallScore,
  };
}

// ── Confidence summary ────────────────────────────────────────────────
function computeConfidence(
  sources: ScoredSource[],
  contradictionsDetected: boolean,
  premiumDataUsed: boolean
): ResearchConfidence {
  const score = sources.length === 0 ? 10
    : Math.round(sources.reduce((s, src) => s + src.overallScore, 0) / sources.length * 10);

  const freshCounts = sources.map((s) => s.freshnessLabel);
  const recentCount = freshCounts.filter((f) => f === "recent").length;
  const avgFreshness: ResearchConfidence["avgFreshness"] =
    sources.length === 0 ? "unknown"
    : recentCount > sources.length / 2 ? "recent"
    : freshCounts.filter((f) => f === "stale").length > sources.length / 2 ? "stale"
    : "moderate";

  const level: ResearchConfidence["level"] =
    score >= 70 && sources.length >= 4 && !contradictionsDetected ? "high"
    : score >= 40 || sources.length >= 2 ? "medium"
    : "low";

  return {
    level,
    score,
    sourceCount: sources.length,
    avgFreshness,
    contradictionsDetected,
    unresolvedUncertainties: contradictionsDetected ? ["Some sources present conflicting data — see Contradictions section"] : [],
    premiumDataUsed,
  };
}

export async function runResearch(request: ResearchRequest): Promise<ResearchDocument> {
  const startTime = Date.now();
  const depth = request.depth ?? "standard";
  const id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const toolsUsed: SponsorToolUsage[] = [];

  const maxUrls = depth === "quick" ? 3 : depth === "standard" ? 5 : 8;

  // ── Step 1: Search + fetch (tool-routed) ─────────────────────────────
  let successfulFetches: { url: string; title: string; text: string }[];

  if (request.urls && request.urls.length > 0) {
    successfulFetches = await scrapeUrls(request.urls.slice(0, maxUrls), request.toolSettings);
  } else {
    const queries = request.searchQueries?.length
      ? request.searchQueries.slice(0, depth === "quick" ? 1 : depth === "deep" ? 4 : 2)
      : [request.query];
    successfulFetches = await searchAndFetch(queries, maxUrls, request.toolSettings, toolsUsed);
  }

  // ── Step 2: Score sources ────────────────────────────────────────────
  const scoredSources = successfulFetches.map((s) => scoreSource(s, request.query));
  // Sort by score so the LLM sees the best sources first
  scoredSources.sort((a, b) => b.overallScore - a.overallScore);

  const sourceMaterial = scoredSources
    .map((s, i) => `--- SOURCE ${i + 1} [score:${s.overallScore}/10, authority:${s.authorityScore}, freshness:${s.freshnessLabel}]: ${s.title} (${s.url}) ---\n${s.excerpt.slice(0, 400)}`)
    .join("\n\n");

  // ── Step 3a: Pass 1 — Outline (title + section headings + key claims) ───
  const sectionCount = depth === "quick" ? "2-3" : depth === "deep" ? "6-8" : "4-5";

  // Skip outline pass for quick depth to save time
  let outlineSections: string[] = [];
  let docTitle = `Research: ${request.query}`;

  if (depth !== "quick") {
    const outlinePrompt = `You are a research planning agent. Given a query and scored sources, produce an outline for a research document.

Output strict JSON:
{
  "title": "Clear, specific, professional document title",
  "sections": ["Section heading 1", "Section heading 2", ...],
  "summary_hook": "One punchy sentence capturing the most important finding"
}

Rules:
- ${sectionCount} sections
- Headings should be specific and informative, not generic (e.g. "Market Growth: 34% CAGR 2023-2027" not "Market Overview")
- Each heading represents a distinct angle, not repetitive themes`;

    const outlineResult = await withTimeout(
      complete({
        provider: request.provider,
        messages: [
          { role: "system", content: outlinePrompt },
          { role: "user", content: `Query: "${request.query}"\n\nSource titles available:\n${scoredSources.slice(0, 5).map((s, i) => `${i + 1}. ${s.title}`).join("\n")}\n\nProduce the outline JSON.` },
        ],
        maxTokens: 512,
        temperature: 0.3,
      }),
      LLM_TIMEOUT_MS,
      "Outline LLM"
    );

    try {
      const m = outlineResult.content.match(/\{[\s\S]*\}/);
      const op = JSON.parse(m?.[0] ?? "{}");
      outlineSections = Array.isArray(op.sections) ? op.sections : [];
      if (op.title) docTitle = op.title;
    } catch { /* use defaults */ }

    toolsUsed.push({ tool: "llm-outline", label: `LLM Outline Pass — ${outlineResult.provider}/${outlineResult.model}`, sponsor: "LLM", timestamp: new Date().toISOString(), detail: `${outlineSections.length} sections planned` });
  }

  // ── Step 3b: Pass 2 — Full synthesis with outline guidance ───────────
  const sectionGuidance = outlineSections.length > 0
    ? `\n\nPre-planned section structure (follow these headings exactly):\n${outlineSections.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
    : "";

  const systemPrompt = `You are an expert research synthesis agent for Undermind. Analyze web sources and produce a structured, decision-useful research document.

Output strict JSON:
{
  "title": "${depth !== "quick" ? docTitle : "Clear descriptive title"}",
  "summary": "2-3 sentence executive summary with the single most important finding and a key data point",
  "sections": [
    { "heading": "Exact heading", "content": "Detailed findings with specific data, numbers, quotes, and source attribution (e.g. 'According to [Source 1]...')" }
  ],
  "contradictions": "null or 1-2 sentences on conflicting claims found across sources",
  "uncertainties": ["Specific claim or area that needs more data / had weak source support"]
}

Rules:
- ${sectionCount} sections
- Include real numbers, percentages, years, company names — not vague summaries
- Attribution: cite which source (by index) supports each major claim
- contradictions: only fill if genuine conflict exists between sources, else null
- uncertainties: flag anything stated with low source confidence${sectionGuidance}`;

  const userPrompt = `Research query: "${request.query}"

${scoredSources.length > 0
  ? `Sources (${scoredSources.length}, sorted by quality score):\n${sourceMaterial}`
  : "No web sources reachable. Synthesize from training knowledge; clearly note 'Based on training data — verify with current sources.'"
}

Produce the complete research document as JSON.`;

  const aiResult = await withTimeout(
    complete({
      provider: request.provider,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: depth === "quick" ? 2048 : depth === "deep" ? 8192 : 4096,
      temperature: 0.15,
    }),
    depth === "deep" ? 90_000 : LLM_TIMEOUT_MS * 2,
    "Synthesis LLM"
  );

  toolsUsed.push({ tool: "llm-synthesis", label: `LLM Synthesis Pass — ${aiResult.provider}/${aiResult.model}`, sponsor: "LLM", timestamp: new Date().toISOString(), detail: `${depth} depth, ${outlineSections.length > 0 ? "outline-guided" : "direct"}` });

  let parsed: {
    title: string;
    summary: string;
    sections: { heading: string; content: string }[];
    contradictions?: string | null;
    uncertainties?: string[];
  };
  try {
    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? aiResult.content);
  } catch {
    parsed = {
      title: docTitle,
      summary: aiResult.content.slice(0, 300),
      sections: [{ heading: "Findings", content: aiResult.content }],
    };
  }

  const contradictionsDetected = Boolean(parsed.contradictions && parsed.contradictions !== "null" && parsed.contradictions.length > 5);

  // Add contradiction section if detected
  if (contradictionsDetected && parsed.contradictions) {
    parsed.sections.push({
      heading: "⚡ Conflicting Evidence",
      content: parsed.contradictions,
    });
  }

  const confidence = computeConfidence(scoredSources, contradictionsDetected, false);

  // Build sources with scores preserved in excerpt for provenance
  const sources: ResearchSource[] = scoredSources.map((s) => ({
    url: s.url,
    title: s.title,
    excerpt: s.excerpt,
    fetchedAt: s.fetchedAt,
    relevanceScore: s.relevanceScore,
    authorityScore: s.authorityScore,
    freshnessLabel: s.freshnessLabel,
    overallScore: s.overallScore,
  } as ResearchSource & Partial<ScoredSource>));

  return {
    id,
    query: request.query,
    title: parsed.title,
    summary: parsed.summary,
    sections: parsed.sections ?? [],
    sources,
    provider: aiResult.provider,
    model: aiResult.model,
    creditsUsed: CREDIT_COSTS[depth],
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    toolsUsed,
    confidence,
    uncertainties: parsed.uncertainties ?? [],
  } as ResearchDocument & { confidence: ResearchConfidence; uncertainties: string[] };
}
