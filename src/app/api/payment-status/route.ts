import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/nevermined/server";

export async function GET() {
  return NextResponse.json(getPaymentStatus());
}
