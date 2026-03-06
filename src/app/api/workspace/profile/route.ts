import { NextResponse } from "next/server";
import { getProfile, saveProfile, clearProfile, type WorkspaceProfile } from "@/lib/workspace/profile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") ?? "default";
  const profile = getProfile(workspaceId);
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<WorkspaceProfile>;
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
