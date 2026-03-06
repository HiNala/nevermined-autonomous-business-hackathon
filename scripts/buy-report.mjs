#!/usr/bin/env node
/**
 * Simulate buying a report via the VGS checkout + running the agent pipeline.
 * Uses Stripe test card 4242 4242 4242 4242.
 */

const BASE = "https://auto-business-two.vercel.app";

async function step(name, url, opts = {}) {
  console.log(`\n▸ ${name}`);
  console.log(`  ${opts.method || "GET"} ${url}`);
  const start = Date.now();
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  const data = await res.json().catch(() => ({}));
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  ← ${res.status} (${elapsed}s)`);
  return { res, data, elapsed };
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log(" Buy Report — Auto-Business Agent Pipeline");
  console.log(" Card: 4242 4242 4242 4242 | 12/30 | 123");
  console.log("═══════════════════════════════════════════════════");

  // 1. Buy 50 credits via VGS checkout (demo mode — will simulate)
  const { data: payment } = await step(
    "Step 1: Purchase 50 credits ($4.50)",
    `${BASE}/api/vgs/process-payment`,
    {
      method: "POST",
      body: JSON.stringify({
        creditPack: { credits: 50, priceUsd: 4.50, label: "50 credits" },
        cardAlias: {
          cardNumber: "4242424242424242",
          expDate: "12/30",
          cvc: "123",
        },
        email: "agent-tester@auto-business.ai",
      }),
    }
  );

  if (payment.success) {
    console.log(`  ✓ ${payment.credits} credits purchased`);
    console.log(`  Payment ID: ${payment.paymentId || payment.paymentIntentId}`);
    console.log(`  Demo: ${payment.demo ?? "n/a"}`);
  } else {
    console.log(`  ✗ Payment failed: ${payment.error || "unknown"}`);
  }

  // 2. Use those credits — run a full pipeline to generate a research report
  console.log("\n───────────────────────────────────────────────────");
  const { data: report } = await step(
    "Step 2: Run Pipeline — Generate Research Report",
    `${BASE}/api/pipeline/run`,
    {
      method: "POST",
      body: JSON.stringify({
        input: "Analyze the emerging x402 payment protocol for AI agent-to-agent commerce: how Nevermined enables autonomous agents to buy and sell data, services, and compute using decentralized credit rails",
        mode: "pipeline",
        outputType: "research",
      }),
    }
  );

  if (report.document) {
    console.log(`  ✓ Report generated`);
    console.log(`  Title: ${report.document.title}`);
    console.log(`  Sections: ${report.document.sections?.length || 0}`);
    console.log(`  Sources: ${report.document.sources?.length || 0}`);
    console.log(`  Credits used: ${report.totalCredits}`);
    console.log(`  Duration: ${(report.totalDurationMs / 1000).toFixed(1)}s`);
    console.log(`  Transactions: ${report.transactions?.length || 0}`);
    if (report.toolsUsed?.length) {
      console.log(`  Tools: ${report.toolsUsed.map(t => t.tool).join(", ")}`);
    }
  } else if (report.brief) {
    console.log(`  ✓ Brief generated: ${report.brief.title}`);
    console.log(`  Credits: ${report.totalCredits}`);
  } else {
    console.log(`  Result: ${JSON.stringify(report).slice(0, 300)}`);
  }

  // 3. Also hit the seller endpoint to generate another transaction type
  console.log("\n───────────────────────────────────────────────────");
  const { data: seller } = await step(
    "Step 3: Seller Order — Fulfill external request",
    `${BASE}/api/pipeline/run`,
    {
      method: "POST",
      body: JSON.stringify({
        input: "Produce a competitive landscape report on autonomous AI agent frameworks: AutoGPT, CrewAI, LangGraph, and how they integrate with payment rails",
        mode: "seller",
        outputType: "research",
      }),
    }
  );

  if (seller.document || seller.brief) {
    console.log(`  ✓ Seller order fulfilled`);
    if (seller.document?.title) console.log(`  Title: ${seller.document.title}`);
    if (seller.brief?.title) console.log(`  Brief: ${seller.brief.title}`);
    console.log(`  Credits: ${seller.totalCredits}`);
    console.log(`  Duration: ${(seller.totalDurationMs / 1000).toFixed(1)}s`);
  } else {
    console.log(`  Result: ${JSON.stringify(seller).slice(0, 300)}`);
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════");
  const totalCredits = (payment.credits || 0);
  const usedCredits = (report.totalCredits || 0) + (seller.totalCredits || 0);
  const totalTxns = (report.transactions?.length || 0) + (seller.transactions?.length || 0) + 1;
  console.log(` Summary:`);
  console.log(`   Credits purchased: ${totalCredits}`);
  console.log(`   Credits consumed:  ${usedCredits}`);
  console.log(`   Transactions:      ${totalTxns}`);
  console.log(`   Reports generated: ${[report.document, seller.document].filter(Boolean).length}`);
  console.log("═══════════════════════════════════════════════════");
}

main().catch((e) => console.error("Fatal:", e));
