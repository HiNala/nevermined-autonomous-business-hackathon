import "server-only";

import { complete, type AIProvider } from "@/lib/ai/providers";

export interface ResearchRequest {
  query: string;
  searchQueries?: string[];
  urls?: string[];
  provider?: AIProvider;
  depth?: "quick" | "standard" | "deep";
}

export interface ResearchSource {
  url: string;
  title: string;
  excerpt: string;
  fetchedAt: string;
}

export interface ResearchDocument {
  id: string;
  query: string;
  title: string;
  summary: string;
  sections: { heading: string; content: string }[];
  sources: ResearchSource[];
  provider: string;
  model: string;
  creditsUsed: number;
  createdAt: string;
  durationMs: number;
}

const CREDIT_COSTS = { quick: 1, standard: 5, deep: 10 } as const;

async function fetchAndExtract(url: string): Promise<{ url: string; title: string; text: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AutoBusiness-ResearchAgent/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? url;

    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    text = text.slice(0, 8000);

    return { url, title, text };
  } catch {
    return null;
  }
}

async function searchWeb(query: string): Promise<string[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "AutoBusiness-ResearchAgent/1.0",
        "Accept": "text/html",
      },
    });
    const html = await response.text();

    const urls: string[] = [];
    const linkRegex = /class="result__a"[^>]*href="([^"]+)"/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null && urls.length < 6) {
      let href = match[1];
      if (href.startsWith("//duckduckgo.com/l/?")) {
        const udMatch = href.match(/uddg=([^&]+)/);
        if (udMatch) href = decodeURIComponent(udMatch[1]);
      }
      if (href.startsWith("http")) urls.push(href);
    }

    if (urls.length === 0) {
      const fallbackRegex = /href="(https?:\/\/[^"]+)"/g;
      while ((match = fallbackRegex.exec(html)) !== null && urls.length < 6) {
        const href = match[1];
        if (!href.includes("duckduckgo.com") && !href.includes("duck.co")) {
          urls.push(href);
        }
      }
    }

    return urls;
  } catch {
    return [];
  }
}

export async function runResearch(request: ResearchRequest): Promise<ResearchDocument> {
  const startTime = Date.now();
  const depth = request.depth ?? "standard";
  const id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  let urlsToFetch = request.urls ?? [];

  if (urlsToFetch.length === 0) {
    // Use strategist-provided search queries if available, otherwise fall back to query
    const queries = request.searchQueries?.length
      ? request.searchQueries.slice(0, depth === "quick" ? 1 : depth === "deep" ? 4 : 2)
      : [request.query];

    const searchResults = await Promise.all(queries.map(searchWeb));
    const seen = new Set<string>();
    for (const urls of searchResults) {
      for (const url of urls) {
        if (!seen.has(url)) {
          seen.add(url);
          urlsToFetch.push(url);
        }
      }
    }
  }

  const maxUrls = depth === "quick" ? 3 : depth === "standard" ? 5 : 8;
  urlsToFetch = urlsToFetch.slice(0, maxUrls);

  const fetchResults = await Promise.all(urlsToFetch.map(fetchAndExtract));
  const successfulFetches = fetchResults.filter(Boolean) as { url: string; title: string; text: string }[];

  const sourceMaterial = successfulFetches
    .map((s, i) => `--- SOURCE ${i + 1}: ${s.title} (${s.url}) ---\n${s.text}`)
    .join("\n\n");

  const systemPrompt = `You are a research agent for Auto Business. Your job is to analyze web sources and produce structured research documents.

Output format (strict JSON):
{
  "title": "Clear descriptive title",
  "summary": "2-3 sentence executive summary",
  "sections": [
    { "heading": "Section title", "content": "Detailed findings with specifics" }
  ]
}

Rules:
- Be factual, cite sources when possible
- Include specific data points, numbers, quotes
- Organize logically with clear section headings
- ${depth === "quick" ? "Be concise, 2-3 sections max" : depth === "deep" ? "Be thorough, 5-8 detailed sections" : "Balanced depth, 3-5 sections"}`;

  const userPrompt = `Research query: "${request.query}"

${successfulFetches.length > 0 ? `Sources gathered (${successfulFetches.length}):\n${sourceMaterial}` : "No web sources were reachable. Provide the best analysis from your training data."}

Produce the structured research document as JSON.`;

  const aiResult = await complete({
    provider: request.provider,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: depth === "quick" ? 2048 : depth === "deep" ? 8192 : 4096,
    temperature: 0.2,
  });

  let parsed: { title: string; summary: string; sections: { heading: string; content: string }[] };
  try {
    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? aiResult.content);
  } catch {
    parsed = {
      title: `Research: ${request.query}`,
      summary: aiResult.content.slice(0, 300),
      sections: [{ heading: "Findings", content: aiResult.content }],
    };
  }

  const sources: ResearchSource[] = successfulFetches.map((s) => ({
    url: s.url,
    title: s.title,
    excerpt: s.text.slice(0, 200),
    fetchedAt: new Date().toISOString(),
  }));

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
  };
}
