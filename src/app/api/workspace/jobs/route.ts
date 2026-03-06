import { NextResponse } from "next/server";
import { createJob, getJob, listJobs, updateJob, getRecentJobs } from "@/lib/workspace/jobs";

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
  const body = (await request.json()) as {
    workspaceId?: string;
    mode: "pipeline" | "strategist" | "researcher" | "seller";
    input: string;
    idempotencyKey?: string;
  };

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

  const updates = (await request.json()) as Record<string, unknown>;
  const updated = updateJob(jobId, updates);
  if (!updated) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json(updated);
}
