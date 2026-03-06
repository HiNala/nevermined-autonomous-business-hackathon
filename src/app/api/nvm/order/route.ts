import { NextResponse } from "next/server";
import { orderOwnPlan, getPlanBalance, logNeverminedTask } from "@/lib/nevermined/server";

/**
 * POST /api/nvm/order — Order our own plan to register a real sale + log a task.
 * This creates visible metrics on the Nevermined dashboard.
 */
export async function POST() {
  const results: Record<string, unknown> = {};

  // 1. Check balance first
  const balance = await getPlanBalance();
  results.balance = balance;
  console.log("[NVM/order] Balance:", JSON.stringify(balance));

  // 2. Order our own plan (creates a real "sale" on the dashboard)
  const order = await orderOwnPlan();
  results.order = order;
  console.log("[NVM/order] Order result:", JSON.stringify(order));

  // 3. Log an agent task via simulation (creates an "API call" on the dashboard)
  const task = await logNeverminedTask({
    credits: 5,
    description: "Agent pipeline execution — ordered via API",
    tag: "pipeline",
  });
  results.task = task;
  console.log("[NVM/order] Task result:", JSON.stringify(task));

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
