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

function getEnvironment(): EnvironmentName {
  const env = normalizeEnvValue(process.env.NVM_ENVIRONMENT)?.toLowerCase();
  if (env === "live") return "live";
  if (env === "staging_sandbox") return "staging_sandbox";
  if (env === "staging_live") return "staging_live";
  return "sandbox";
}

export function getPaymentStatus(): PaymentStatus {
  const apiKey = normalizeEnvValue(process.env.NVM_API_KEY);
  const planId = normalizeEnvValue(process.env.NVM_PLAN_ID);
  const agentId = normalizeEnvValue(process.env.NVM_AGENT_ID);
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
    planId: status.references.planId!,
    agentId: status.references.agentId!,
    sellerEndpoint: status.references.sellerEndpoint!,
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
 */
export function buildPaymentSpec(endpoint: string, httpVerb: string = "POST"): X402PaymentRequired | null {
  const planId = normalizeEnvValue(process.env.NVM_PLAN_ID);
  const agentId = normalizeEnvValue(process.env.NVM_AGENT_ID);

  if (!planId || !agentId) return null;

  return buildPaymentRequired(planId, {
    endpoint,
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
 * Resolve the Nevermined backend base URL for the current environment.
 */
function getNvmBackendUrl(): string {
  const env = getEnvironment();
  const urls: Record<string, string> = {
    sandbox: "https://api.sandbox.nevermined.app",
    live: "https://api.live.nevermined.app",
    staging_sandbox: "https://api.sandbox.nevermined.dev",
    staging_live: "https://api.live.nevermined.dev",
  };
  return urls[env] ?? urls.sandbox;
}

/**
 * Log an agent task on the Nevermined network.
 *
 * Approach:
 *  1. startSimulationRequest — registers the API call on the NVM dashboard.
 *  2. trackAgentSubTask — records credit redemption for the task.
 *  3. finishSimulationRequest — attempts to close/settle (best-effort).
 *
 * Even if steps 2 or 3 fail the start alone creates a visible entry.
 */
export async function logNeverminedTask(opts: {
  credits: number;
  description?: string;
  tag?: string;
}): Promise<{ success: boolean; agentRequestId?: string; error?: string }> {
  const apiKey = normalizeEnvValue(process.env.NVM_API_KEY);
  if (!apiKey) {
    return { success: false, error: "NVM_API_KEY not configured" };
  }

  const backend = getNvmBackendUrl();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    // Step 1: Start simulation request
    const startRes = await fetch(`${backend}/api/v1/protocol/agents/simulate/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        agentName: opts.tag ?? "Auto Business Agent",
        planName: "plan one",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!startRes.ok) {
      const errBody = await startRes.text().catch(() => "");
      console.warn(`[NVM] Start simulation failed (${startRes.status}): ${errBody.slice(0, 200)}`);
      return { success: false, error: `Start failed (${startRes.status})` };
    }

    const simRequest = await startRes.json();
    const agentRequestId = simRequest?.agentRequestId;

    if (!agentRequestId) {
      return { success: false, error: "No agentRequestId returned" };
    }

    console.log(`[NVM] Simulation started: ${agentRequestId}`);

    // Step 2: Track sub-task with credit info (best-effort)
    try {
      await fetch(`${backend}/api/v1/protocol/agent-sub-tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          agentRequestId,
          creditsToRedeem: opts.credits,
          tag: opts.tag ?? "pipeline",
          description: opts.description ?? "Agent task completed",
          status: "SUCCESS",
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      // non-fatal — the start already registered the call
    }

    // Step 3: Finish simulation (best-effort)
    try {
      await fetch(`${backend}/api/v1/protocol/agents/simulate/finish`, {
        method: "POST",
        headers,
        body: JSON.stringify({ agentRequestId, marginPercent: 0.2, batch: false }),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      // non-fatal
    }

    return { success: true, agentRequestId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Task logging error";
    console.error("[NVM] logNeverminedTask failed:", msg);
    return { success: false, error: msg };
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
