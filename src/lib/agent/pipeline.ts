import "server-only";

import { runStrategist, runFollowUp, type StrategistRequest, type StructuredBrief } from "./strategist";
import { runResearch, type ResearchDocument } from "./researcher";
import { ledger, AGENT_PROFILES, type AgentTransaction } from "./transactions";
import { agentEvents } from "./event-store";
import { complete, type AIProvider } from "@/lib/ai/providers";

export type PipelineStage =
  | "idle"
  | "strategist_working"
  | "strategist_complete"
  | "researcher_buying"
  | "researcher_working"
  | "researcher_evaluating"
  | "researcher_followup"
  | "complete"
  | "error";

export interface PipelineEvent {
  id: string;
  timestamp: string;
  stage: PipelineStage;
  agent: "strategist" | "researcher" | "pipeline";
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
  transactions: AgentTransaction[];
  events: PipelineEvent[];
  totalCredits: number;
  totalDurationMs: number;
  iterations: number;
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
  maxIterations: number = 2
): Promise<PipelineResult> {
  const pipelineId = `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startTime = Date.now();
  const events: PipelineEvent[] = [];
  const transactions: AgentTransaction[] = [];
  const followUpBriefs: StructuredBrief[] = [];

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
      credits: brief.creditsUsed,
      purpose: `Structure brief: "${userInput.slice(0, 50)}…"`,
      artifactId: brief.id,
      status: "completed",
      durationMs: brief.durationMs,
    };
    transactions.push(tx1);
    ledger.record(tx1);

    emit("strategist_complete", "strategist", `Brief produced: "${brief.title}"`, {
      briefId: brief.id,
      searchQueries: brief.searchQueries.length,
      keyQuestions: brief.keyQuestions.length,
    });

    // ── Stage 2: Researcher buys brief and starts research ─────────
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
    transactions.push(tx2);
    ledger.record(tx2);

    emit("researcher_working", "researcher", `Searching web with ${brief.searchQueries.length} queries…`);

    // Build a comprehensive research query from the brief
    const researchQuery = [
      brief.objective,
      ...brief.keyQuestions.slice(0, 3),
    ].join(" | ");

    let document = await runResearch({
      query: researchQuery,
      provider,
      depth: "standard",
    });

    // Record transaction: pipeline → researcher
    const tx3: AgentTransaction = {
      id: makeTxId(),
      timestamp: new Date().toISOString(),
      from: { id: "pipeline", name: "Pipeline" },
      to: { id: researcher.id, name: researcher.name },
      credits: document.creditsUsed,
      purpose: `Research: "${brief.title}"`,
      artifactId: document.id,
      status: "completed",
      durationMs: document.durationMs,
    };
    transactions.push(tx3);
    ledger.record(tx3);

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
      transactions.push(tx4);
      ledger.record(tx4);

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
        credits: additionalDoc.creditsUsed,
        purpose: `Follow-up research: "${followUp.slice(0, 50)}…"`,
        artifactId: additionalDoc.id,
        status: "completed",
        durationMs: additionalDoc.durationMs,
      };
      transactions.push(tx5);
      ledger.record(tx5);

      iterations++;
    }

    // ── Complete ────────────────────────────────────────────────────
    const totalCredits = transactions
      .filter((tx) => tx.status === "completed")
      .reduce((sum, tx) => sum + tx.credits, 0);

    emit("complete", "pipeline", `Pipeline complete — ${document.sections.length} sections, ${document.sources.length} sources, ${totalCredits}cr total`);

    return {
      id: pipelineId,
      userInput,
      outputType,
      brief,
      followUpBriefs,
      document,
      transactions,
      events,
      totalCredits,
      totalDurationMs: Date.now() - startTime,
      iterations,
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
  onEvent?: EventCallback
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

  return { brief, transaction: txS, events };
}

/**
 * Run just Agent 2 (Researcher) standalone.
 */
export async function runResearcherStandalone(
  query: string,
  depth: "quick" | "standard" | "deep" = "standard",
  provider?: AIProvider,
  onEvent?: EventCallback
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

  const document = await runResearch({ query, provider, depth });

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

  return { document, transaction: txR, events };
}
