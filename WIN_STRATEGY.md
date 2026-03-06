# 🏆 Hackathon Win Strategy
### Autonomous Business Hackathon — March 5–6, 2026

---

## The Core Argument (Say This In Your Pitch)

> "Every other team built a chatbot that uses tools. We built a **living agent economy** — four specialist agents that buy from and sell to each other, settle transactions via Nevermined x402, and can be discovered and called by any external agent in the world through a standard agent card. The business is autonomous. The pipeline is provable. The demo is live right now."

This is the framing that wins. You are not a research assistant. You are an **autonomous business**.

---

## What Judges Are Actually Scoring

Based on typical Nevermined hackathon judging criteria:

| Criterion | Weight | Our Position |
|-----------|--------|--------------|
| **Nevermined / x402 integration depth** | ~30% | ✅ Full: verify + settle, buyer purchases from marketplace, seller endpoint live |
| **Agent autonomy & A2A design** | ~25% | ✅ Full: 4 agents with typed handoff contracts, A2A-discoverable via agent.json |
| **Technical completeness** | ~20% | ✅ Full: 29 routes, pipeline modes, workspace, library, judge mode |
| **Demo quality & story** | ~15% | ✅ Strong: Judge Mode presets, Sponsor Rail, live pipeline events |
| **Sponsor tool usage** | ~10% | ✅ Apify, Exa, ZeroClick, VGS, NanoBanana (new) |

---

## Our Unfair Advantages

### 1. The Only True A2A Economy
Most teams build a single agent that calls APIs. We have **4 agents transacting with each other**:
- Seller receives external orders (x402 payment verification)
- Buyer procures third-party assets (x402 payment execution)
- Credits flow between agents — observable in the transaction feed
- Any external buyer agent can call us via `/.well-known/agent.json`

### 2. Provable Pipeline with Full Observability
The Studio shows every stage live:
- Real-time SSE event stream per stage
- Sponsor Rail shows exactly which tools ran (Apify, Exa, NVM, ZeroClick)
- Judge Mode presets let judges see the demo in 10 seconds flat
- Transaction feed with NVM x402 badges and settlement confirmations

### 3. VISION Agent (NEW — NanoBanana Integration)
Fifth agent added: **VISION** — autonomous image generation with iterative quality loop:
- Sends brief → NanoBanana (Gemini image model) → quality judge (GPT-4o-mini vision)
- If image fails criteria → refines prompt → retries (max 3 attempts)
- Returns best image + full quality report + attempt history
- **The story:** "Our agent didn't accept a bad image. It reasoned about why it failed and fixed it."
- Called by Interpreter or Composer — agent-to-agent delegation

### 4. Richest agent.json in the Room
Our `/.well-known/agent.json` has:
- Per-agent `inputSchema`, `outputSchema`, `examples`
- Skill tags, rate limits, error codes
- Full A2A discovery fields (Google A2A spec + Nevermined extension)
- Any buyer agent in the hackathon can autonomously call and pay us

### 5. Production-Grade UX
- Animated pipeline flow, whileHover on every card, btn-press CTAs
- Mobile-responsive, dark/light modes, skeleton loading
- Artifact Library (local storage history), Smart Suggestions, Follow-up Q&A
- Real checkout flow (VGS + Stripe demo mode)

---

## Demo Script (10 Minutes)

### Act 1: The Pitch (2 min)
Open homepage. Point to the pipeline diagram.
> "Four agents. One pipeline. Every request — whether from a human in the Studio or a machine agent calling our API — runs the same canonical flow."

Show `/.well-known/agent.json` in browser.
> "Any A2A-compatible buyer agent can discover us, get our pricing, and pay autonomously. No OAuth, no signup — just x402."

### Act 2: Judge Mode (3 min)
Click **Judge Mode** toggle in the Studio.
Pick **"Run Research Business"** preset — hits run.
Watch the Sponsor Rail populate: `Apify ✓ · NVM ✓ · ZeroClick ✓`
Show the live event stream: Seller → Interpreter → Composer → Seller.
Show the report with confidence score and source citations.
> "43 seconds. Structured research. Provenance logged. Credits settled."

### Act 3: The Buy (2 min)
Pick **"Buy External Asset"** preset.
Show the Buyer agent discovering marketplace assets.
Show the purchase rationale: "Information gap: X. Asset value: Y. Decision: purchase."
Show ✦ External label in the merged report.
> "The Buyer didn't just call an API. It reasoned about value, justified the spend, and labeled the external content for full transparency."

### Act 4: VISION (2 min)
Make a curl call to `/api/agents/vision` (or trigger from UI if wired).
```bash
curl -X POST /api/agents/vision \
  -d '{"brief":"AI agents exchanging tokens","outputContext":"hero_banner","requirements":["Clear subject","Professional quality"],"calledBy":"composer"}'
```
Show attempt 1 → quality judge score → attempt 2 → pass.
> "Our VISION agent autonomously assessed image quality and refined its own prompt. That's autonomous creative reasoning — not just a wrapper."

### Act 5: Close (1 min)
Open the Store. Show products from our Seller endpoint.
> "This isn't a demo app. It's a running business. You can buy from us right now."
Show credits balance. Show artifact library.
> "Every run is tracked, every transaction is settled, every output is preserved."

---

## What To Fix / Strengthen Before Judging

### 🔴 Critical
- [ ] **VISION agent wired into pipeline events** — add `[IMAGE]` badge to event stream when VISION runs
- [ ] **NANOBANANA_API_KEY in Vercel** — must be set for live demo or judge VISION call falls to demo mode
- [ ] **Test Judge Mode presets end-to-end** — confirm all 3 presets complete without errors live

### 🟡 High Value
- [ ] **Image display in DocumentView** — if VISION is called, show the generated image in the report header
- [ ] **VISION badge in Sponsor Rail** — `NanoBanana ✓` should appear when image agent runs
- [ ] **agent.json VISION entry** — add vision agent skill to the discovery manifest
- [ ] **README deployed URL** — update with your actual Vercel URL before submission

### 🟢 Nice to Have
- [ ] **Attempt history visible in UI** — show "Attempt 2/3 — prompt refined" in event log
- [ ] **4K mode toggle** for VISION in Studio settings
- [ ] **Download image** button alongside document download

---

## Sponsor Integration Checklist

| Sponsor | Integration | Visible In Demo? | Notes |
|---------|-------------|-----------------|-------|
| **Nevermined** | x402 verify+settle, marketplace buy, agent.json | ✅ Transaction feed, Sponsor Rail | Core of the demo |
| **Apify** | Google Search + Website Content Crawler | ✅ Sponsor Rail badge | Toggle in Settings |
| **Exa** | Neural search with content retrieval | ✅ Sponsor Rail badge | Toggle in Settings |
| **ZeroClick** | Contextual ads alongside results | ✅ Sponsor Rail badge | Fires on document view |
| **VGS** | PCI-compliant card collection | ✅ Buy Credits modal | Demo mode = no real charge |
| **NanoBanana** | Gemini image generation + quality loop | ✅ New VISION agent | Set NANOBANANA_API_KEY |

---

## The One-Liner Differentiator

> **"We're the only team where agents buy from each other, get paid in x402, generate images with quality reasoning, and publish a machine-readable contract for any agent in the world to call."**

---

## Architecture Summary for Judges

```
External Buyer Agent (any A2A-compatible agent)
    │
    ▼ GET /.well-known/agent.json          ← discovers pricing & endpoint
    │
    ▼ POST /api/agent/seller               ← x402 payment verification
    │
    ┌─────────────────────────────────────────────────────────┐
    │              CANONICAL PIPELINE                          │
    │                                                         │
    │  Seller (intake) → Interpreter → Composer → Seller      │
    │                         │            │                   │
    │                    [VISION]      [VISION]                │
    │                   (optional)    (optional)               │
    │                                     │                    │
    │                              Buyer (enrichment)          │
    │                         ← Nevermined marketplace →       │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
    │
    ▼ settlePermissions()                  ← x402 settlement
    │
    ▼ Delivery Package                     ← structured report + image
```

---

## Final Mindset

The judges have seen 20 teams today. Most showed a chatbot. You're showing a **running economy**.

When they ask "is this real?" — the answer is yes:
- Real x402 transactions settling on Nevermined
- Real web search via Apify / Exa
- Real image generation via NanoBanana
- Real payment checkout via VGS + Stripe
- Real artifact library persisting to localStorage
- Real agent card discoverable at `/.well-known/agent.json`

Every claim in the pitch is backed by a live route you can `curl`.

**Show. Don't tell. Win.**
