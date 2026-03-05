import "server-only";

import { complete, type AIProvider } from "@/lib/ai/providers";

export interface StrategistRequest {
  userInput: string;
  outputType?: "research" | "prd" | "plan" | "analysis" | "general";
  provider?: AIProvider;
}

export interface StructuredBrief {
  id: string;
  originalInput: string;
  outputType: string;
  title: string;
  objective: string;
  scope: string[];
  searchQueries: string[];
  keyQuestions: string[];
  deliverables: string[];
  constraints: string[];
  context: string;
  provider: string;
  model: string;
  creditsUsed: number;
  createdAt: string;
  durationMs: number;
}

const OUTPUT_TYPE_LABELS: Record<string, string> = {
  research: "Research Report",
  prd: "Product Requirements Document",
  plan: "Strategic Plan",
  analysis: "Market/Competitive Analysis",
  general: "Structured Document",
};

export async function runStrategist(request: StrategistRequest): Promise<StructuredBrief> {
  const startTime = Date.now();
  const id = `brief-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const outputType = request.outputType ?? "general";
  const typeLabel = OUTPUT_TYPE_LABELS[outputType] ?? "Structured Document";

  const systemPrompt = `You are the Strategist Agent for Auto Business. Your role is to take a user's raw, potentially vague input and transform it into a comprehensive, structured brief that a Research Agent can execute on.

You must output strict JSON in this format:
{
  "title": "Clear, professional title for the deliverable",
  "objective": "1-2 sentence statement of what needs to be produced",
  "scope": ["Specific area 1 to cover", "Specific area 2 to cover", ...],
  "searchQueries": ["Optimized search query 1", "Optimized search query 2", ...],
  "keyQuestions": ["Key question the report must answer 1", ...],
  "deliverables": ["Expected section/output 1", "Expected section/output 2", ...],
  "constraints": ["Any constraints, focus areas, or exclusions"],
  "context": "Background context and framing to guide the research agent"
}

Rules:
- The output type is: ${typeLabel}
- Generate 3-6 optimized search queries that would yield the best web results
- Identify 3-5 key questions the final document must answer
- Define clear deliverables/sections expected in the final output
- Add relevant context even if the user didn't provide it — infer from the topic
- Be specific and actionable — the Research Agent will use this as its complete instruction set
- If the request is vague, expand it intelligently with reasonable assumptions
- Search queries should be diverse: mix broad overview queries with specific detail queries`;

  const userPrompt = `User's raw input: "${request.userInput}"

Requested output type: ${typeLabel}

Transform this into a comprehensive structured brief. Be thorough — the Research Agent depends entirely on the quality of your brief.`;

  const aiResult = await complete({
    provider: request.provider,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 2048,
    temperature: 0.4,
  });

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
      title: `${typeLabel}: ${request.userInput.slice(0, 60)}`,
      objective: request.userInput,
      scope: [request.userInput],
      searchQueries: [request.userInput],
      keyQuestions: [`What are the key findings about: ${request.userInput}?`],
      deliverables: ["Overview", "Key Findings", "Recommendations"],
      constraints: [],
      context: request.userInput,
    };
  }

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

  const aiResult = await complete({
    provider,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 2048,
    temperature: 0.3,
  });

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
