import { NextResponse } from "next/server";
import {
  runPipeline,
  runStrategistStandalone,
  runResearcherStandalone,
} from "@/lib/agent/pipeline";
import type { AIProvider } from "@/lib/ai/providers";

interface RequestBody {
  input?: string;
  outputType?: string;
  provider?: AIProvider;
  mode?: "pipeline" | "strategist" | "researcher";
  depth?: "quick" | "standard" | "deep";
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const input = body.input?.trim();

  if (!input) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const mode = body.mode ?? "pipeline";
  const outputType = body.outputType ?? "general";
  const provider = body.provider;

  try {
    if (mode === "strategist") {
      const result = await runStrategistStandalone(input, outputType, provider);
      return NextResponse.json({ mode: "strategist", ...result });
    }

    if (mode === "researcher") {
      const result = await runResearcherStandalone(input, body.depth ?? "standard", provider);
      return NextResponse.json({ mode: "researcher", ...result });
    }

    // Default: full pipeline
    const result = await runPipeline(input, outputType, provider);
    return NextResponse.json({ mode: "pipeline", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
