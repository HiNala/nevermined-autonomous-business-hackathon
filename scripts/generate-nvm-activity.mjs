#!/usr/bin/env node
/**
 * Generate Nevermined activity by hitting the deployed API multiple times.
 * Each call triggers logNeverminedTask via the Payments SDK.
 */

const BASE = "https://auto-business-two.vercel.app";

const CALLS = [
  // Direct NVM task logging
  { name: "NVM Order (task log)", method: "POST", path: "/api/nvm/order" },

  // Pipeline runs — each triggers logNeverminedTask internally
  {
    name: "Strategist — Business Plan",
    method: "POST",
    path: "/api/pipeline/run",
    body: { input: "Design a revenue model for an AI agent marketplace that uses x402 micropayments", mode: "strategist", outputType: "plan" },
  },
  {
    name: "Researcher — Market Analysis",
    method: "POST",
    path: "/api/pipeline/run",
    body: { input: "What are the top 5 AI agent frameworks and how do they handle payments", mode: "researcher", outputType: "research", depth: "quick" },
  },

  // Direct NVM task logging again
  { name: "NVM Order #2 (task log)", method: "POST", path: "/api/nvm/order" },

  // Another pipeline run
  {
    name: "Strategist — Pricing Strategy",
    method: "POST",
    path: "/api/pipeline/run",
    body: { input: "Create a pricing strategy for selling AI-generated research reports through agent pipelines", mode: "strategist", outputType: "analysis" },
  },

  // Final NVM task log
  { name: "NVM Order #3 (task log)", method: "POST", path: "/api/nvm/order" },
];

async function run(call) {
  const url = `${BASE}${call.path}`;
  console.log(`\n▸ ${call.name}`);
  console.log(`  ${call.method} ${url}`);
  const start = Date.now();
  try {
    const opts = { method: call.method, headers: { "Content-Type": "application/json" } };
    if (call.body) opts.body = JSON.stringify(call.body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ← ${res.status} (${elapsed}s)`);
    if (data.task?.agentRequestId) console.log(`  NVM Task: ${data.task.agentRequestId}`);
    if (data.mode) console.log(`  Mode: ${data.mode}, Credits: ${data.totalCredits || 0}`);
    if (data.brief?.title) console.log(`  Brief: ${data.brief.title.slice(0, 80)}`);
    if (data.document?.title) console.log(`  Doc: ${data.document.title.slice(0, 80)}`);
    console.log(`  ✓ ${res.ok ? "OK" : "FAIL"}`);
    return res.ok;
  } catch (e) {
    console.log(`  ✗ ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("Generating Nevermined Activity");
  console.log(`Target: ${BASE}`);
  console.log(`Calls: ${CALLS.length}\n`);

  let ok = 0;
  for (const call of CALLS) {
    if (await run(call)) ok++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`Done: ${ok}/${CALLS.length} succeeded`);
}

main();
