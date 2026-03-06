import { VisionRequest } from "./types";

export interface JudgementResult {
  score: number;
  passed: boolean;
  passedCriteria: string[];
  failedCriteria: string[];
  notes: string;
}

const PASS_THRESHOLD = 72;

export async function judgeImage(
  imageUrl: string,
  request: VisionRequest,
  attempt: number
): Promise<JudgementResult> {
  const assessmentPrompt = buildAssessmentPrompt(request, attempt);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: assessmentPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI vision call failed: ${response.status}`);
    }

    const data = await response.json();
    const rawText: string = data.choices?.[0]?.message?.content ?? "";
    return parseJudgement(rawText, request.requirements);
  } catch (err) {
    console.error("[VISION quality-judge] Error:", err);
    return {
      score: 55,
      passed: false,
      passedCriteria: [],
      failedCriteria: request.requirements,
      notes: `Quality judge failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}

function buildAssessmentPrompt(request: VisionRequest, attempt: number): string {
  const requirementsList =
    request.requirements.length > 0
      ? request.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")
      : "1. Professional and polished quality\n2. Relevant to the described brief\n3. Clean composition";

  return `You are a quality control judge for AI-generated images used in professional tech products.

ORIGINAL BRIEF: "${request.brief}"
OUTPUT CONTEXT: ${request.outputContext}
THIS IS ATTEMPT: ${attempt} of 3

REQUIREMENTS TO CHECK:
${requirementsList}

Assess this image against each requirement. Respond ONLY in this exact JSON format:
{
  "score": <0-100>,
  "passed": <true/false>,
  "passedCriteria": ["<criteria text>", ...],
  "failedCriteria": ["<criteria text: reason why it failed>", ...],
  "notes": "<one sentence summary>"
}

Be strict. Score below ${PASS_THRESHOLD} = not passed.
If ANY hard requirement is failed (especially wrong subject matter), set passed=false regardless of score.`;
}

function parseJudgement(rawText: string, requirements: string[]): JudgementResult {
  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      score: parsed.score ?? 0,
      passed: parsed.passed ?? false,
      passedCriteria: parsed.passedCriteria ?? [],
      failedCriteria: parsed.failedCriteria ?? [],
      notes: parsed.notes ?? "Could not parse judge response",
    };
  } catch {
    return {
      score: 50,
      passed: false,
      passedCriteria: [],
      failedCriteria: requirements,
      notes: "Quality judge response could not be parsed",
    };
  }
}
