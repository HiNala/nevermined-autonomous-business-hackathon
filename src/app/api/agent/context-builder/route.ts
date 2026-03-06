import { NextResponse } from "next/server";
import { buildPaymentRequired } from "@nevermined-io/payments";
import { buildContext } from "@/lib/agent/context-builder";
import { agentEvents } from "@/lib/agent/event-store";
import { getPaymentsClient } from "@/lib/nevermined/server";
import { checkRateLimit, getClientId, sanitizeError, isSameOriginRequest } from "@/lib/security";

const CREDITS = BigInt(2);
const ENDPOINT = "/api/agent/context-builder";

function genId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getAgent1Config() {
  const planId = process.env.NVM_PLAN_ID_AGENT1 ?? process.env.NVM_PLAN_ID ?? null;
  const agentId = process.env.NVM_AGENT_ID_AGENT1 ?? process.env.NVM_AGENT_ID ?? null;
  return { planId, agentId };
}

export async function GET() {
  const { planId, agentId } = getAgent1Config();
  return NextResponse.json({
    agent: "Architect",
    version: "1.0.0",
    description:
      "Expands raw user queries into structured context documents for the Analyst agent to execute on. 2 credits per call.",
    planId,
    agentId,
    endpoint: ENDPOINT,
    credits: Number(CREDITS),
  });
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`context-builder:${clientId}`, 15, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Internal requests: must come from same-origin (browser UI), localhost, or have server secret
  const isInternal = request.headers.get("x-internal-request") === "true" && isSameOriginRequest(request);
  const token = request.headers.get("payment-signature");

  // ── Step 1: No token on external request → 402 ──────────────────────────
  if (!isInternal && !token) {
    const { planId, agentId } = getAgent1Config();
    const paymentRequired =
      planId && agentId
        ? buildPaymentRequired(planId, { endpoint: ENDPOINT, agentId, httpVerb: "POST" })
        : null;
    const encoded = paymentRequired
      ? Buffer.from(JSON.stringify(paymentRequired)).toString("base64")
      : "";

    return NextResponse.json(
      { error: "Payment Required", credits: Number(CREDITS), planId, agentId },
      { status: 402, headers: encoded ? { "payment-required": encoded } : {} }
    );
  }

  const caller = token ? `${token.slice(0, 12)}...` : "internal";

  // ── Step 2: Verify token ────────────────────────────────────────────────
  if (!isInternal && token) {
    const { planId, agentId } = getAgent1Config();
    const payments = getPaymentsClient();

    if (!payments || !planId || !agentId) {
      return NextResponse.json(
        { error: "Payment system not configured — cannot verify token" },
        { status: 503 }
      );
    }

    const paymentRequired = buildPaymentRequired(planId, {
      endpoint: ENDPOINT,
      agentId,
      httpVerb: "POST",
    });

    try {
      const verification = await payments.facilitator.verifyPermissions({
        paymentRequired,
        x402AccessToken: token,
        maxAmount: CREDITS,
      });

      agentEvents.push({
        id: genId(),
        type: "payment_verified",
        timestamp: new Date().toISOString(),
        data: { agent: "architect", caller, credits: Number(CREDITS) },
      });

      if (!verification.isValid) {
        return NextResponse.json(
          { error: "Invalid payment token" },
          { status: 402 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 402 }
      );
    }
  }

  agentEvents.push({
    id: genId(),
    type: "architect_received",
    timestamp: new Date().toISOString(),
    data: { caller, query: query.slice(0, 80) },
  });

  // ── Step 3: Execute ─────────────────────────────────────────────────────
  try {
    const contextDoc = await buildContext({ query });

    // ── Step 4: Settle credits — BLOCK response if settlement fails ────
    if (!isInternal && token) {
      const { planId, agentId } = getAgent1Config();
      const payments = getPaymentsClient();

      if (!payments || !planId || !agentId) {
        return NextResponse.json(
          { error: "Payment system not configured — cannot settle" },
          { status: 503 }
        );
      }

      const paymentRequired = buildPaymentRequired(planId, {
        endpoint: ENDPOINT,
        agentId,
        httpVerb: "POST",
      });
      try {
        await payments.facilitator.settlePermissions({
          paymentRequired,
          x402AccessToken: token,
          maxAmount: CREDITS,
        });
        agentEvents.push({
          id: genId(),
          type: "transaction",
          timestamp: new Date().toISOString(),
          data: { agent: "architect", caller, credits: Number(CREDITS), settled: true, mode: "live" },
        });
      } catch (settleErr) {
        console.error(`[x402/architect] Settlement FAILED for caller ${caller}:`, settleErr);
        agentEvents.push({
          id: genId(),
          type: "settlement_failed",
          timestamp: new Date().toISOString(),
          data: { agent: "architect", caller, credits: Number(CREDITS), error: String(settleErr) },
        });
        return NextResponse.json(
          { error: "Payment settlement failed — credits could not be burned" },
          { status: 402 }
        );
      }
    }

    agentEvents.push({
      id: genId(),
      type: "strategist_complete",
      timestamp: new Date().toISOString(),
      data: {
        caller,
        title: contextDoc.title,
        taskType: contextDoc.taskType,
        keyQuestionsCount: contextDoc.keyQuestions.length,
        durationMs: contextDoc.durationMs,
      },
    });

    return NextResponse.json({ status: "success", contextDoc });
  } catch (error) {
    const msg = sanitizeError(error);
    agentEvents.push({
      id: genId(),
      type: "error",
      timestamp: new Date().toISOString(),
      data: { agent: "architect", caller, error: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
