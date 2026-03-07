import "server-only";

import { runStrategist, runFollowUp, type StrategistRequest, type StructuredBrief } from "./strategist";
import { runResearch, type ResearchDocument } from "./researcher";
import { runBuyer, type BuyerResult, type PurchasedAsset } from "./buyer";
import { planSellerOrder, buildDeliveryPackage, type SellerResult, type SellerOrder, type DeliveryPackage } from "./seller";
import { ledger, AGENT_PROFILES, type AgentTransaction } from "./transactions";
import { agentEvents } from "./event-store";
import { complete, type AIProvider } from "@/lib/ai/providers";
import type { ToolSettings } from "@/lib/tool-settings";
import type { SponsorToolUsage, EnrichmentSummary, ProcurementStatus, PipelineStage, PipelineEvent, ProvenanceInfo } from "@/types/pipeline";
import { withTimeout } from "@/lib/utils";
import { logNeverminedTask } from "@/lib/nevermined/server";
import { runVisionAgent } from "@/lib/agents/vision";
import { isNanobananaConfigured } from "@/lib/agents/vision/nanobanana";
import { uploadDeliverable } from "@/lib/blob/storage";
export type { SponsorToolUsage, PipelineStage, PipelineEvent };

const STRATEGIST_TIMEOUT_MS = 60_000;  // 60 s
const RESEARCHER_TIMEOUT_MS = 120_000; // 120 s
const BUYER_TIMEOUT_MS = 45_000;       // 45 s

export interface PipelineResult {
  id: string;
  userInput: string;
  outputType: string;
  brief: StructuredBrief;
  followUpBriefs: StructuredBrief[];
  document: ResearchDocument;
  purchasedAssets: PurchasedAsset[];
  buyerResult?: BuyerResult;
  transactions: AgentTransaction[];
  events: PipelineEvent[];
  totalCredits: number;
  totalDurationMs: number;
  iterations: number;
  toolsUsed: SponsorToolUsage[];
  provenance?: ProvenanceInfo;
  workspaceId?: string;
  visionResult?: {
    imageUrl: string;
    attempts: number;
    passedQuality: boolean;
    qualityScore: number;
    finalPrompt: string;
  };
}

type EventCallback = (event: PipelineEvent) => void;

function makeEventId() {
  return `pevt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeTxId() {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Push a pipeline event into the unified event store for SSE consumers */
function broadcastEvent(event: PipelineEvent) {
  const eventType = event.stage === "complete" ? "pipeline_complete" : event.stage;
  agentEvents.push({
    id: event.id,
    type: eventType as Parameters<typeof agentEvents.push>[0]["type"],
    timestamp: event.timestamp,
    data: { agent: event.agent, stage: event.stage, message: event.message, ...event.data },
  });
}

const strategist = AGENT_PROFILES.strategist;
const researcher = AGENT_PROFILES.researcher;
const buyer = AGENT_PROFILES.buyer;
const seller = AGENT_PROFILES.seller;

/**
 * Evaluate whether the research document is sufficient or needs more context.
 * Returns null if sufficient, or a follow-up question string if not.
 */
async function evaluateCompleteness(
  brief: StructuredBrief,
  document: ResearchDocument,
  provider?: AIProvider
): Promise<string | null> {
  const systemPrompt = `You are a quality evaluator. Given a research brief and the resulting document, determine if the document adequately addresses all key questions and deliverables.

If the document is sufficient, respond with exactly: SUFFICIENT

If the document is missing critical information, respond with a single follow-up question that would help fill the gap. Start with "FOLLOWUP:" followed by the question.

Be conservative — only request a follow-up if there's a clear, significant gap. Minor omissions are acceptable.`;

  const userPrompt = `Brief objective: ${brief.objective}
Key questions: ${brief.keyQuestions.join(", ")}
Expected deliverables: ${brief.deliverables.join(", ")}

Document title: ${document.title}
Document summary: ${document.summary}
Sections covered: ${document.sections.map((s) => s.heading).join(", ")}
Sources used: ${document.sources.length}

Is this document sufficient?`;

  const result = await withTimeout(
    complete({
      provider,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 256,
      temperature: 0.1,
    }),
    30_000,
    "Completeness evaluator"
  );

  const content = result.content.trim();

  if (content.startsWith("FOLLOWUP:")) {
    return content.slice(9).trim();
  }

  return null;
}

export async function runPipeline(
  userInput: string,
  outputType: string = "general",
  provider?: AIProvider,
  onEvent?: EventCallback,
  maxIterations: number = 2,
  toolSettings?: ToolSettings,
  workspaceId?: string
): Promise<PipelineResult> {
  const pipelineId = `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startTime = Date.now();
  const events: PipelineEvent[] = [];
  const transactions: AgentTransaction[] = [];
  const followUpBriefs: StructuredBrief[] = [];
  const toolsUsed: SponsorToolUsage[] = [];

  // Trading toggles (both default to true)
  const internalTrading = toolSettings?.trading?.internalTrading ?? true;
  const externalTrading = toolSettings?.trading?.externalTrading ?? true;
  const nvmTracking = toolSettings?.trading?.nvmTracking ?? true;

  /** Record a transaction only when internal trading is enabled */
  function recordInternal(tx: AgentTransaction) {
    transactions.push(tx);
    if (internalTrading) {
      ledger.record(tx);
    }
  }

  function emit(stage: PipelineStage, agent: PipelineEvent["agent"], message: string, data?: Record<string, unknown>) {
    const event: PipelineEvent = {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      stage,
      agent,
      message,
      data,
    };
    events.push(event);
    onEvent?.(event);
    broadcastEvent(event);
  }

  try {
    // ── Stage 1: Strategist produces structured brief ──────────────
    emit("strategist_working", "strategist", "Analyzing input and structuring comprehensive brief…");

    const brief = await withTimeout(
      runStrategist({
        userInput,
        outputType: outputType as StrategistRequest["outputType"],
        provider,
        workspaceId,
      }),
      STRATEGIST_TIMEOUT_MS,
      "Strategist"
    );

    // Record transaction: user → strategist
    const tx1: AgentTransaction = {
      id: makeTxId(),
      timestamp: new Date().toISOString(),
      from: { id: "user", name: "User" },
      to: { id: strategist.id, name: strategist.name },
      credits: internalTrading ? brief.creditsUsed : 0,
      purpose: `Structure brief: "${userInput.slice(0, 50)}…"`,
      artifactId: brief.id,
      status: "completed",
      durationMs: brief.durationMs,
    };
    recordInternal(tx1);

    toolsUsed.push({ tool: "llm-synthesis", label: `Strategist LLM — ${brief.provider}/${brief.model}`, sponsor: "LLM", timestamp: new Date().toISOString(), detail: `${brief.creditsUsed}cr` });

    emit("strategist_complete", "strategist", `Brief produced: "${brief.title}"`, {
      briefId: brief.id,
      searchQueries: brief.searchQueries.length,
      keyQuestions: brief.keyQuestions.length,
    });

    // ── Stage 2: Researcher receives brief and starts research ──────
    if (internalTrading) {
      emit("researcher_buying", "researcher", `Purchasing structured brief from Strategist (${brief.creditsUsed}cr)…`);

      const tx2: AgentTransaction = {
        id: makeTxId(),
        timestamp: new Date().toISOString(),
        from: { id: researcher.id, name: researcher.name },
        to: { id: strategist.id, name: strategist.name },
        credits: brief.creditsUsed,
        purpose: `Buy brief: "${brief.title}"`,
        artifactId: brief.id,
        status: "completed",
      };
      recordInternal(tx2);
    } else {
      emit("researcher_buying", "researcher", `Received brief from Strategist (internal trading off)`);
    }

    emit("researcher_working", "researcher", `Searching web with ${brief.searchQueries.length} queries…`);

    // Pass the strategist's search queries to the researcher for targeted multi-search
    let document = await withTimeout(
      runResearch({
        query: brief.objective,
        searchQueries: brief.searchQueries,
        provider,
        depth: "standard",
        toolSettings: toolSettings?.researcher,
      }),
      RESEARCHER_TIMEOUT_MS,
      "Researcher"
    );

    // Merge researcher's toolsUsed into pipeline toolsUsed
    if (document.toolsUsed) toolsUsed.push(...document.toolsUsed);

    // Record transaction: pipeline → researcher
    const tx3: AgentTransaction = {
      id: makeTxId(),
      timestamp: new Date().toISOString(),
      from: { id: "pipeline", name: "Pipeline" },
      to: { id: researcher.id, name: researcher.name },
      credits: internalTrading ? document.creditsUsed : 0,
      purpose: `Research: "${brief.title}"`,
      artifactId: document.id,
      status: "completed",
      durationMs: document.durationMs,
    };
    recordInternal(tx3);

    // ── Stage 3: Evaluate completeness + optional back-loop ────────
    let iterations = 1;

    for (let i = 0; i < maxIterations - 1; i++) {
      emit("researcher_evaluating", "researcher", "Evaluating document completeness…");

      const followUp = await evaluateCompleteness(brief, document, provider);

      if (!followUp) {
        emit("researcher_evaluating", "researcher", "Document is sufficient — no follow-up needed.");
        break;
      }

      emit("researcher_followup", "researcher", `Requesting more context from Strategist: "${followUp.slice(0, 80)}…"`);

      // Researcher buys follow-up from Strategist
      const followUpBrief = await withTimeout(
        runFollowUp(brief, followUp, provider),
        STRATEGIST_TIMEOUT_MS,
        "Strategist follow-up"
      );
      followUpBriefs.push(followUpBrief);

      if (internalTrading) {
        const tx4: AgentTransaction = {
          id: makeTxId(),
          timestamp: new Date().toISOString(),
          from: { id: researcher.id, name: researcher.name },
          to: { id: strategist.id, name: strategist.name },
          credits: followUpBrief.creditsUsed,
          purpose: `Follow-up brief: "${followUp.slice(0, 50)}…"`,
          artifactId: followUpBrief.id,
          status: "completed",
          durationMs: followUpBrief.durationMs,
        };
        recordInternal(tx4);
      }

      emit("researcher_working", "researcher", `Running follow-up research with ${followUpBrief.searchQueries.length} new queries…`);

      // Run additional research with the follow-up queries
      const followUpQuery = [
        followUpBrief.objective,
        ...followUpBrief.searchQueries.slice(0, 3),
      ].join(" | ");

      const additionalDoc = await withTimeout(
        runResearch({
          query: followUpQuery,
          provider,
          depth: "quick",
          toolSettings: toolSettings?.researcher,
        }),
        RESEARCHER_TIMEOUT_MS,
        "Researcher follow-up"
      );

      // Merge additional findings into the document
      document = {
        ...document,
        sections: [
          ...document.sections,
          ...additionalDoc.sections,
        ],
        sources: [
          ...document.sources,
          ...additionalDoc.sources,
        ],
        creditsUsed: document.creditsUsed + additionalDoc.creditsUsed,
        durationMs: document.durationMs + additionalDoc.durationMs,
      };

      const tx5: AgentTransaction = {
        id: makeTxId(),
        timestamp: new Date().toISOString(),
        from: { id: "pipeline", name: "Pipeline" },
        to: { id: researcher.id, name: researcher.name },
        credits: internalTrading ? additionalDoc.creditsUsed : 0,
        purpose: `Follow-up research: "${followUp.slice(0, 50)}…"`,
        artifactId: additionalDoc.id,
        status: "completed",
        durationMs: additionalDoc.durationMs,
      };
      recordInternal(tx5);

      iterations++;
    }

    // ── Stage 4: Buyer Agent — discover & purchase marketplace assets ──
    let buyerResult: BuyerResult | undefined;
    let purchasedAssets: PurchasedAsset[] = [];

    if (externalTrading) {
      emit("buyer_discovering", "buyer", `Searching marketplace for assets related to: "${brief.title.slice(0, 60)}…"`);
      toolsUsed.push({ tool: "nevermined-402", label: "Nevermined Marketplace Discovery", sponsor: "Nevermined", timestamp: new Date().toISOString(), detail: `query: ${brief.title.slice(0, 40)}` });

      try {
        buyerResult = await withTimeout(
          runBuyer({
            query: brief.objective,
            maxCredits: 20,
            preferredTypes: ["report", "dataset", "service"],
          }),
          BUYER_TIMEOUT_MS,
          "Buyer"
        );

        purchasedAssets = buyerResult.purchased.filter((p) => p.status === "success");

        if (purchasedAssets.length > 0) {
          emit("buyer_purchasing", "buyer", `Purchased ${purchasedAssets.length} asset(s) from marketplace`);
          toolsUsed.push({ tool: "nevermined-settled", label: `Nevermined Purchase — ${purchasedAssets.length} asset(s), ${buyerResult.totalCreditsSpent}cr`, sponsor: "Nevermined", timestamp: new Date().toISOString() });

          // Record buyer transactions (external → always recorded to ledger)
          for (const asset of purchasedAssets) {
            const txBuy: AgentTransaction = {
              id: makeTxId(),
              timestamp: new Date().toISOString(),
              from: { id: buyer.id, name: buyer.name },
              to: { id: "marketplace", name: `Marketplace: ${asset.provider}` },
              credits: asset.creditsPaid,
              purpose: `Purchase: "${asset.name}"`,
              artifactId: asset.id,
              status: "completed",
              durationMs: asset.durationMs,
            };
            transactions.push(txBuy);
            ledger.record(txBuy);
          }

          // Merge purchased content into the research document as additional sections
          const purchasedSections = purchasedAssets
            .filter((a) => a.content)
            .map((a) => ({
              heading: `Marketplace: ${a.name}`,
              content: a.content.slice(0, 4000),
            }));

          if (purchasedSections.length > 0) {
            document = {
              ...document,
              sections: [...document.sections, ...purchasedSections],
              creditsUsed: document.creditsUsed + buyerResult.totalCreditsSpent,
            };
          }

          emit("buyer_complete", "buyer", `${purchasedAssets.length} marketplace asset(s) merged into report (${buyerResult.totalCreditsSpent}cr)`);
        } else {
          emit("buyer_complete", "buyer", buyerResult.discovered.length > 0
            ? `Found ${buyerResult.discovered.length} marketplace assets but none purchased`
            : "No relevant marketplace assets found — using research data only");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Buyer agent failed";
        emit("buyer_complete", "buyer", `Marketplace procurement skipped: ${msg}`);
      }
    } else {
      emit("buyer_complete", "buyer", "External marketplace trading is disabled — skipping buyer agent");
    }

    // ── Stage 5: VISION — generate hero image (non-blocking, best-effort) ──
    const visionEnabled = toolSettings?.trading?.visionEnabled ?? true;
    let visionResult: import("@/types/pipeline").PipelineResult["visionResult"] | undefined;
    if (visionEnabled && (isNanobananaConfigured() || true)) {
      try {
        const vr = await runVisionAgent({
          brief: `${document.title}. ${document.summary.slice(0, 300)}`,
          outputContext: "research_report",
          requirements: [
            `Image must visually depict the topic: "${document.title}"`,
            "Professional quality",
            "No text overlay",
            "No generic landscapes or unrelated stock imagery",
          ],
          aspectRatio: "16:9",
          style: { mood: "professional" },
          calledBy: "composer",
        });
        if (vr.imageUrl) {
          visionResult = {
            imageUrl: vr.imageUrl,
            attempts: vr.attempts,
            passedQuality: vr.passedQuality,
            qualityScore: vr.qualityReport?.score ?? 0,
            finalPrompt: vr.finalPrompt,
          };
          toolsUsed.push({
            tool: "nanobanana-generate",
            label: `VISION — NanoBanana image generation`,
            sponsor: "NanoBanana",
            timestamp: new Date().toISOString(),
            detail: `${vr.attempts} attempt${vr.attempts !== 1 ? "s" : ""} · score ${vr.qualityReport?.score ?? "?"}/100`,
          });
          if (vr.attempts > 1) {
            toolsUsed.push({
              tool: "nanobanana-judge",
              label: "VISION quality judge",
              sponsor: "NanoBanana",
              timestamp: new Date().toISOString(),
              detail: `GPT-4o-mini vision · ${vr.passedQuality ? "passed" : "best-of-" + vr.attempts}`,
            });
          }
          emit("vision_complete", "vision", `[IMAGE] Generated in ${vr.attempts} attempt${vr.attempts !== 1 ? "s" : ""} · quality ${vr.qualityReport?.score ?? "?"}/100`, {
            imageUrl: vr.imageUrl,
            passedQuality: vr.passedQuality,
          });
        }
      } catch { /* VISION is non-critical — never fail the pipeline */ }
    }

    // ── Complete ────────────────────────────────────────────────────
    const totalCredits = transactions
      .filter((tx) => tx.status === "completed")
      .reduce((sum, tx) => sum + tx.credits, 0);

    const totalDurationMs = Date.now() - startTime;

    // Build provenance block
    const agentsInvolved = ["Strategist", "Researcher"];
    if (externalTrading) agentsInvolved.push("Buyer");
    const modelsUsed = [
      { agent: "Strategist", provider: brief.provider, model: brief.model },
      { agent: "Researcher", provider: document.provider, model: document.model },
    ];
    const provenance = {
      jobId: pipelineId,
      agentsInvolved,
      modelsUsed,
      sourcesFetchedAt: document.createdAt,
      externalDataPurchased: purchasedAssets.length > 0,
      confidenceSummary: (document as ResearchDocument & { confidence?: import("@/types/pipeline").ResearchConfidence }).confidence,
      generatedAt: new Date().toISOString(),
      durationMs: totalDurationMs,
      creditsUsed: totalCredits,
    };

    emit("complete", "pipeline", `Pipeline complete — ${document.sections.length} sections, ${document.sources.length} sources, ${purchasedAssets.length} purchases, ${totalCredits}cr total`);

    // Log this pipeline run on the Nevermined network
    if (nvmTracking) {
      const nvmResult = await withTimeout(logNeverminedTask({
        credits: totalCredits,
        description: `Pipeline: "${brief.title.slice(0, 60)}" — ${document.sections.length} sections, ${totalCredits}cr`,
        tag: "pipeline",
      }), 10_000, "Nevermined log").catch(() => ({ success: false, agentRequestId: "" }));
      if (nvmResult.success) {
        emit("complete", "pipeline", `Nevermined: task logged (${nvmResult.agentRequestId})`);
      }
    }

    const result = {
      id: pipelineId,
      userInput,
      outputType,
      brief,
      followUpBriefs,
      document,
      purchasedAssets,
      buyerResult,
      transactions,
      events,
      totalCredits,
      totalDurationMs,
      iterations,
      toolsUsed,
      provenance,
      workspaceId,
      visionResult,
    };

    // Persist full deliverable to Vercel Blob (non-blocking, best-effort)
    uploadDeliverable(result as unknown as Record<string, unknown>, {
      orderId: pipelineId,
      workspaceId,
    }).then((blobUrl) => {
      if (blobUrl) emit("complete", "pipeline", `Deliverable persisted → ${blobUrl}`);
    }).catch(() => { /* blob persistence is non-critical */ });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed";
    emit("error", "pipeline", message);
    throw error;
  }
}

/**
 * Run just Agent 1 (Strategist) standalone.
 */
export async function runStrategistStandalone(
  userInput: string,
  outputType: string = "general",
  provider?: AIProvider,
  onEvent?: EventCallback,
  toolSettings?: ToolSettings
) {
  const events: PipelineEvent[] = [];

  function emit(stage: PipelineStage, agent: PipelineEvent["agent"], message: string, data?: Record<string, unknown>) {
    const event: PipelineEvent = {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      stage,
      agent,
      message,
      data,
    };
    events.push(event);
    onEvent?.(event);
    broadcastEvent(event);
  }

  emit("strategist_working", "strategist", "Analyzing input and structuring brief…");

  const brief = await withTimeout(
    runStrategist({ userInput, outputType: outputType as StrategistRequest["outputType"], provider }),
    STRATEGIST_TIMEOUT_MS,
    "Strategist standalone"
  );

  const txS: AgentTransaction = {
    id: makeTxId(),
    timestamp: new Date().toISOString(),
    from: { id: "user", name: "User" },
    to: { id: strategist.id, name: strategist.name },
    credits: brief.creditsUsed,
    purpose: `Structure brief: "${userInput.slice(0, 50)}…"`,
    artifactId: brief.id,
    status: "completed",
    durationMs: brief.durationMs,
  };
  ledger.record(txS);

  emit("strategist_complete", "strategist", `Brief produced: "${brief.title}"`);

  const toolsUsed: SponsorToolUsage[] = [
    { tool: "llm-synthesis", label: `Strategist LLM — ${brief.provider}/${brief.model}`, sponsor: "LLM", timestamp: new Date().toISOString(), detail: `${brief.creditsUsed}cr` },
  ];

  // Log on Nevermined network — only if nvmTracking is enabled
  if (toolSettings?.trading?.nvmTracking ?? true) {
    await withTimeout(
      logNeverminedTask({ credits: brief.creditsUsed, description: `Strategist: "${brief.title.slice(0, 60)}"`, tag: "strategist" }),
      10_000,
      "Nevermined log"
    ).catch(() => { /* non-critical — never block the response */ });
  }

  return { brief, transaction: txS, events, toolsUsed };
}

/**
 * Run just Agent 2 (Researcher) standalone.
 */
export async function runResearcherStandalone(
  query: string,
  depth: "quick" | "standard" | "deep" = "standard",
  provider?: AIProvider,
  onEvent?: EventCallback,
  toolSettings?: ToolSettings
) {
  const events: PipelineEvent[] = [];

  function emit(stage: PipelineStage, agent: PipelineEvent["agent"], message: string, data?: Record<string, unknown>) {
    const event: PipelineEvent = {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      stage,
      agent,
      message,
      data,
    };
    events.push(event);
    onEvent?.(event);
    broadcastEvent(event);
  }

  emit("researcher_working", "researcher", `Searching web for: "${query.slice(0, 60)}…"`);

  const document = await withTimeout(
    runResearch({ query, provider, depth, toolSettings: toolSettings?.researcher }),
    RESEARCHER_TIMEOUT_MS,
    "Researcher standalone"
  );

  const txR: AgentTransaction = {
    id: makeTxId(),
    timestamp: new Date().toISOString(),
    from: { id: "user", name: "User" },
    to: { id: researcher.id, name: researcher.name },
    credits: document.creditsUsed,
    purpose: `Research: "${query.slice(0, 50)}…"`,
    artifactId: document.id,
    status: "completed",
    durationMs: document.durationMs,
  };
  ledger.record(txR);

  emit("complete", "researcher", `Research complete — ${document.sections.length} sections, ${document.sources.length} sources`);

  // Log on Nevermined network — only if nvmTracking is enabled
  if (toolSettings?.trading?.nvmTracking ?? true) {
    await withTimeout(
      logNeverminedTask({ credits: document.creditsUsed, description: `Research: "${query.slice(0, 60)}"`, tag: "researcher" }),
      10_000,
      "Nevermined log"
    ).catch(() => { /* non-critical */ });
  }

  const resToolsUsed: SponsorToolUsage[] = [...(document.toolsUsed ?? [])];

  // VISION — generate hero image after research (non-blocking, best-effort)
  let visionResult: PipelineResult["visionResult"] | undefined;
  if (toolSettings?.trading?.visionEnabled !== false) {
    try {
      const vr = await runVisionAgent({
        brief: `${document.title}. ${document.summary.slice(0, 200)}`,
        outputContext: "research_report",
        requirements: ["Professional quality", "No text overlay", "Relevant to topic"],
        aspectRatio: "16:9",
        style: { mood: "professional" },
        calledBy: "composer",
      });
      if (vr.imageUrl) {
        visionResult = {
          imageUrl: vr.imageUrl,
          attempts: vr.attempts,
          passedQuality: vr.passedQuality,
          qualityScore: vr.qualityReport?.score ?? 0,
          finalPrompt: vr.finalPrompt,
        };
        resToolsUsed.push({
          tool: "nanobanana-generate",
          label: `VISION — NanoBanana image generation`,
          sponsor: "NanoBanana",
          timestamp: new Date().toISOString(),
          detail: `${vr.attempts} attempt${vr.attempts !== 1 ? "s" : ""} · score ${vr.qualityReport?.score ?? "?"}/100`,
        });
        emit("vision_complete", "vision", `[IMAGE] Generated in ${vr.attempts} attempt${vr.attempts !== 1 ? "s" : ""} · quality ${vr.qualityReport?.score ?? "?"}/100`, {
          imageUrl: vr.imageUrl,
          passedQuality: vr.passedQuality,
        });
      }
    } catch { /* VISION is non-critical */ }
  }

  const researchResult = { document, transaction: txR, events, toolsUsed: resToolsUsed, visionResult };

  // Persist researcher deliverable to Vercel Blob (non-blocking, best-effort)
  uploadDeliverable(researchResult as unknown as Record<string, unknown>, {
    orderId: document.id,
  }).then((blobUrl) => {
    if (blobUrl) emit("complete", "researcher", `Deliverable persisted → ${blobUrl}`);
  }).catch(() => { /* blob persistence is non-critical */ });

  return researchResult;
}

// ─── Reverse Pipeline: Fulfill External Seller Order ─────────────────
// Flow: External Buyer → Seller Agent → Strategist → Researcher → (optional) Buyer → Output

export interface SellerPipelineResult {
  id: string;
  orderId: string;
  query: string;
  sellerResult: SellerResult;
  brief?: StructuredBrief;
  document?: ResearchDocument;
  purchasedAssets?: PurchasedAsset[];
  transactions: AgentTransaction[];
  events: PipelineEvent[];
  totalCredits: number;
  totalDurationMs: number;
  toolsUsed: SponsorToolUsage[];
  deliveryPackage?: DeliveryPackage;
  /** PRD §14: enrichment summary with procurement status and metadata */
  enrichmentSummary: EnrichmentSummary;
}

export async function fulfillSellerOrder(
  order: SellerOrder,
  provider?: AIProvider,
  onEvent?: EventCallback,
  toolSettings?: ToolSettings
): Promise<SellerPipelineResult> {
  const pipelineId = `sell-pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startTime = Date.now();
  const events: PipelineEvent[] = [];
  const transactions: AgentTransaction[] = [];
  const toolsUsed: SponsorToolUsage[] = [];

  function emit(stage: PipelineStage, agent: PipelineEvent["agent"], message: string, data?: Record<string, unknown>) {
    const event: PipelineEvent = {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      stage,
      agent,
      message,
      data,
    };
    events.push(event);
    onEvent?.(event);
    broadcastEvent(event);
  }

  try {
    // ── Stage 1: Seller receives order and plans fulfillment ────────────
    emit("seller_received", "seller", `Order received: "${order.query.slice(0, 80)}…"`);
    emit("seller_planning", "seller", "Running decision engine — matching product and planning fulfillment…");

    const sellerResult = await planSellerOrder(order);

    if (sellerResult.status === "failed") {
      emit("seller_complete", "seller", `Order failed: ${sellerResult.error}`);
      return {
        id: pipelineId,
        orderId: order.id,
        query: order.query,
        sellerResult,
        transactions,
        events,
        totalCredits: 0,
        totalDurationMs: Date.now() - startTime,
        toolsUsed,
        enrichmentSummary: {
          procurementStatus: "not_needed" as const,
          enrichmentConsidered: false,
          externalDataUsed: false,
          purchasedAssetCount: 0,
          externalProviders: [],
          externalCreditsSpent: 0,
          purchasedAssetNames: [],
        },
      };
    }

    const plan = sellerResult.fulfillmentPlan;
    emit("seller_planning", "seller",
      `Product matched: "${plan.product.name}" (${plan.product.price}cr). ` +
      `External data: ${plan.shouldBuyExternal ? "yes" : "no"}. ` +
      `Reasoning: ${plan.reasoning.slice(0, 120)}`,
      { productId: plan.product.id, shouldBuyExternal: plan.shouldBuyExternal }
    );

    toolsUsed.push({ tool: "nevermined-402", label: "Nevermined x402 — External Order Received", sponsor: "Nevermined", timestamp: new Date().toISOString(), detail: `${plan.product.price}cr` });

    // Record: external buyer → seller
    const txOrder: AgentTransaction = {
      id: makeTxId(),
      timestamp: new Date().toISOString(),
      from: { id: "external-buyer", name: order.caller ?? "External Buyer" },
      to: { id: seller.id, name: seller.name },
      credits: plan.product.price,
      purpose: `Order: "${order.query.slice(0, 50)}…"`,
      artifactId: sellerResult.id,
      status: "completed",
    };
    transactions.push(txOrder);
    ledger.record(txOrder);

    emit("seller_fulfilling", "seller", "Dispatching to internal pipeline for generation…");

    // ── Stage 2: Strategist structures the brief ──────────────────────
    emit("strategist_working", "strategist", "Analyzing seller order and structuring brief…");

    const brief = await withTimeout(
      runStrategist({
        userInput: plan.expandedPrompt,
        outputType: plan.product.outputType,
        provider: order.provider ?? provider,
      }),
      STRATEGIST_TIMEOUT_MS,
      "Strategist (seller order)"
    );

    const txStrat: AgentTransaction = {
      id: makeTxId(),
      timestamp: new Date().toISOString(),
      from: { id: seller.id, name: seller.name },
      to: { id: strategist.id, name: strategist.name },
      credits: brief.creditsUsed,
      purpose: `Seller order brief: "${brief.title.slice(0, 50)}"`,
      artifactId: brief.id,
      status: "completed",
      durationMs: brief.durationMs,
    };
    transactions.push(txStrat);
    ledger.record(txStrat);

    toolsUsed.push({ tool: "llm-synthesis", label: `Strategist LLM — ${brief.provider}/${brief.model}`, sponsor: "LLM", timestamp: new Date().toISOString() });

    emit("strategist_complete", "strategist", `Brief produced: "${brief.title}"`);

    // ── Stage 3: Researcher executes research ─────────────────────────
    emit("researcher_working", "researcher", `Searching web with ${brief.searchQueries.length} queries…`);

    let document = await withTimeout(
      runResearch({
        query: brief.objective,
        searchQueries: brief.searchQueries,
        provider: order.provider ?? provider,
        depth: "standard",
        toolSettings: toolSettings?.researcher,
      }),
      RESEARCHER_TIMEOUT_MS,
      "Researcher (seller order)"
    );

    if (document.toolsUsed) toolsUsed.push(...document.toolsUsed);

    const txRes: AgentTransaction = {
      id: makeTxId(),
      timestamp: new Date().toISOString(),
      from: { id: seller.id, name: seller.name },
      to: { id: researcher.id, name: researcher.name },
      credits: document.creditsUsed,
      purpose: `Seller order research: "${brief.title.slice(0, 50)}"`,
      artifactId: document.id,
      status: "completed",
      durationMs: document.durationMs,
    };
    transactions.push(txRes);
    ledger.record(txRes);

    // ── Stage 4: Optional Buyer — acquire 3rd-party data ──────────────
    // PRD §7: Two execution contexts:
    //   Context A (UI Demo): externalTrading=false → skip procurement, narrate clearly
    //   Context B (Agentic Live): externalTrading=true → allow real procurement
    let purchasedAssets: PurchasedAsset[] = [];
    let procurementStatus: ProcurementStatus = "not_needed";
    let procurementSkippedReason: string | undefined;
    let enrichmentConsidered = false;
    let externalCreditsSpent = 0;

    if (plan.shouldBuyExternal && plan.externalServices.length > 0) {
      enrichmentConsidered = true;
      const externalTradingEnabled = toolSettings?.trading?.externalTrading ?? true;

      if (!externalTradingEnabled) {
        // ── External trading disabled by settings ──
        procurementStatus = "disabled_by_settings";
        procurementSkippedReason = "External Marketplace is disabled in settings. Enable it to allow the Buyer to purchase from third-party agents.";
        emit("buyer_discovering", "buyer",
          `Seller evaluated external enrichment for ${plan.externalServices.length} service(s) — would improve output quality`,
          { enrichmentConsidered: true, servicesEvaluated: plan.externalServices.length }
        );
        emit("buyer_complete", "buyer",
          `External procurement disabled — ${procurementSkippedReason}`,
          { procurementStatus, reason: procurementSkippedReason }
        );
      } else {
        // ── External trading enabled — proceed with procurement ──────────
        emit("buyer_discovering", "buyer",
          `Seller requested external enrichment — ${plan.externalServices.length} service(s) targeted via Nevermined marketplace`,
          { enrichmentConsidered: true, servicesRequested: plan.externalServices.length }
        );
        toolsUsed.push({ tool: "nevermined-402", label: "Nevermined Marketplace — Seller External Buy", sponsor: "Nevermined", timestamp: new Date().toISOString() });

        try {
          const targetDids = plan.externalServices
            .map((s) => s.did)
            .filter(Boolean);

          if (targetDids.length > 0) {
            const buyerResult = await withTimeout(
              runBuyer({
                query: brief.objective,
                maxCredits: 20,
                targetDids,
              }),
              BUYER_TIMEOUT_MS,
              "Buyer (seller order)"
            );

            purchasedAssets = buyerResult.purchased.filter((p) => p.status === "success");
            externalCreditsSpent = buyerResult.totalCreditsSpent;

            if (purchasedAssets.length > 0) {
              emit("buyer_purchasing", "buyer",
                `Buyer purchased ${purchasedAssets.length} asset(s) for seller order — merging into deliverable`,
                { purchasedCount: purchasedAssets.length, providers: purchasedAssets.map(a => a.provider) }
              );
              toolsUsed.push({ tool: "nevermined-settled", label: `Nevermined Settlement — ${purchasedAssets.length} asset(s)`, sponsor: "Nevermined", timestamp: new Date().toISOString() });

              for (const asset of purchasedAssets) {
                const txBuy: AgentTransaction = {
                  id: makeTxId(),
                  timestamp: new Date().toISOString(),
                  from: { id: buyer.id, name: buyer.name },
                  to: { id: "marketplace", name: `Marketplace: ${asset.provider}` },
                  credits: asset.creditsPaid,
                  purpose: `Seller order purchase: "${asset.name}"`,
                  artifactId: asset.id,
                  status: "completed",
                  durationMs: asset.durationMs,
                };
                transactions.push(txBuy);
                ledger.record(txBuy);
              }

              // Merge: append external assets as labeled report sections
              const purchasedSections = purchasedAssets
                .filter((a) => a.content)
                .map((a) => ({
                  heading: `External Data: ${a.name}`,
                  content: a.content.slice(0, 4000),
                }));

              if (purchasedSections.length > 0) {
                document = {
                  ...document,
                  sections: [...document.sections, ...purchasedSections],
                  creditsUsed: document.creditsUsed + externalCreditsSpent,
                };
              }

              procurementStatus = "purchased_and_merged";
              emit("buyer_complete", "buyer",
                `${purchasedAssets.length} external asset(s) merged into deliverable (${externalCreditsSpent}cr spent externally)`,
                { procurementStatus, externalCreditsSpent, assetNames: purchasedAssets.map(a => a.name) }
              );
            } else {
              procurementStatus = "attempted_none_purchased";
              emit("buyer_complete", "buyer",
                "Buyer discovered marketplace assets but none met quality threshold — using internal research only",
                { procurementStatus }
              );
            }
          } else {
            procurementStatus = "attempted_none_purchased";
            emit("buyer_complete", "buyer", "No valid service DIDs available for procurement", { procurementStatus });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "External purchase failed";
          procurementStatus = "failed_and_skipped";
          procurementSkippedReason = msg;
          emit("buyer_complete", "buyer",
            `External procurement failed and was skipped — ${msg}. Delivering internal report.`,
            { procurementStatus, error: msg }
          );
        }
      }
    } else if (plan.shouldBuyExternal === false) {
      procurementStatus = "not_needed";
      emit("researcher_working", "researcher", "Seller determined external enrichment not needed for this request — internal pipeline sufficient");
    }

    // ── Complete ──────────────────────────────────────────────────────
    const totalCredits = transactions
      .filter((tx) => tx.status === "completed")
      .reduce((sum, tx) => sum + tx.credits, 0);
    const totalDurationMs = Date.now() - startTime;

    // Build delivery package with quality gate
    const deliveryPackage = buildDeliveryPackage(
      order.id,
      plan.product,
      document,
      purchasedAssets.length > 0,
      totalCredits,
      totalDurationMs,
      pipelineId
    );

    const qualityPassed = deliveryPackage.qualityGate.passed;

    sellerResult.status = qualityPassed ? "complete" : "quality_gate_failed";
    sellerResult.output = { brief, document, purchasedAssets };
    sellerResult.durationMs = totalDurationMs;
    sellerResult.deliveryPackage = deliveryPackage;

    if (!qualityPassed) {
      emit("seller_complete", "seller",
        `Quality gate failed (${deliveryPackage.qualityGate.score}/100) — ${deliveryPackage.qualityGate.blockedReason ?? "insufficient output quality"}`,
        { qualityScore: deliveryPackage.qualityGate.score, checks: deliveryPackage.qualityGate.checks }
      );
    } else {
      emit("seller_complete", "seller",
        `Order fulfilled — "${plan.product.name}" delivered. ${document.sections.length} sections, ${document.sources.length} sources, ${purchasedAssets.length} external assets, ${totalCredits}cr total. Quality: ${deliveryPackage.qualityGate.score}/100`,
        { qualityScore: deliveryPackage.qualityGate.score, variants: deliveryPackage.variants.map(v => v.format) }
      );
    }

    toolsUsed.push({ tool: "nevermined-settled", label: `Nevermined x402 — Order Fulfilled & Settled`, sponsor: "Nevermined", timestamp: new Date().toISOString(), detail: `${totalCredits}cr total` });

    // Log on Nevermined network
    // External seller orders (no toolSettings) always log; internal UI calls respect nvmTracking
    if (!toolSettings || (toolSettings.trading?.nvmTracking ?? true)) {
      await withTimeout(
        logNeverminedTask({ credits: totalCredits, description: `Seller order: "${order.query.slice(0, 60)}" — ${totalCredits}cr`, tag: "seller" }),
        10_000,
        "Nevermined log"
      ).catch(() => { /* non-critical */ });
    }

    const enrichmentSummary: EnrichmentSummary = {
      procurementStatus,
      procurementSkippedReason,
      enrichmentConsidered,
      externalDataUsed: procurementStatus === "purchased_and_merged",
      purchasedAssetCount: purchasedAssets.length,
      externalProviders: [...new Set(purchasedAssets.map((a) => a.provider).filter(Boolean))],
      externalCreditsSpent,
      purchasedAssetNames: purchasedAssets.map((a) => a.name),
    };

    const sellerPipelineResult = {
      id: pipelineId,
      orderId: order.id,
      query: order.query,
      sellerResult,
      brief,
      document,
      purchasedAssets,
      transactions,
      events,
      totalCredits,
      totalDurationMs,
      toolsUsed,
      deliveryPackage,
      enrichmentSummary,
    };

    // Persist seller deliverable to Vercel Blob (non-blocking, best-effort)
    uploadDeliverable(sellerPipelineResult as unknown as Record<string, unknown>, {
      orderId: order.id,
    }).then((blobUrl) => {
      if (blobUrl) emit("seller_complete", "seller", `Deliverable persisted → ${blobUrl}`);
    }).catch(() => { /* blob persistence is non-critical */ });

    return sellerPipelineResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seller pipeline failed";
    emit("error", "seller", message);
    throw error;
  }
}
