import "server-only";

import { complete, type AIProvider } from "@/lib/ai/providers";
import { withTimeout } from "@/lib/utils";

export interface ContextDocument {
  id: string;
  rawQuery: string;
  taskType: "research" | "prd" | "analysis" | "report" | "design" | "other";
  title: string;
  objective: string;
  scope: string;
  keyQuestions: string[];
  researchAngles: string[];
  successCriteria: string[];
  enrichedQuery: string;
  provider: string;
  model: string;
  createdAt: string;
  durationMs: number;
}

export interface ContextBuildRequest {
  query: string;
  provider?: AIProvider;
}

export async function buildContext(request: ContextBuildRequest): Promise<ContextDocument> {
  const startTime = Date.now();
  const id = `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const systemPrompt = `You are the Architect agent. Your job is to take a user's raw input and expand it into a comprehensive, structured context document that a Research Analyst agent can use to produce an excellent deliverable.

Output strict JSON with exactly this structure:
{
  "taskType": "research" | "prd" | "analysis" | "report" | "design" | "other",
  "title": "Clear concise title for this work",
  "objective": "Single clear statement of what needs to be accomplished",
  "scope": "What is included and what is explicitly out of scope",
  "keyQuestions": ["5-8 specific questions that must be answered"],
  "researchAngles": ["4-6 distinct perspectives or angles to investigate"],
  "successCriteria": ["3-5 measurable criteria for excellent output"],
  "enrichedQuery": "A rich 2-3 sentence search query optimized for web research, incorporating all key aspects and context"
}

Be specific, actionable, and thorough. Transform vague input into precise direction. Output ONLY the JSON object.`;

  const userPrompt = `User's raw input: "${request.query}"

Expand this into a structured context document for the Research Analyst agent.`;

  const aiResult = await withTimeout(
    complete({
      provider: request.provider,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 2048,
      temperature: 0.3,
    }),
    30_000,
    "ContextBuilder LLM"
  );

  let parsed: Partial<Omit<ContextDocument, "id" | "rawQuery" | "provider" | "model" | "createdAt" | "durationMs">>;
  try {
    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? aiResult.content);
  } catch {
    parsed = {
      taskType: "research",
      title: `Context: ${request.query.slice(0, 60)}`,
      objective: request.query,
      scope: "As defined by the user query",
      keyQuestions: ["What are the key aspects of this topic?", "What is the current state?", "What are the implications?"],
      researchAngles: ["General overview", "Current state of the art", "Practical applications", "Future trends"],
      successCriteria: ["Comprehensive coverage of key questions", "Accurate and cited information", "Clear actionable structure"],
      enrichedQuery: request.query,
    };
  }

  return {
    id,
    rawQuery: request.query,
    taskType: (parsed.taskType as ContextDocument["taskType"]) ?? "research",
    title: parsed.title ?? `Context: ${request.query.slice(0, 60)}`,
    objective: parsed.objective ?? request.query,
    scope: parsed.scope ?? "",
    keyQuestions: Array.isArray(parsed.keyQuestions) ? parsed.keyQuestions : [],
    researchAngles: Array.isArray(parsed.researchAngles) ? parsed.researchAngles : [],
    successCriteria: Array.isArray(parsed.successCriteria) ? parsed.successCriteria : [],
    enrichedQuery: parsed.enrichedQuery ?? request.query,
    provider: aiResult.provider,
    model: aiResult.model,
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  };
}
