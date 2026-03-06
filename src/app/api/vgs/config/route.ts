import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const vaultId = process.env.NEXT_PUBLIC_VGS_VAULT_ID || "";
  const environment = process.env.VGS_ENVIRONMENT || "sandbox";
  const configured = !!(vaultId && process.env.STRIPE_SECRET_KEY);

  return NextResponse.json({
    vaultId,
    environment,
    configured,
  });
}
