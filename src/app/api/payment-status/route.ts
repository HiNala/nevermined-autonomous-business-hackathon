import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/nevermined/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPaymentStatus());
}
