import { NextRequest, NextResponse } from "next/server";
import { complete } from "@/lib/ai/providers";
import { checkRateLimit, getClientId } from "@/lib/security";

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  const rateCheck = checkRateLimit(`followup:${clientId}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  let body: { question?: string; context?: string; history?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { question, context, history = [] } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const systemPrompt = `You are a business intelligence assistant helping a user work with a research report they just received.

Your role is to:
- Answer questions about the report content directly and concisely
- Transform the report into different formats when asked (investor summary, roadmap, PRD, one-pager, etc.)
- Extract specific information like requirements, risks, decisions, action items
- Provide analysis and recommendations based on what the report contains

Rules:
- Be concise but complete. Use markdown formatting for structured outputs.
- When asked to transform the report, produce a clean, professional result.
- If asked for something not in the report, say so clearly and offer what you can infer.
- Never make up specific data, names, or numbers not present in the context.
- For lists and structured outputs, use clear headings and bullet points.

${context ? `REPORT CONTEXT:\n${context}` : "No report context available — answer based on general knowledge."}`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: question },
    ];

    const result = await complete({
      messages,
      maxTokens: 1200,
      temperature: 0.4,
    });
    const answer = result.content;

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[followup] error:", err);
    return NextResponse.json(
      { error: "Failed to generate follow-up response" },
      { status: 500 }
    );
  }
}
