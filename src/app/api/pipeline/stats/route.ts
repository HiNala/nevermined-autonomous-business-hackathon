import { NextResponse } from "next/server";
import { ledger } from "@/lib/agent/transactions";
import { listAvailableProviders } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = ledger.stats;
  const providers = listAvailableProviders();

  return NextResponse.json({
    ...stats,
    availableProviders: providers,
    uptime: process.uptime(),
  });
}
