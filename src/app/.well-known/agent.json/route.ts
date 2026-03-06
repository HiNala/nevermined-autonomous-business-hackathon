import { NextResponse } from "next/server";
import { catalog } from "@/lib/agent/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const products = catalog.listProducts();

  return NextResponse.json({
    // ── Core identity ──────────────────────────────────────────
    "@context": "https://schema.org/",
    "@type": "SoftwareApplication",
    name: "Auto Business — Job-Based Agent Commerce System",
    description: "A five-agent autonomous economy: Seller (intake + delivery) → Interpreter (intent structuring) → Composer (2-pass document creation) → Buyer (optional Nevermined marketplace enrichment) → Seller (quality gate + packaging) + VISION (on-demand NanoBanana image generation with iterative quality loop). Powered by Nevermined x402 micro-payments.",
    applicationCategory: "BusinessApplication",
    version: "3.1.0",
    url: baseUrl,
    entryPoint: `${baseUrl}/api/agent/seller`,
    protocol: "x402",

    // ── A2A discovery ─────────────────────────────────────────
    agentDiscovery: {
      specVersion: "1.0",
      discoveryUrl: `${baseUrl}/.well-known/agent.json`,
      humanReadableUrl: `${baseUrl}/agents`,
      storeUrl: `${baseUrl}/store`,
      studioUrl: `${baseUrl}/studio`,
      tags: ["research", "analysis", "planning", "document-generation", "market-intelligence", "competitive-intel", "agent-commerce", "nevermined", "x402", "multi-agent", "autonomous", "image-generation", "nanobanana"],
      categories: ["document-generation", "research", "market-analysis", "planning", "b2b-intelligence"],
      supportedLanguages: ["en"],
      responseFormats: ["markdown", "json", "summary"],
    },

    // ── Individual agent registry ──────────────────────────────
    agents: {
      interpreter: {
        id: "interpreter",
        name: "Interpreter (Strategist)",
        role: "Intent structuring and brief generation",
        color: "#7C3AED",
        description: "Converts raw, ambiguous requests into precise structured execution briefs. Scores brief quality, identifies clarification needs, extracts search queries, defines deliverables, and applies workspace context. Acts as the brain of the pipeline.",
        skills: [
          "intent-extraction",
          "brief-generation",
          "clarification-detection",
          "scope-definition",
          "workspace-context-injection",
          "output-type-routing",
          "constraint-analysis",
        ],
        inputSchema: {
          type: "object",
          required: ["rawRequest"],
          properties: {
            rawRequest: { type: "string", description: "Free-form user request in any language or format" },
            workspaceContext: { type: "string", description: "Optional workspace profile (company, market, stage) for contextual tailoring" },
            outputType: { type: "string", enum: ["research", "analysis", "plan", "prd", "general"], description: "Preferred output format hint" },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            objective: { type: "string" },
            scope: { type: "array", items: { type: "string" } },
            searchQueries: { type: "array", items: { type: "string" } },
            keyQuestions: { type: "array", items: { type: "string" } },
            deliverables: { type: "array", items: { type: "string" } },
            constraints: { type: "array", items: { type: "string" } },
            outputType: { type: "string" },
            routing: {
              type: "object",
              properties: {
                recommendedMode: { type: "string" },
                recommendedDepth: { type: "string" },
                enrichmentLikelihood: { type: "number", minimum: 0, maximum: 1 },
              },
            },
            isClarificationNeeded: { type: "boolean" },
            clarificationQuestions: { type: "array", items: { type: "string" } },
          },
        },
        examples: [
          { input: "Research the AI agent market", output: "Structured brief with 6 search queries, 4 deliverables, outputType: research" },
          { input: "Compare our SaaS pricing vs competitors", output: "Brief with competitive scope, market constraint, outputType: analysis" },
          { input: "Write a product roadmap for Q3", output: "Brief with planning deliverables, timeline constraints, outputType: plan" },
        ],
        endpoint: `${baseUrl}/api/pipeline/run`,
        standaloneEndpoint: `${baseUrl}/api/pipeline/run`,
        standaloneMode: "strategist",
      },

      composer: {
        id: "composer",
        name: "Composer (Researcher)",
        role: "2-pass research synthesis and document generation",
        color: "#0EA5E9",
        description: "Executes multi-source web research using a 2-pass generation strategy: pass 1 builds a structured outline with section headings and key claims; pass 2 expands each section with full evidence synthesis, source attribution, contradiction detection, and confidence scoring.",
        skills: [
          "web-research",
          "multi-source-synthesis",
          "2-pass-generation",
          "source-scoring",
          "freshness-analysis",
          "confidence-scoring",
          "contradiction-detection",
          "document-structuring",
          "uncertainty-flagging",
        ],
        inputSchema: {
          type: "object",
          required: ["brief"],
          properties: {
            brief: { "$ref": "#/agents/interpreter/outputSchema", description: "Structured brief from Interpreter" },
            depth: { type: "string", enum: ["quick", "standard", "deep"], default: "standard" },
            toolSettings: {
              type: "object",
              properties: {
                search: { type: "object", properties: { apify: { type: "boolean" }, exa: { type: "boolean" }, duckduckgo: { type: "boolean" } } },
              },
            },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  content: { type: "string" },
                },
              },
            },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  title: { type: "string" },
                  overallScore: { type: "number", minimum: 0, maximum: 10 },
                  freshnessLabel: { type: "string", enum: ["recent", "moderate", "stale", "unknown"] },
                  authorityScore: { type: "number", minimum: 0, maximum: 10 },
                },
              },
            },
            confidence: {
              type: "object",
              properties: {
                overallScore: { type: "number", minimum: 0, maximum: 10 },
                sourceDiversity: { type: "number" },
                recencyScore: { type: "number" },
                coverageScore: { type: "number" },
                summary: { type: "string" },
              },
            },
            uncertainties: { type: "array", items: { type: "string" } },
            creditsUsed: { type: "number" },
            durationMs: { type: "number" },
            toolsUsed: { type: "array", items: { type: "string" } },
          },
        },
        examples: [
          { input: "Brief: AI agent market research", output: "12-section report with 8 scored sources, confidence 7.8/10" },
          { input: "Brief: competitor pricing analysis", output: "Comparative analysis with pricing tables, 6 sources" },
        ],
        endpoint: `${baseUrl}/api/pipeline/run`,
        standaloneMode: "researcher",
        searchProviders: ["apify-google-search", "apify-website-crawler", "exa", "duckduckgo"],
      },

      buyer: {
        id: "buyer",
        name: "Buyer",
        role: "Optional Nevermined marketplace enrichment",
        color: "#F59E0B",
        description: "Scans the Nevermined marketplace for external data assets that fill documented knowledge gaps in a Composer report. Evaluates candidates by relevance, price, and recency. Purchases only when a gap is explicitly identified and budget permits. Provides full purchase rationale and provenance.",
        skills: [
          "marketplace-discovery",
          "asset-evaluation",
          "gap-analysis",
          "budget-management",
          "purchase-authorization",
          "provenance-tracking",
          "nevermined-x402",
          "demo-asset-fallback",
        ],
        inputSchema: {
          type: "object",
          required: ["enrichmentRequest"],
          properties: {
            enrichmentRequest: {
              type: "object",
              properties: {
                gapSummary: { type: "string" },
                neededAssetTypes: { type: "array", items: { type: "string" } },
                keywords: { type: "array", items: { type: "string" } },
                maxCredits: { type: "number" },
                requiredRecency: { type: "string" },
              },
            },
            approvalThreshold: { type: "number", description: "Credit threshold above which user approval is required" },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            purchasedAssets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  did: { type: "string" },
                  name: { type: "string" },
                  provider: { type: "string" },
                  creditsSpent: { type: "number" },
                  content: { type: "string" },
                  rationale: { type: "string" },
                  relevanceScore: { type: "number" },
                },
              },
            },
            totalCreditsSpent: { type: "number" },
            enrichmentSummary: { type: "object" },
          },
        },
        examples: [
          { input: "Gap: missing 2024 pricing data for SaaS tools", output: "Purchased 2 marketplace assets, 8 credits, injected as External Data sections" },
        ],
        endpoint: `${baseUrl}/api/agent/buyer`,
        paymentProtocol: "nevermined-x402",
        marketplaceUrl: "https://marketplace.nevermined.io",
      },

      vision: {
        id: "vision",
        name: "VISION",
        role: "On-demand image generation with iterative quality assessment loop",
        color: "#CA8A04",
        description: "Specialist image generation agent powered by NanoBanana (Gemini image models). Accepts a brief, constructs an optimised prompt, generates an image asynchronously, then scores quality with GPT-4o-mini vision. If quality fails (score < 72/100), it diagnoses failure reasons, refines the prompt, and retries — up to 3 attempts. Returns best image with full quality report and attempt history.",
        skills: [
          "prompt-engineering",
          "context-aware-generation",
          "iterative-quality-loop",
          "llm-quality-judge",
          "failure-reasoning",
          "prompt-refinement",
          "nanobanana-gemini",
        ],
        inputSchema: {
          type: "object",
          required: ["brief", "calledBy"],
          properties: {
            brief: { type: "string", description: "Subject matter and visual intent" },
            outputContext: { type: "string", enum: ["research_report", "marketplace_listing", "agent_card", "hero_banner", "data_visualization", "agent_transaction"], default: "research_report" },
            requirements: { type: "array", items: { type: "string" }, description: "Visual requirements to check in quality assessment" },
            aspectRatio: { type: "string", enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2"], default: "16:9" },
            style: { type: "object", properties: { mood: { type: "string" }, palette: { type: "string" }, composition: { type: "string" } } },
            calledBy: { type: "string", enum: ["interpreter", "composer"], description: "Which agent is delegating to VISION" },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            imageUrl: { type: "string", description: "URL of the generated image" },
            attempts: { type: "number", minimum: 1, maximum: 3 },
            passedQuality: { type: "boolean", description: "Whether the quality threshold (72/100) was met" },
            qualityReport: {
              type: "object",
              properties: {
                score: { type: "number", minimum: 0, maximum: 100 },
                passed: { type: "array", items: { type: "string" } },
                failed: { type: "array", items: { type: "string" } },
                notes: { type: "string" },
              },
            },
            finalPrompt: { type: "string" },
            attemptHistory: { type: "array", items: { type: "object" } },
          },
        },
        examples: [
          { input: "brief: AI agents exchanging tokens, context: hero_banner", output: "16:9 image, 2 attempts, score 84/100, passed" },
          { input: "brief: market data visualization, context: research_report", output: "1:1 infographic, 1 attempt, score 91/100, passed" },
        ],
        endpoint: `${baseUrl}/api/agents/vision`,
        method: "POST",
        authentication: { type: "none", description: "No payment required — VISION is called internally by Interpreter/Composer" },
        maxAttempts: 3,
        qualityThreshold: 72,
        poweredBy: "NanoBanana (nanobnana.com) — Gemini 2.5 Flash Image",
      },

      seller: {
        id: "seller",
        name: "Seller",
        role: "Order intake, quality gate, packaging, and delivery",
        color: "#EF4444",
        description: "Entry point and exit point of the pipeline. Accepts commercial orders with payment verification, creates tracked jobs, orchestrates the full pipeline, applies quality gates (word count, section count, source count), packages output in 3 formats (markdown, summary, JSON), and settles Nevermined credits upon delivery.",
        skills: [
          "order-intake",
          "payment-verification",
          "job-tracking",
          "pipeline-orchestration",
          "quality-gating",
          "multi-format-packaging",
          "credit-settlement",
          "nevermined-x402",
          "catalog-management",
          "lifecycle-management",
        ],
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", description: "The request to fulfill" },
            productId: { type: "string", description: "Optional: catalog product ID to match a pre-defined product" },
            maxCredits: { type: "number", default: 50, description: "Maximum credits budget for enrichment" },
            deliveryFormat: { type: "string", enum: ["markdown", "summary", "json", "all"], default: "all" },
            toolSettings: { type: "object", description: "Per-agent tool overrides (search provider, trading toggles)" },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["fulfilled", "failed", "partial"] },
            orderId: { type: "string" },
            product: { type: "object" },
            fulfillmentPlan: { type: "object" },
            document: { "$ref": "#/agents/composer/outputSchema" },
            delivery: {
              type: "object",
              properties: {
                markdown: { type: "string" },
                summary: { type: "string" },
                json: { type: "object" },
              },
            },
            totalCredits: { type: "number" },
            totalDurationMs: { type: "number" },
            toolsUsed: { type: "array", items: { type: "string" } },
          },
        },
        examples: [
          { input: "Research the AI agent commerce market", output: "Fulfilled order with 14-section report, 3 formats, 8 credits used" },
          { input: "Competitive analysis: top 5 SaaS CRMs", output: "Fulfilled order with comparison matrix, 12 sources, 6 credits" },
        ],
        catalog: products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          tags: p.tags,
          outputType: p.outputType,
          mayRequireExternalData: p.mayRequireExternalData,
        })),
        endpoint: `${baseUrl}/api/agent/seller`,
        method: "POST",
        authentication: {
          type: "x402",
          description: "Include a valid Nevermined x402 payment token in the authorization header, or pass x-internal-request: true for internal calls",
          headerName: "authorization",
          internalBypass: "x-internal-request: true",
        },
      },
    },

    // ── Pipeline definition ────────────────────────────────────
    pipeline: {
      canonical: "Seller → Interpreter → Composer → Buyer (optional) → Seller + VISION (on-demand)",
      stages: [
        { step: 1, agent: "seller",      role: "Intake & payment verification. Creates tracked job with lifecycle state machine." },
        { step: 2, agent: "interpreter", role: "Converts raw request into StructuredBrief. Scores quality, detects clarification needs, applies workspace context." },
        { step: 3, agent: "composer",    role: "2-pass web research and document synthesis. Outline pass then full section expansion with source scoring." },
        { step: 4, agent: "buyer",       role: "Optional: Nevermined marketplace scan for gap-filling external data assets.", optional: true },
        { step: 5, agent: "seller",      role: "Quality gate (word/section/source minimums), multi-format packaging, credit settlement." },
        { step: "on-demand", agent: "vision", role: "Image generation via NanoBanana with quality loop. Called by Interpreter or Composer when visual output needed.", optional: true },
      ],
      shortcutModes: {
        strategist: "Run Interpreter in standalone — returns structured brief only",
        researcher:  "Run Composer in standalone — returns document from a free-form query",
        seller:      "Run Seller + Interpreter + Composer — full pipeline without Buyer",
        pipeline:    "Full 4-agent canonical pipeline",
      },
    },

    // ── Contracts ─────────────────────────────────────────────
    contracts: {
      schemaVersion: "1.0",
      description: "Versioned typed handoff contracts between agents. Each contract includes schemaVersion, jobId, traceId, createdAt, sourceAgent, targetAgent.",
      incomingOrder: {
        contract: "IncomingOrder",
        flow: "External → Seller",
        fields: ["schemaVersion", "jobId", "traceId", "createdAt", "caller", "rawRequest", "productId", "budget", "deliveryFormat", "paymentContext"],
        description: "Raw commercial request with payment context.",
      },
      structuredBrief: {
        contract: "StructuredBrief",
        flow: "Interpreter → Composer",
        fields: ["id", "title", "objective", "scope", "searchQueries", "keyQuestions", "deliverables", "constraints", "outputType", "routing"],
        description: "Structured execution plan. Composer always receives a brief — never raw intent.",
      },
      enrichmentRequest: {
        contract: "EnrichmentRequest",
        flow: "Composer/Seller → Buyer",
        fields: ["schemaVersion", "jobId", "traceId", "gapSummary", "neededAssetTypes", "keywords", "maxCredits", "requiredRecency"],
        description: "Explicit knowledge gap request. Buyer is never called speculatively.",
      },
      composedReport: {
        contract: "ComposedReport",
        flow: "Composer → Seller",
        fields: ["schemaVersion", "jobId", "traceId", "title", "summary", "sections", "sources", "usedExternalAssets", "wordCount", "confidenceScore", "toolsUsed"],
        description: "Finished research artifact with scoring metadata.",
      },
    },

    // ── Job lifecycle ─────────────────────────────────────────
    jobLifecycle: {
      description: "Every seller job moves through named lifecycle states. Poll /api/workspace/jobs for status.",
      states: ["received", "interpreting", "composing", "enriching", "packaging", "delivered", "failed"],
      statusEndpoint: `${baseUrl}/api/workspace/jobs`,
      eventsEndpoint: `${baseUrl}/api/agent/events`,
      sseSupport: true,
    },

    // ── Endpoints registry ────────────────────────────────────
    endpoints: {
      seller:          { url: `${baseUrl}/api/agent/seller`,         methods: ["GET", "POST"], description: "Order intake + catalog browse" },
      research:        { url: `${baseUrl}/api/agent/research`,       methods: ["POST"],        description: "Standalone Composer endpoint" },
      inventory:       { url: `${baseUrl}/api/agent/inventory`,      methods: ["GET"],         description: "Full product + 3rd-party service catalog" },
      pricing:         { url: `${baseUrl}/api/agent/pricing`,        methods: ["GET"],         description: "Live credit pricing for all products" },
      pipeline:        { url: `${baseUrl}/api/pipeline/run`,         methods: ["POST"],        description: "Direct pipeline runner with mode selection" },
      clarify:         { url: `${baseUrl}/api/pipeline/clarify`,     methods: ["POST"],        description: "Pre-run brief quality check + clarification questions" },
      followup:        { url: `${baseUrl}/api/pipeline/followup`,    methods: ["POST"],        description: "Follow-up Q&A on a delivered report" },
      extractActions:  { url: `${baseUrl}/api/pipeline/extract-actions`, methods: ["POST"],   description: "Extract action items, risks, decisions from a report" },
      vision:          { url: `${baseUrl}/api/agents/vision`,         methods: ["GET", "POST"], description: "VISION agent — NanoBanana image generation with quality loop" },
      stats:           { url: `${baseUrl}/api/agent/stats`,          methods: ["GET"],         description: "Live agent run statistics" },
      events:          { url: `${baseUrl}/api/agent/events`,         methods: ["GET"],         description: "SSE stream of pipeline stage events" },
      transactions:    { url: `${baseUrl}/api/pipeline/transactions`,methods: ["GET"],         description: "Credit transaction history" },
      jobs:            { url: `${baseUrl}/api/workspace/jobs`,       methods: ["GET"],         description: "Job status + history" },
      workspaceProfile:{ url: `${baseUrl}/api/workspace/profile`,    methods: ["GET","POST"],  description: "Workspace context profile CRUD" },
      settingsStatus:  { url: `${baseUrl}/api/settings/status`,      methods: ["GET"],         description: "Tool settings and API key availability" },
    },

    // ── Pricing ───────────────────────────────────────────────
    pricing: {
      creditValue: "$0.10 USDC per credit",
      research: {
        quick:    { credits: 1,  description: "Fast 3-source scan, ~10s" },
        standard: { credits: 5,  description: "5–8 source structured document, ~30s" },
        deep:     { credits: 10, description: "8+ source deep analysis with enrichment, ~60s" },
      },
      pipeline: {
        minimum: 6,
        maximum: 16,
        description: "Full 4-agent pipeline. Credits scale with depth and enrichment.",
      },
      seller: products.map((p) => ({ id: p.id, name: p.name, credits: p.price, category: p.category })),
    },

    // ── Rate limits & operational info ────────────────────────
    operational: {
      rateLimit: {
        perMinute: 10,
        perHour: 100,
        burstAllowed: true,
      },
      latency: {
        p50: "15s",
        p95: "60s",
        description: "Pipeline latency scales with depth. Standalone Interpreter ~3s, full pipeline ~30-60s.",
      },
      availability: "best-effort (hackathon)",
      dataRetention: "Session-scoped. Artifacts stored in browser localStorage. No server-side job persistence.",
    },

    // ── Error codes ───────────────────────────────────────────
    errorCodes: {
      402: "Payment required — acquire Nevermined x402 token",
      400: "Invalid request — check inputSchema for required fields",
      429: "Rate limit exceeded",
      503: "Seller disabled — enable in tool settings",
      500: "Pipeline error — check /api/agent/stats for diagnostics",
    },
  });
}
