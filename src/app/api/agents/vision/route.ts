import { NextRequest, NextResponse } from "next/server";
import { runVisionAgent } from "@/lib/agents/vision";
import { isNanobananaConfigured } from "@/lib/agents/vision/nanobanana";
import type { VisionRequest } from "@/lib/agents/vision/types";

export async function POST(req: NextRequest) {
  try {
    if (!isNanobananaConfigured()) {
      return NextResponse.json(
        {
          error: "NANOBANANA_API_KEY is not configured",
          demo: true,
          imageUrl:
            "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80",
          attempts: 0,
          passedQuality: false,
          qualityReport: {
            score: 0,
            passed: [],
            failed: ["NanoBanana not configured — returning demo placeholder"],
            notes: "Demo mode: set NANOBANANA_API_KEY to enable real image generation",
          },
          finalPrompt: "",
          attemptHistory: [],
        },
        { status: 200 }
      );
    }

    const body: VisionRequest = await req.json();

    if (!body.brief || !body.calledBy) {
      return NextResponse.json(
        { error: "brief and calledBy are required" },
        { status: 400 }
      );
    }

    if (!["interpreter", "composer"].includes(body.calledBy)) {
      return NextResponse.json(
        { error: "calledBy must be 'interpreter' or 'composer'" },
        { status: 403 }
      );
    }

    const result = await runVisionAgent(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    agent: "VISION",
    version: "1.0.0",
    configured: isNanobananaConfigured(),
    description:
      "Image generation agent — NanoBanana (Gemini image models) with iterative quality loop",
    maxAttempts: 3,
    supportedContexts: [
      "research_report",
      "marketplace_listing",
      "agent_card",
      "hero_banner",
      "data_visualization",
      "agent_transaction",
    ],
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2"],
    endpoint: "POST /api/agents/vision",
  });
}
