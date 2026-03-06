import { NextResponse } from "next/server";
import { runStrategist } from "@/lib/agent/strategist";
import type { AIProvider } from "@/lib/ai/providers";
import { validateInput, sanitizeError } from "@/lib/security";

/**
 * Pre-run clarification check endpoint.
 * Runs the Strategist to generate a brief and returns:
 * - isClarificationNeeded (bool)
 * - clarificationQuestions (string[])
 * - routing (BriefRouting)
 * - brief (StructuredBrief) — so UI can preview
 *
 * The client can either show the clarification dialog or proceed directly.
 */
export async function POST(request: Request) {
  const body = await request.json() as { input?: string; outputType?: string; provider?: AIProvider; workspaceId?: string };
  const validation = validateInput(body.input);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const brief = await runStrategist({
      userInput: validation.sanitized!,
      outputType: (body.outputType ?? "general") as "research" | "prd" | "plan" | "analysis" | "general",
      provider: body.provider,
      workspaceId: body.workspaceId ?? "default",
    });

    return NextResponse.json({
      isClarificationNeeded: brief.routing?.isClarificationNeeded ?? false,
      clarificationQuestions: brief.routing?.clarificationQuestions ?? [],
      routing: brief.routing,
      brief,
    });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
