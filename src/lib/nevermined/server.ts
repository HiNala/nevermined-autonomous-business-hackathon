import "server-only";

import {
  Payments,
  buildPaymentRequired,
  type EnvironmentName,
  type X402PaymentRequired,
} from "@nevermined-io/payments";
import type { PaymentStatus } from "@/types";

function normalizeEnvValue(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeNeverminedId(value?: string | null): string | null {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;
  return normalized.startsWith("did:nvm:") ? normalized.slice("did:nvm:".length) : normalized;
}

function getEnvironment(): EnvironmentName {
  const env = normalizeEnvValue(process.env.NVM_ENVIRONMENT)?.toLowerCase();
  if (env === "live") return "live";
  if (env === "staging_sandbox") return "staging_sandbox";
  if (env === "staging_live") return "staging_live";
  return "sandbox";
}

export function getPaymentStatus(): PaymentStatus {
  const apiKey = normalizeEnvValue(process.env.NVM_API_KEY);
  const planId = normalizeNeverminedId(process.env.NVM_PLAN_ID);
  const agentId = normalizeNeverminedId(process.env.NVM_AGENT_ID);
  const sellerEndpoint = normalizeEnvValue(process.env.NVM_SELLER_ENDPOINT);
  const ready = Boolean(apiKey && planId && agentId && sellerEndpoint);

  return {
    ready,
    environment: getEnvironment(),
    mode: ready ? "live" : "demo",
    configured: {
      apiKey: Boolean(apiKey),
      planId: Boolean(planId),
      agentId: Boolean(agentId),
      sellerEndpoint: Boolean(sellerEndpoint),
    },
    references: {
      planId,
      agentId,
      sellerEndpoint,
    },
  };
}

export function getSellerConfig() {
  const status = getPaymentStatus();

  if (!status.ready) {
    return null;
  }

  return {
    planId: status.references.planId ?? "",
    agentId: status.references.agentId ?? "",
    sellerEndpoint: status.references.sellerEndpoint ?? "",
  };
}

export function getPaymentsClient(): Payments | null {
  const apiKey = normalizeEnvValue(process.env.NVM_API_KEY);

  if (!apiKey) {
    return null;
  }

  return Payments.getInstance({
    nvmApiKey: apiKey,
    environment: getEnvironment(),
  });
}

/**
 * Build a PaymentRequired spec for a given endpoint.
 * Used by seller endpoints to produce proper 402 responses.
 *
 * The endpoint must match the full URL registered in the Nevermined dashboard,
 * otherwise x402 token verification/settlement will fail with a mismatch error.
 */
export function buildPaymentSpec(endpoint: string, httpVerb: string = "POST"): X402PaymentRequired | null {
  const planId = normalizeNeverminedId(process.env.NVM_PLAN_ID);
  const agentId = normalizeNeverminedId(process.env.NVM_AGENT_ID);

  if (!planId || !agentId) return null;

  // Resolve full URL — the endpoint registered in Nevermined is the full URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NVM_SELLER_ENDPOINT?.replace(/\/api\/agent\/research$/, "") || "";
  const fullEndpoint = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  console.log(`[NVM] buildPaymentSpec: planId=${planId}, agentId=${agentId}, endpoint=${fullEndpoint}`);

  return buildPaymentRequired(planId, {
    endpoint: fullEndpoint,
    agentId,
    httpVerb,
  });
}

/**
 * Verify an x402 access token using the facilitator API.
 * Returns { valid, reason } — does NOT burn credits.
 */
export async function verifyX402Token(
  token: string,
  endpoint: string,
  credits: number = 1,
  httpVerb: string = "POST"
): Promise<{ valid: boolean; reason?: string }> {
  const payments = getPaymentsClient();
  const paymentRequired = buildPaymentSpec(endpoint, httpVerb);

  if (!payments || !paymentRequired) {
    return { valid: false, reason: "Nevermined not configured" };
  }

  try {
    const verification = await payments.facilitator.verifyPermissions({
      paymentRequired,
      x402AccessToken: token,
      maxAmount: BigInt(credits),
    });

    return {
      valid: verification.isValid,
      reason: verification.isValid ? undefined : (verification as { invalidReason?: string }).invalidReason ?? "Verification failed",
    };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : "Verification error" };
  }
}

/**
 * Log an agent task on the Nevermined network using the Payments SDK.
 *
 * Approach:
 *  1. requests.startSimulationRequest — registers the API call on the NVM dashboard.
 *  2. requests.trackAgentSubTask — records credit redemption for the task.
 *  3. requests.finishSimulationRequest — settles and closes the request.
 *
 * Even if steps 2 or 3 fail the start alone creates a visible entry.
 */
export async function logNeverminedTask(opts: {
  credits: number;
  description?: string;
  tag?: string;
}): Promise<{ success: boolean; agentRequestId?: string; error?: string }> {
  const payments = getPaymentsClient();
  if (!payments) {
    return { success: false, error: "NVM_API_KEY not configured" };
  }

  try {
    // Step 1: Start simulation request via SDK
    console.log(`[NVM] Starting simulation request (tag: ${opts.tag}, credits: ${opts.credits})`);
    const simResult = await payments.requests.startSimulationRequest({
      agentName: opts.tag ?? "Auto Business Agent",
      planName: "plan one",
    });

    const agentRequestId = simResult?.agentRequestId;
    if (!agentRequestId) {
      console.warn("[NVM] No agentRequestId returned from startSimulationRequest:", JSON.stringify(simResult));
      return { success: false, error: "No agentRequestId returned" };
    }

    console.log(`[NVM] Simulation started: ${agentRequestId}`);

    // Step 2: Track sub-task with credit info via SDK (best-effort)
    try {
      const trackResult = await payments.requests.trackAgentSubTask({
        agentRequestId,
        creditsToRedeem: opts.credits,
        tag: opts.tag ?? "pipeline",
        description: opts.description ?? "Agent task completed",
        status: "SUCCESS" as never,
      });
      console.log(`[NVM] Sub-task tracked: ${JSON.stringify(trackResult)}`);
    } catch (e) {
      console.warn("[NVM] trackAgentSubTask failed (non-fatal):", e instanceof Error ? e.message : e);
    }

    // Step 3: Finish simulation via SDK (best-effort)
    try {
      const finishResult = await payments.requests.finishSimulationRequest(agentRequestId, 0.2, false);
      console.log(`[NVM] Simulation finished: ${JSON.stringify(finishResult)}`);
    } catch (e) {
      console.warn("[NVM] finishSimulationRequest failed (non-fatal):", e instanceof Error ? e.message : e);
    }

    return { success: true, agentRequestId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Task logging error";
    console.error("[NVM] logNeverminedTask failed:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Order our own plan to register a real "sale" on the Nevermined dashboard.
 * This creates a real blockchain transaction and shows up in metrics.
 */
export async function orderOwnPlan(): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const payments = getPaymentsClient();
  const planId = normalizeNeverminedId(process.env.NVM_PLAN_ID);

  if (!payments || !planId) {
    return { success: false, error: "NVM not configured (need API key + plan ID)" };
  }

  try {
    console.log(`[NVM] Ordering own plan: ${planId}`);
    const result = await payments.plans.orderPlan(planId);
    console.log(`[NVM] Plan ordered: ${JSON.stringify(result)}`);
    return {
      success: true,
      txHash: typeof result === "string" ? result : (result as { txHash?: string })?.txHash,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order failed";
    console.error("[NVM] orderOwnPlan failed:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Get the plan balance to verify credits are available.
 */
export async function getPlanBalance(): Promise<{ balance?: string; isSubscriber?: boolean; error?: string }> {
  const payments = getPaymentsClient();
  const planId = normalizeNeverminedId(process.env.NVM_PLAN_ID);

  if (!payments || !planId) {
    return { error: "NVM not configured" };
  }

  try {
    const result = await payments.plans.getPlanBalance(planId);
    console.log(`[NVM] Plan balance: ${JSON.stringify(result)}`);
    return {
      balance: String(result?.balance ?? "unknown"),
      isSubscriber: result?.isSubscriber ?? false,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Balance check failed" };
  }
}

/**
 * Settle (burn credits) after successful execution.
 */
export async function settleX402Token(
  token: string,
  endpoint: string,
  credits: number = 1,
  httpVerb: string = "POST"
): Promise<{ settled: boolean; creditsRedeemed?: number; error?: string }> {
  const payments = getPaymentsClient();
  const paymentRequired = buildPaymentSpec(endpoint, httpVerb);

  if (!payments || !paymentRequired) {
    return { settled: false, error: "Nevermined not configured" };
  }

  try {
    const settlement = await payments.facilitator.settlePermissions({
      paymentRequired,
      x402AccessToken: token,
      maxAmount: BigInt(credits),
    });

    return {
      settled: true,
      creditsRedeemed: Number((settlement as { creditsRedeemed?: bigint }).creditsRedeemed ?? credits),
    };
  } catch (err) {
    return { settled: false, error: err instanceof Error ? err.message : "Settlement error" };
  }
}
