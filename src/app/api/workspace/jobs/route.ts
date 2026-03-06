import { NextResponse } from "next/server";
import { createJob, getJob, listJobs, updateJob, getRecentJobs } from "@/lib/workspace/jobs";
import { checkRateLimit, getClientId } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const workspaceId = searchParams.get("workspaceId") ?? "default";
  const recent = searchParams.get("recent");

  if (jobId) {
    const job = getJob(jobId);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json(job);
  }

  if (recent) {
    return NextResponse.json({ jobs: getRecentJobs(parseInt(recent, 10) || 10) });
  }

  return NextResponse.json({ jobs: listJobs(workspaceId) });
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`workspace-jobs:${clientId}`, 30, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  let body: { workspaceId?: string; mode: "pipeline" | "strategist" | "researcher" | "seller"; input: string; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.mode || !body.input) {
    return NextResponse.json({ error: "mode and input are required" }, { status: 400 });
  }

  const job = createJob({
    workspaceId: body.workspaceId ?? "default",
    mode: body.mode,
    input: body.input,
    idempotencyKey: body.idempotencyKey,
  });

  return NextResponse.json(job, { status: 201 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  let updates: Record<string, unknown>;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const updated = updateJob(jobId, updates);
  if (!updated) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json(updated);
}
