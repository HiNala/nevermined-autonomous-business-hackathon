import { NextResponse } from "next/server";
import { agentEvents } from "@/lib/agent/event-store";

export async function GET() {
  const events = agentEvents.getRecent(100);

  const completed = events.filter((e) => e.type === "research_complete");
  const totalCredits = completed.reduce((sum, e) => sum + (e.data.credits ?? 0), 0);
  const uniqueCallers = new Set(completed.map((e) => e.data.caller).filter(Boolean));
  const avgDuration =
    completed.length > 0
      ? Math.round(completed.reduce((sum, e) => sum + (e.data.durationMs ?? 0), 0) / completed.length)
      : 0;

  return NextResponse.json({
    totalRequests: completed.length,
    totalCreditsEarned: totalCredits,
    uniqueCallers: uniqueCallers.size,
    averageDurationMs: avgDuration,
    errors: events.filter((e) => e.type === "error").length,
    uptime: process.uptime(),
  });
}
