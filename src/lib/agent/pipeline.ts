import "server-only";

import { runStrategist, runFollowUp, type StrategistRequest, type StructuredBrief } from "./strategist";
import { runResearch, type ResearchDocument } from "./researcher";
import { runBuyer, type BuyerResult, type PurchasedAsset } from "./buyer";
import { planSellerOrder, type SellerOrder, type SellerResult } from "./seller";
import { ledger, AGENT_PROFILES, type AgentTransaction } from "./transactions";
import { agentEvents } from "./event-store";
import { complete, type AIProvider } from "@/lib/ai/providers";
import type { ToolSettings } from "@/lib/tool-settings";
import type { SponsorToolUsage } from "@/types/pipeline";
import { logNeverminedTask } from "@/lib/nevermined/server";
export type { SponsorToolUsage };

export type PipelineStage =
  | "idle"
  | "strategist_working"
  | "strategist_complete"
  | "researcher_buying"
  | "researcher_working"
  | "researcher_evaluating"
  | "researcher_followup"
  | "buyer_discovering"
  | "buyer_purchasing"
  | "buyer_complete"
  | "seller_received"
  | "seller_planning"
  | "seller_fulfilling"
  | "seller_complete"
  | "complete"
  | "error";

export interface PipelineEvent {
  id: string;
  timestamp: string;
  stage: PipelineStage;
  agent: "strategist" | "researcher" | "buyer" | "seller" | "pipeline";
  message: string;
  data?: Record<string, unknown>;
}

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

  const result = await complete({
    provider,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 256,
    temperature: 0.1,
  });

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
  toolSettings?: ToolSettings
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

    const brief = await runStrategist({
      userInput,
      outputType: outputType as StrategistRequest["outputType"],
      provider,
    });

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
    let document = await runResearch({
      query: brief.objective,
      searchQueries: brief.searchQueries,
      provider,
      depth: "standard",
      toolSettings: toolSettings?.researcher,
    });

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
      const followUpBrief = await runFollowUp(brief, followUp, provider);
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

      const additionalDoc = await runResearch({
        query: followUpQuery,
        provider,
        depth: "quick",
        toolSettings: toolSettings?.researcher,
      });

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
        buyerResult = await runBuyer({
          query: brief.objective,
          maxCredits: 20,
          preferredTypes: ["report", "dataset", "service"],
        });

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

    // ── Complete ────────────────────────────────────────────────────
    const totalCredits = transactions
      .filter((tx) => tx.status === "completed")
      .reduce((sum, tx) => sum + tx.credits, 0);

    emit("complete", "pipeline", `Pipeline complete — ${document.sections.length} sections, ${document.sources.length} sources, ${purchasedAssets.length} purchases, ${totalCredits}cr total`);

    // Log this pipeline run on the Nevermined network (fire-and-forget)
    if (nvmTracking) {
      logNeverminedTask({
        credits: totalCredits,
        description: `Pipeline: "${brief.title.slice(0, 60)}" — ${document.sections.length} sections, ${totalCredits}cr`,
        tag: "pipeline",
      }).then((nvmResult) => {
        if (nvmResult.success) {
          console.log(`[NVM] Task logged: ${nvmResult.agentRequestId}`);
        } else {
          console.warn(`[NVM] Task logging failed: ${nvmResult.error}`);
        }
      }).catch(() => { /* swallow */ });
    }

    return {
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
      totalDurationMs: Date.now() - startTime,
      iterations,
      toolsUsed,
    };
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

  const brief = await runStrategist({ userInput, outputType: outputType as StrategistRequest["outputType"], provider });

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

  // Log on Nevermined network (fire-and-forget) — only if nvmTracking is enabled
  if (toolSettings?.trading?.nvmTracking ?? true) {
    logNeverminedTask({ credits: brief.creditsUsed, description: `Strategist: "${brief.title.slice(0, 60)}"`, tag: "strategist" }).catch(() => {});
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

  const document = await runResearch({ query, provider, depth, toolSettings: toolSettings?.researcher });

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

  // Log on Nevermined network (fire-and-forget) — only if nvmTracking is enabled
  if (toolSettings?.trading?.nvmTracking ?? true) {
    logNeverminedTask({ credits: document.creditsUsed, description: `Research: "${query.slice(0, 60)}"`, tag: "researcher" }).catch(() => {});
  }

  return { document, transaction: txR, events, toolsUsed: document.toolsUsed ?? [] };
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

    const brief = await runStrategist({
      userInput: plan.expandedPrompt,
      outputType: plan.product.outputType,
      provider: order.provider ?? provider,
    });

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

    let document = await runResearch({
      query: brief.objective,
      searchQueries: brief.searchQueries,
      provider: order.provider ?? provider,
      depth: "standard",
      toolSettings: toolSettings?.researcher,
    });

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
    let purchasedAssets: PurchasedAsset[] = [];

    if (plan.shouldBuyExternal && plan.externalServices.length > 0) {
      emit("buyer_discovering", "buyer", `Seller requested ${plan.externalServices.length} external service(s)…`);
      toolsUsed.push({ tool: "nevermined-402", label: "Nevermined Marketplace — Seller External Buy", sponsor: "Nevermined", timestamp: new Date().toISOString() });

      try {
        const targetDids = plan.externalServices
          .map((s) => s.did)
          .filter((d) => d);

        if (targetDids.length > 0) {
          const buyerResult = await runBuyer({
            query: brief.objective,
            maxCredits: 20,
            targetDids,
          });

          purchasedAssets = buyerResult.purchased.filter((p) => p.status === "success");

          if (purchasedAssets.length > 0) {
            emit("buyer_purchasing", "buyer", `Purchased ${purchasedAssets.length} asset(s) for seller order`);
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

            // Merge purchased content into the document
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
                creditsUsed: document.creditsUsed + buyerResult.totalCreditsSpent,
              };
            }
          }

          emit("buyer_complete", "buyer",
            purchasedAssets.length > 0
              ? `${purchasedAssets.length} external asset(s) merged into deliverable`
              : "No external assets purchased — using research data only"
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "External purchase failed";
        emit("buyer_complete", "buyer", `External procurement skipped: ${msg}`);
      }
    }

    // ── Complete ──────────────────────────────────────────────────────
    const totalCredits = transactions
      .filter((tx) => tx.status === "completed")
      .reduce((sum, tx) => sum + tx.credits, 0);

    sellerResult.status = "complete";
    sellerResult.output = { brief, document, purchasedAssets };
    sellerResult.durationMs = Date.now() - startTime;

    emit("seller_complete", "seller",
      `Order fulfilled — "${plan.product.name}" delivered. ${document.sections.length} sections, ${document.sources.length} sources, ${purchasedAssets.length} external assets, ${totalCredits}cr total`
    );

    toolsUsed.push({ tool: "nevermined-settled", label: `Nevermined x402 — Order Fulfilled & Settled`, sponsor: "Nevermined", timestamp: new Date().toISOString(), detail: `${totalCredits}cr total` });

    // Log on Nevermined network (fire-and-forget)
    // External seller orders (no toolSettings) always log; internal UI calls respect nvmTracking
    if (!toolSettings || (toolSettings.trading?.nvmTracking ?? true)) {
      logNeverminedTask({ credits: totalCredits, description: `Seller order: "${order.query.slice(0, 60)}" — ${totalCredits}cr`, tag: "seller" }).catch(() => {});
    }

    return {
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
      totalDurationMs: Date.now() - startTime,
      toolsUsed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seller pipeline failed";
    emit("error", "seller", message);
    throw error;
  }
}
