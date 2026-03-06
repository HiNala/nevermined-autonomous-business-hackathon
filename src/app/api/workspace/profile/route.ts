import { NextResponse } from "next/server";
import { getProfile, saveProfile, clearProfile, type WorkspaceProfile } from "@/lib/workspace/profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") ?? "default";
  const profile = getProfile(workspaceId);
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  let body: Partial<WorkspaceProfile>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const workspaceId = body.workspaceId ?? "default";
  const existing = getProfile(workspaceId);
  const merged: WorkspaceProfile = {
    ...existing,
    ...body,
    workspaceId,
    updatedAt: new Date().toISOString(),
  };
  const saved = saveProfile(merged);
  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") ?? "default";
  clearProfile(workspaceId);
  return NextResponse.json({ ok: true });
}
