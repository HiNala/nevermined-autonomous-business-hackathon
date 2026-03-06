#!/usr/bin/env node
/**
 * Hit the deployed Auto-Business API to generate Nevermined transactions.
 * Usage: node scripts/hit-api.mjs
 */

const BASE = "https://nevermined-autonomous-business-hack.vercel.app";

const TASKS = [
  {
    name: "Settings Status",
    method: "GET",
    path: "/api/settings/status",
  },
  {
    name: "VGS Config",
    method: "GET",
    path: "/api/vgs/config",
  },
  {
    name: "Strategist — Go-to-market plan",
    method: "POST",
    path: "/api/pipeline/run",
    body: {
      input: "Create a go-to-market strategy for a decentralized AI agent marketplace targeting enterprise customers",
      mode: "strategist",
      outputType: "plan",
    },
  },
  {
    name: "Researcher — Quick market scan",
    method: "POST",
    path: "/api/pipeline/run",
    body: {
      input: "Compare top AI agent payment protocols: Nevermined vs Ocean Protocol vs other x402 solutions in 2026",
      mode: "researcher",
      outputType: "research",
      depth: "quick",
    },
  },
  {
    name: "Pipeline — Full run",
    method: "POST",
    path: "/api/pipeline/run",
    body: {
      input: "Analyze the autonomous agent economy: how AI agents trade services, data, and compute using crypto rails",
      mode: "pipeline",
      outputType: "research",
    },
  },
];

async function run(task) {
  const url = `${BASE}${task.path}`;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`▸ ${task.name}`);
  console.log(`  ${task.method} ${url}`);

  const start = Date.now();
  try {
    const opts = {
      method: task.method,
      headers: { "Content-Type": "application/json" },
    };
    if (task.body) opts.body = JSON.stringify(task.body);

    const res = await fetch(url, opts);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const data = await res.json().catch(() => ({}));

    console.log(`  ← ${res.status} (${elapsed}s)`);

    if (res.ok) {
      // Print summary
      if (data.mode) console.log(`  Mode: ${data.mode}`);
      if (data.totalCredits) console.log(`  Credits: ${data.totalCredits}`);
      if (data.totalDurationMs) console.log(`  Duration: ${(data.totalDurationMs / 1000).toFixed(1)}s`);
      if (data.brief?.title) console.log(`  Brief: ${data.brief.title}`);
      if (data.document?.title) console.log(`  Document: ${data.document.title}`);
      if (data.transactions?.length) console.log(`  Transactions: ${data.transactions.length}`);
      if (data.toolsUsed?.length) console.log(`  Tools: ${data.toolsUsed.map(t => t.tool).join(", ")}`);
      if (data.configured !== undefined) console.log(`  Configured: ${JSON.stringify(data)}`);
      console.log(`  ✓ SUCCESS`);
    } else {
      console.log(`  ✗ ERROR: ${data.error || JSON.stringify(data).slice(0, 200)}`);
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✗ FAILED (${elapsed}s): ${err.message}`);
    return { ok: false, status: 0 };
  }
}

async function main() {
  console.log(`\nAuto-Business API Agent Script`);
  console.log(`Target: ${BASE}`);
  console.log(`Tasks: ${TASKS.length}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  let success = 0;
  let failed = 0;

  for (const task of TASKS) {
    const result = await run(task);
    if (result.ok) success++;
    else failed++;
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`Done: ${success} succeeded, ${failed} failed out of ${TASKS.length} tasks`);
}

main();
