import "server-only";

import { complete, type AIProvider } from "@/lib/ai/providers";
import { getProfile, buildProfileContext } from "@/lib/workspace/profile";
import { withTimeout } from "@/lib/utils";
import type { BriefScore, BriefRouting, StructuredBrief } from "@/types/pipeline";
export type { BriefScore, BriefRouting, StructuredBrief };

const LLM_TIMEOUT_MS = 30_000;

export interface StrategistRequest {
  userInput: string;
  outputType?: "research" | "prd" | "plan" | "analysis" | "general";
  provider?: AIProvider;
  workspaceId?: string;
  /** Skip workspace context injection (e.g. seller-mode requests) */
  skipWorkspaceContext?: boolean;
}


const OUTPUT_TYPE_LABELS: Record<string, string> = {
  research: "Research Report",
  prd: "Product Requirements Document",
  plan: "Strategic Plan",
  analysis: "Market/Competitive Analysis",
  general: "Structured Document",
};

// ── Brief scoring ────────────────────────────────────────────────────
function scoreBrief(brief: Omit<StructuredBrief, "id" | "score" | "routing" | "workspaceApplied" | "provider" | "model" | "creditsUsed" | "createdAt" | "durationMs">): BriefScore {
  const weaknesses: string[] = [];
  let clarity = 8;
  let specificity = 8;
  let answerability = 8;
  let sourceability = 8;
  let deliverableCompleteness = 8;

  if (!brief.title || brief.title.length < 10) { clarity -= 3; weaknesses.push("Title is too short or generic"); }
  if (!brief.objective || brief.objective.length < 20) { clarity -= 2; weaknesses.push("Objective lacks detail"); }
  if (brief.scope.length < 2) { specificity -= 3; weaknesses.push("Scope is too narrow"); }
  if (brief.searchQueries.length < 3) { sourceability -= 3; weaknesses.push("Too few search queries"); }
  if (brief.keyQuestions.length < 2) { answerability -= 2; weaknesses.push("Key questions are insufficient"); }
  if (brief.deliverables.length < 2) { deliverableCompleteness -= 3; weaknesses.push("Deliverables not well-defined"); }
  if (!brief.context || brief.context.length < 30) { specificity -= 2; weaknesses.push("Context is thin"); }

  const total = clarity + specificity + answerability + sourceability + deliverableCompleteness;
  const grade = total >= 42 ? "A" : total >= 35 ? "B" : total >= 25 ? "C" : "D";

  return { clarity, specificity, answerability, sourceability, deliverableCompleteness, total, grade, weaknesses };
}

// ── Routing inference ────────────────────────────────────────────────
function inferRouting(
  input: string,
  outputType: string,
  brief: { searchQueries: string[]; scope: string[] }
): BriefRouting {
  const lower = input.toLowerCase();
  const isComplex = input.length > 80 || brief.scope.length >= 4;
  const needsData = /market|competitor|analysis|research|trend|benchmark|comparison/i.test(lower);
  const isQuick = /quick|brief|summary|tldr|fast/i.test(lower);

  const candidateTemplates: string[] = [];
  if (/market|industry|tam|sam|som/.test(lower)) candidateTemplates.push("market_scan");
  if (/competitor|competitive|versus|vs\./.test(lower)) candidateTemplates.push("competitive_brief");
  if (/prd|product requirement|user stor/.test(lower)) candidateTemplates.push("prd");
  if (/gtm|go.to.market|launch/.test(lower)) candidateTemplates.push("gtm_plan");
  if (/technical|architecture|stack|engineering/.test(lower)) candidateTemplates.push("technical_evaluation");

  const isClarificationNeeded = input.length < 15 || /^(research|analyze|write|tell me about)\s+\w{1,10}$/i.test(input.trim());
  const clarificationQuestions: string[] = [];
  if (isClarificationNeeded) {
    clarificationQuestions.push("Do you want a fast brief or a board-ready report?");
    if (needsData) clarificationQuestions.push("Should this focus on a specific geography or market segment?");
    else clarificationQuestions.push("What is the primary audience for this document?");
  }

  return {
    recommendedMode: isComplex ? "pipeline" : needsData ? "researcher" : "strategist",
    recommendedDepth: isQuick ? "quick" : isComplex ? "deep" : "standard",
    enrichmentLikelihood: needsData && !isQuick ? "high" : needsData ? "medium" : "low",
    candidateTemplates,
    isClarificationNeeded,
    clarificationQuestions,
  };
}

function buildBriefPrompt(typeLabel: string, profileContext: string): string {
  return `You are the Strategist Agent for Auto Business — a world-class request intelligence engine.

Your role: take raw, potentially vague user input and transform it into a precise, actionable brief that the Research Agent can execute on perfectly.

Output strict JSON:
{
  "title": "Clear, professional title for the deliverable",
  "objective": "1-2 sentence statement of what needs to be produced",
  "scope": ["Specific area 1 to cover", "Specific area 2", ...],
  "searchQueries": ["Optimized search query 1", "Optimized search query 2", ...],
  "keyQuestions": ["Key question the report must answer 1", ...],
  "deliverables": ["Expected section/output 1", "Expected section/output 2", ...],
  "constraints": ["Any constraints, focus areas, or exclusions"],
  "context": "Background context and framing to guide the research agent"
}

Rules:
- Output type: ${typeLabel}
- Generate 4-6 optimized, diverse search queries (mix broad + specific)
- Identify 3-5 key questions the final document MUST answer
- Define 4-6 clear deliverable sections
- Add substantial context even when the user didn't provide it — infer intelligently
- Be highly specific and actionable — the Research Agent depends entirely on your brief quality${profileContext}`;
}

export async function runStrategist(request: StrategistRequest): Promise<StructuredBrief> {
  const startTime = Date.now();
  const id = `brief-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const outputType = request.outputType ?? "general";
  const typeLabel = OUTPUT_TYPE_LABELS[outputType] ?? "Structured Document";

  // Build workspace context string
  let profileContext = "";
  let workspaceApplied = false;
  if (!request.skipWorkspaceContext) {
    const profile = getProfile(request.workspaceId ?? "default");
    profileContext = buildProfileContext(profile);
    workspaceApplied = profileContext.length > 0;
  }

  const systemPrompt = buildBriefPrompt(typeLabel, profileContext);
  const userPrompt = `User's raw input: "${request.userInput}"

Requested output type: ${typeLabel}

Transform this into a comprehensive structured brief. Be thorough — higher quality briefs produce better reports.`;

  async function generateBrief(temp = 0.4) {
    const aiResult = await withTimeout(
      complete({
        provider: request.provider,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        maxTokens: 2048,
        temperature: temp,
      }),
      LLM_TIMEOUT_MS,
      "Strategist LLM"
    );

    let parsed: {
      title: string; objective: string; scope: string[]; searchQueries: string[];
      keyQuestions: string[]; deliverables: string[]; constraints: string[]; context: string;
    };

    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? aiResult.content);
    } catch {
      parsed = {
        title: `${typeLabel}: ${request.userInput.slice(0, 60)}`,
        objective: request.userInput,
        scope: [request.userInput],
        searchQueries: [request.userInput, `${request.userInput} overview`, `${request.userInput} analysis`],
        keyQuestions: [`What are the key findings about: ${request.userInput}?`],
        deliverables: ["Overview", "Key Findings", "Analysis", "Recommendations"],
        constraints: [],
        context: request.userInput,
      };
    }

    return { parsed, aiResult };
  }

  let { parsed, aiResult } = await generateBrief(0.4);

  // Score the brief and regenerate once if below threshold
  const scoreInput = {
    originalInput: request.userInput, outputType, title: parsed.title, objective: parsed.objective,
    scope: parsed.scope ?? [], searchQueries: parsed.searchQueries ?? [],
    keyQuestions: parsed.keyQuestions ?? [], deliverables: parsed.deliverables ?? [],
    constraints: parsed.constraints ?? [], context: parsed.context ?? "",
  };
  let score = scoreBrief(scoreInput);

  if (score.grade === "C" || score.grade === "D") {
    // Regenerate with higher temperature for more diverse output
    const retry = await generateBrief(0.6);
    const retryScore = scoreBrief({ ...scoreInput, ...retry.parsed });
    if (retryScore.total > score.total) {
      parsed = retry.parsed;
      aiResult = retry.aiResult;
      score = retryScore;
    }
  }

  const routing = inferRouting(request.userInput, outputType, {
    searchQueries: parsed.searchQueries ?? [],
    scope: parsed.scope ?? [],
  });

  return {
    id,
    originalInput: request.userInput,
    outputType,
    title: parsed.title,
    objective: parsed.objective,
    scope: parsed.scope ?? [],
    searchQueries: parsed.searchQueries ?? [],
    keyQuestions: parsed.keyQuestions ?? [],
    deliverables: parsed.deliverables ?? [],
    constraints: parsed.constraints ?? [],
    context: parsed.context ?? "",
    provider: aiResult.provider,
    model: aiResult.model,
    creditsUsed: 2,
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    score,
    routing,
    workspaceApplied,
  };
}

/**
 * Agent 2 can ask Agent 1 for more context on a specific aspect.
 * This is the "buy more context" back-loop.
 */
export async function runFollowUp(
  originalBrief: StructuredBrief,
  followUpQuestion: string,
  provider?: AIProvider
): Promise<StructuredBrief> {
  const startTime = Date.now();
  const id = `brief-followup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const systemPrompt = `You are the Strategist Agent for Auto Business. A Research Agent has requested additional context on a topic it's investigating. 

You previously produced this brief:
Title: ${originalBrief.title}
Objective: ${originalBrief.objective}
Context: ${originalBrief.context}

The Research Agent is asking for more detail on a specific aspect. Produce an UPDATED brief with additional search queries, expanded scope, and deeper context focused on the follow-up question.

Output strict JSON in the same format:
{
  "title": "Updated title",
  "objective": "Updated objective incorporating the follow-up",
  "scope": ["Updated scope items"],
  "searchQueries": ["New, more targeted search queries for the follow-up"],
  "keyQuestions": ["Updated key questions"],
  "deliverables": ["Updated deliverables"],
  "constraints": ["Any constraints"],
  "context": "Expanded context addressing the follow-up question"
}`;

  const userPrompt = `Follow-up request from Research Agent: "${followUpQuestion}"

Expand the brief to address this. Add new search queries specifically targeting this aspect.`;

  const aiResult = await withTimeout(
    complete({
      provider,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 2048,
      temperature: 0.3,
    }),
    LLM_TIMEOUT_MS,
    "FollowUp LLM"
  );

  let parsed: {
    title: string;
    objective: string;
    scope: string[];
    searchQueries: string[];
    keyQuestions: string[];
    deliverables: string[];
    constraints: string[];
    context: string;
  };

  try {
    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? aiResult.content);
  } catch {
    parsed = {
      title: originalBrief.title + " (expanded)",
      objective: originalBrief.objective,
      scope: [...originalBrief.scope, followUpQuestion],
      searchQueries: [followUpQuestion, ...originalBrief.searchQueries],
      keyQuestions: [followUpQuestion, ...originalBrief.keyQuestions],
      deliverables: originalBrief.deliverables,
      constraints: originalBrief.constraints,
      context: originalBrief.context + "\n\nFollow-up: " + followUpQuestion,
    };
  }

  return {
    id,
    originalInput: followUpQuestion,
    outputType: originalBrief.outputType,
    title: parsed.title,
    objective: parsed.objective,
    scope: parsed.scope ?? [],
    searchQueries: parsed.searchQueries ?? [],
    keyQuestions: parsed.keyQuestions ?? [],
    deliverables: parsed.deliverables ?? [],
    constraints: parsed.constraints ?? [],
    context: parsed.context ?? "",
    provider: aiResult.provider,
    model: aiResult.model,
    creditsUsed: 1,
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  };
}
