import { NextRequest, NextResponse } from "next/server";
import { complete } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const { title, summary, sections } = await req.json();

    if (!summary && !sections?.length) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const content = [
      title ? `Title: ${title}` : "",
      summary ? `Summary: ${summary}` : "",
      sections?.length
        ? sections
            .slice(0, 8)
            .map((s: { heading: string; content: string }) => `## ${s.heading}\n${s.content.slice(0, 600)}`)
            .join("\n\n")
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const prompt = `You are an expert business analyst. Extract structured intelligence from this research report.

REPORT:
${content.slice(0, 5000)}

Extract the following and return as valid JSON only (no markdown, no explanation):

{
  "takeaways": ["up to 5 most important insights or conclusions from this report"],
  "decisions": ["up to 4 concrete decisions the reader should make based on this report"],
  "opportunities": ["up to 4 specific opportunities worth pursuing that the report surfaces"],
  "risks": ["up to 4 risks or concerns that need validation or mitigation"],
  "followUps": ["up to 4 follow-up research questions or tasks that would improve decision quality"]
}

Rules:
- Each item must be a complete, actionable sentence (not a fragment)
- Be specific to the actual content — no generic platitudes
- Takeaways should state clear conclusions
- Decisions should be framed as "Should we…" or "Decide whether to…"
- Opportunities should be concrete and worth pursuing
- Risks should be specific threats, not vague warnings
- Follow-ups should be researchable questions or specific next tasks
- Return ONLY valid JSON, nothing else`;

    const result = await complete({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 900,
      temperature: 0.3,
    });

    let actions;
    try {
      const cleaned = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      actions = JSON.parse(cleaned);
    } catch {
      actions = {
        takeaways: [],
        decisions: [],
        opportunities: [],
        risks: [],
        followUps: [],
      };
    }

    return NextResponse.json({ actions });
  } catch (err) {
    console.error("[extract-actions] error:", err);
    return NextResponse.json({ error: "Failed to extract actions" }, { status: 500 });
  }
}
