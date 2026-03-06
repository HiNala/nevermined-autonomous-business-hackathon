import { NextResponse } from "next/server";
import { orderOwnPlan, getPlanBalance, logNeverminedTask } from "@/lib/nevermined/server";
import { checkRateLimit, getClientId } from "@/lib/security";

/**
 * POST /api/nvm/order — Order our own plan to register a real sale + log a task.
 * This creates visible metrics on the Nevermined dashboard.
 */
export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`nvm-order:${clientId}`, 5, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  const results: Record<string, unknown> = {};

  const balance = await getPlanBalance();
  results.balance = balance;

  const order = await orderOwnPlan();
  results.order = order;
  if (!order.success) console.error("[NVM/order] Order failed:", order.error);

  const task = await logNeverminedTask({
    credits: 5,
    description: "Agent pipeline execution — ordered via API",
    tag: "pipeline",
  });
  results.task = task;
  if (!task.success) console.error("[NVM/order] Task failed:", task.error);

  const anySuccess = order.success || task.success;

  return NextResponse.json(
    {
      success: anySuccess,
      ...results,
    },
    { status: anySuccess ? 200 : 500 }
  );
}

/**
 * GET /api/nvm/order — Check balance and NVM status.
 */
export async function GET() {
  const balance = await getPlanBalance();
  return NextResponse.json({ balance });
}
