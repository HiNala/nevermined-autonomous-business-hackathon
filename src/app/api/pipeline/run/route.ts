import { NextResponse } from "next/server";
import {
  runPipeline,
  runStrategistStandalone,
  runResearcherStandalone,
  fulfillSellerOrder,
} from "@/lib/agent/pipeline";
import type { AIProvider } from "@/lib/ai/providers";
import type { ToolSettings } from "@/lib/tool-settings";
import { validateInput, sanitizeError, checkRateLimit, getClientId } from "@/lib/security";

interface RequestBody {
  input?: string;
  outputType?: string;
  provider?: AIProvider;
  mode?: "pipeline" | "strategist" | "researcher" | "seller";
  depth?: "quick" | "standard" | "deep";
  toolSettings?: ToolSettings;
}

export async function POST(request: Request) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`pipeline:${clientId}`, 15, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  const body = (await request.json()) as RequestBody;
  const validation = validateInput(body.input);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const input = validation.sanitized!;

  const mode = body.mode ?? "pipeline";
  const outputType = body.outputType ?? "general";
  const provider = body.provider;
  const toolSettings = body.toolSettings;

  try {
    if (mode === "strategist") {
      const result = await runStrategistStandalone(input, outputType, provider, undefined, toolSettings);
      return NextResponse.json({
        mode: "strategist",
        ...result,
        totalCredits: result.transaction.credits,
        totalDurationMs: result.brief.durationMs,
        iterations: 1,
        transactions: [result.transaction],
        toolsUsed: result.toolsUsed,
      });
    }

    if (mode === "researcher") {
      const result = await runResearcherStandalone(
        input,
        body.depth ?? "standard",
        provider,
        undefined,
        toolSettings
      );
      return NextResponse.json({
        mode: "researcher",
        ...result,
        totalCredits: result.transaction.credits,
        totalDurationMs: result.document.durationMs,
        iterations: 1,
        transactions: [result.transaction],
        toolsUsed: result.toolsUsed,
      });
    }

    if (mode === "seller") {
      const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const result = await fulfillSellerOrder(
        { id: orderId, query: input, maxCredits: 50 },
        provider,
        undefined,
        toolSettings
      );
      return NextResponse.json({
        mode: "seller",
        ...result,
        totalCredits: result.totalCredits,
        totalDurationMs: result.totalDurationMs,
      });
    }

    // Default: full pipeline
    const result = await runPipeline(input, outputType, provider, undefined, 2, toolSettings);
    return NextResponse.json({ mode: "pipeline", ...result });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
