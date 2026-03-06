# Get Paid Fast — Setup Guide & Winning Use Case Ideas
**Autonomous Business Hackathon | March 5–6, 2026**

The entire point of this hackathon is agents buying and selling from each other. The more transactions you have with other teams, the better you score. This guide gets you from zero to your first paid transaction as fast as possible, then gives you ideas for what to build on top of that.

---

## ⚡ THE ONLY THING THAT MATTERS RIGHT NOW

**Your first paid agent-to-agent transaction must happen by Thursday 8:00 PM.** If you don't have this, you can't win any prizes. Period. Everything else is secondary until this is done.

---

## SPEED RUN: TypeScript / Next.js Path (This Codebase)

If you're running the Next.js app in this repo, skip the Python section and follow this path instead. The core difference: **deploy first, register second** — Nevermined requires a live HTTPS URL to register an agent.

### Minute 0–5: Accounts

1. **Nevermined:** [nevermined.app](https://nevermined.app) → sign in → Profile → API Keys → create one → copy it (starts with `sandbox:`)
2. **OpenAI** (or Gemini/Anthropic): at least one AI provider key for the research agent
3. **Vercel:** if not already connected, push the repo to GitHub and import in [vercel.com](https://vercel.com)

### Minute 5–15: Initial Deploy (Gets You a Live URL)

Push to `main` (or trigger a Vercel deploy). You don't need any env vars yet — the app runs in **demo mode** without them.

```bash
git push origin main
```

Once Vercel finishes, copy your URL: `https://your-app.vercel.app`

### Minute 15–25: Create a Pricing Plan

1. Go to **nevermined.app → My Pricing Plans → Create New Plan**
2. Fill in:

| Field | Value |
|---|---|
| Plan Name | "Research Agent — Sandbox" |
| Plan Type | Credit-based |
| Price | 1 USDC |
| Payment Currency | Fiat (Stripe) AND Crypto (USDC) — create both |
| Credits in bundle | 100 |
| Protected endpoint | `POST https://your-app.vercel.app/api/agent/research` |

3. Copy the **Plan DID** → `did:nvm:...`

### Minute 25–35: Register the Agent

1. Go to **nevermined.app → Agents → Register New Agent**
2. Fill in:

| Field | Value |
|---|---|
| Agent Definition URL | `https://your-app.vercel.app/.well-known/agent.json` |
| Protected Endpoint | `POST https://your-app.vercel.app/api/agent/research` |
| Agent Name | "Undermind Research Agent" |
| Description | "Web research agent that structures information into professional documents." |

3. Link to your plan from the previous step
4. Copy the **Agent DID** → `did:nvm:...`

### Minute 35–45: Wire Env Vars and Redeploy

In Vercel → your project → Settings → Environment Variables:

```
NVM_API_KEY           = sandbox:your-key-here
NVM_ENVIRONMENT       = sandbox
NVM_PLAN_ID           = did:nvm:...  (from plan creation)
NVM_AGENT_ID          = did:nvm:...  (from agent registration)
NVM_SELLER_ENDPOINT   = https://your-app.vercel.app/api/agent/research
NEXT_PUBLIC_BASE_URL  = https://your-app.vercel.app
OPENAI_API_KEY        = sk-...
```

Trigger a redeploy (or push a whitespace commit). Then verify:

```bash
# Should return { "ready": true, "mode": "live" }
curl https://your-app.vercel.app/api/payment-status

# Should return 402 with payment-required header
curl -X POST https://your-app.vercel.app/api/agent/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test","depth":"quick"}'

# Should show your planId and agentId
curl https://your-app.vercel.app/.well-known/agent.json
```

### Make Your First Cross-Team Transaction

Give another team your agent card URL: `https://your-app.vercel.app/.well-known/agent.json`

Their buyer agent calls `payments.agents.getAgent(your-agent-id)` to discover your plan, then `payments.x402.getX402AccessToken(planId, agentId)` to get a token, then calls your research endpoint with `payment-signature: token`.

You can also call their endpoint as a buyer:
```typescript
// Quick buyer-side test (TypeScript)
const payments = Payments.getInstance({ nvmApiKey: process.env.NVM_API_KEY!, environment: 'sandbox' });
const { accessToken } = await payments.x402.getX402AccessToken(THEIR_PLAN_ID, THEIR_AGENT_ID);

const response = await fetch('https://their-app.vercel.app/api/agent/research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'payment-signature': accessToken },
  body: JSON.stringify({ query: 'test purchase', depth: 'quick' }),
});
console.log(await response.json()); // ← first paid transaction
```

---

## SPEED RUN: Zero to First Transaction (45 minutes)

### Minute 0-5: Get Your Accounts

1. **Nevermined:** Go to [nevermined.app](https://nevermined.app) → sign in with Google → go to API Keys → create one → copy it
2. **OpenAI:** You need an API key from [platform.openai.com](https://platform.openai.com) (or use another LLM provider)
3. **Team Portal:** Register your team to get 20 USDC on Base Sepolia

### Minute 5-10: Clone the Repo and Set Up

```bash
git clone https://github.com/nevermined-io/hackathons.git
cd hackathons
```

You need Python 3.10+ and Poetry. If you don't have Poetry:
```bash
pip install poetry
```

### Minute 10-15: Create a Payment Plan

1. Go to [nevermined.app](https://nevermined.app) → "My Pricing Plans"
2. Create a new credit-based plan
3. Set your endpoint as `POST /data`
4. Set a price (cheap is fine for now — you can change later)
5. Copy the Plan ID

### Minute 15-25: Start Your Seller Agent

```bash
cd agents/seller-simple-agent
poetry install
cp .env.example .env
```

Edit `.env` with your actual values:
```
NVM_API_KEY=sandbox:your-api-key-from-step-1
NVM_ENVIRONMENT=sandbox
NVM_PLAN_ID=your-plan-id-from-step-3
OPENAI_API_KEY=sk-your-openai-key
```

Start it:
```bash
poetry run agent
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:3000
```

**Test it works:**
```bash
# In another terminal — this should return pricing info
curl http://localhost:3000/pricing
```

### Minute 25-35: Start Your Buyer Agent

Open a NEW terminal:
```bash
cd hackathons/agents/buyer-simple-agent
poetry install
cp .env.example .env
```

Edit `.env` — you need the SELLER's plan ID and agent ID here (get from the Marketplace spreadsheet or from another team):
```
NVM_API_KEY=sandbox:your-buyer-api-key
NVM_ENVIRONMENT=sandbox
NVM_PLAN_ID=the-sellers-plan-id
OPENAI_API_KEY=sk-your-openai-key
SELLER_URL=http://localhost:3000  # or another team's URL
```

Run the scripted demo (doesn't need an LLM, fastest way to test):
```bash
poetry run client
```

### Minute 35-45: Make Your First Cross-Team Transaction

This is the critical part. You need to transact with ANOTHER team:

1. **Find another team** — check the Marketplace spreadsheet, or just walk over and ask someone for their seller URL and Plan ID
2. **Point your buyer at their seller** — update `SELLER_URL` in your `.env` to their endpoint
3. **Run your buyer** — `poetry run client` or `poetry run agent`
4. **Verify it worked** — check the Nevermined app for transaction records

Now have THEM point their buyer at YOUR seller and buy from you. Congratulations — you have a two-way economic transaction.

---

## What the Starter Agents Actually Do

### Seller Agent — What's Inside

The seller exposes 3 endpoints:
- `GET /pricing` — free, returns what you sell and how much it costs
- `POST /data` — payment-protected, does the actual work
- `GET /stats` — free, shows usage stats

It has 3 "tools" at different price points:
| Tool | Credits | What It Does |
|------|---------|-------------|
| `search_data` | 1 | Quick lookup — returns search-like results |
| `summarize_data` | 5 | Summarizes a topic |
| `research_data` | 10 | Deep multi-source research with citations |

**The magic is the `@requires_payment` decorator.** This one line handles all payment verification:

```python
@tool(context=True)
@requires_payment(payments=payments, plan_id=PLAN_ID, credits=1)
def search_data(query: str, tool_context=None) -> dict:
    # If we get here, payment is verified. Just do your thing.
    return {"status": "success", "content": [{"text": f"Results for: {query}"}]}
```

### Buyer Agent — What's Inside

The buyer has 3 tools:
| Tool | What It Does |
|------|-------------|
| `discover_pricing` | Calls the seller's `/pricing` endpoint to see what's available |
| `check_balance` | Checks how many credits you have left |
| `purchase_data` | Gets an x402 token from Nevermined, calls the seller's `/data` endpoint with it |

The purchase flow in code:
```python
# 1. Get access token from Nevermined
token = payments.x402.get_x402_access_token(plan_id, agent_id)

# 2. Call the seller with the token
response = requests.post(seller_url + "/data",
    headers={"payment-signature": token["accessToken"]},
    json={"query": "your query here"}
)
```

---

## How Judging Works (So You Know What to Optimize)

### Theme Prizes ($1,000 each + Grand Prize $3,000)

**Best Autonomous Buyer** — your buyer agent needs to:
- ✅ Make 3+ paid transactions (mandatory)
- ✅ Buy from 2+ different teams (mandatory)
- ⭐ Repeat purchases from the same seller, OR switch between sellers after evaluation
- ⭐ Explicit budget enforcement (don't overspend)
- ⭐ ROI-based decision logic (buy from the best value seller)

**Best Autonomous Seller** — your seller agent needs to:
- ✅ Sell to 2+ different teams (mandatory)
- ✅ Generate 3+ paid transactions (mandatory)
- ✅ Get at least 1 repeat buyer (mandatory)
- ⭐ Pricing logic or retention behavior (dynamic pricing, loyalty discounts)

**Most Interconnected** — your system needs to:
- ✅ Participate in the highest number of cross-team transactions
- ✅ Demonstrate BOTH buying AND selling
- ⭐ Actively integrate into or improve the shared market

### Sponsor Prizes ($2,000 each)
- **Ability:** Best use of TrinityOS + Nevermined
- **Mindra:** 5+ agents in a single flow, hierarchical orchestration + Nevermined
- **ZeroClick:** Best AI-native ads + Nevermined integration

### Judging Format
- Preliminary: 3 min presentation + 2 min Q&A
- Finals: 5-7 teams present to everyone
- Judges look at: impact potential, technical demo quality, creativity, presentation

---

## Use Case Ideas (Novel, Fun, Achievable)

### Idea 1: "The Data Broker" — Agent Talent Agency
**What:** Build a meta-agent that discovers ALL other agents in the hackathon economy, makes test purchases to evaluate quality, and then resells curated bundles or routes requests to the best agent for any task.

**Why it wins:** Most Interconnected by design (connects to every agent). Best Buyer (sophisticated evaluation logic). Best Seller (other agents buy routing services from you).

**Sponsor tools:** Exa for discovery, Mindra for orchestrating evaluations, Ability/Trinity for workflow management.

**How to build it:**
1. Start with the buyer agent starter
2. Add a loop that discovers all sellers from the marketplace
3. Make test purchases from each, score the quality
4. Build a seller endpoint that accepts queries and routes them to the best provider
5. Charge a markup (buy for 1 credit, sell for 2)

---

### Idea 2: "Real-Time Intelligence Feed"
**What:** Use Apify to scrape real-time data (news, social media, market data), process it with an LLM, and sell structured intelligence feeds to other teams' agents. Buyers subscribe and get fresh data every time they call.

**Why it wins:** Best Seller (clear value, repeat buyers naturally). Generates lots of transactions because agents keep coming back for fresh data.

**Sponsor tools:** Apify ($100 credits) for scraping, Exa ($50) for supplementary search, Strands for the pipeline.

**How to build it:**
1. Start with the seller agent starter
2. Replace the dummy tools with real Apify scraping calls
3. Cache results and refresh on a timer
4. Price based on data freshness (real-time = 10 credits, cached = 1 credit)

---

### Idea 3: "Ad-Supported Research Agent"
**What:** Build a research agent that generates reports using Exa search. Monetize it TWO ways: Nevermined credits per query AND ZeroClick ads woven into the responses.

**Why it wins:** ZeroClick prize ($2,000). Best Seller (dual revenue). Creative/novel approach to the judges.

**Sponsor tools:** ZeroClick for ad integration, Exa for search, Strands for the agent.

---

### Idea 4: "Quality Scoring Service"
**What:** After buying from any agent, submit quality ratings to your service. Aggregate these into reputation scores. Sell reputation data to buyer agents who want to make smart purchasing decisions.

**Why it wins:** Most Interconnected (every team contributes and benefits). Enables OTHER teams to show switching behavior. Novel infrastructure play.

---

### Idea 5: "Multi-Agent Content Factory"
**What:** Chain 5+ specialized agents: Writer, Researcher, Editor, Translator, Reviewer. Sell assembled content packages. Orchestrate everything through Mindra.

**Why it wins:** Mindra prize ($2,000 — 5+ agents in hierarchical orchestration). Best Seller.

---

### Idea 6: "Autonomous Price War"
**What:** Build a seller agent with dynamic pricing that watches competitor prices and automatically adjusts. Build a buyer agent with ROI logic that always buys from the cheapest quality-adjusted seller. Let them run and create actual market dynamics.

**Why it wins:** This is EXACTLY what the judges described as ideal — ROI-based decisions, switching behavior, repeat purchases. Demonstrates real economic thinking.

---

## Time Management (How to Spend Your 2 Days)

### Day 1 — Thursday
| Time | What to Do |
|------|-----------|
| 9:30-10:00 | Arrive, get breakfast, set up laptop |
| 10:00-10:30 | Clone repo, create Nevermined account, set env vars |
| 10:30-11:30 | Get seller running, get buyer running, test locally |
| 11:30-12:00 | Find another team, make your first cross-team transaction |
| 12:00-1:00 | Lunch + attend a speaker talk ($100 gift card giveaway!) |
| 1:00-6:00 | Build your actual project. Integrate sponsor tools. |
| 6:00-7:00 | Dinner + more speaker talks |
| 7:00-8:00 | Make sure you have 3+ transactions with 2+ teams |
| **8:00 PM** | **⚡ MANDATORY: First paid transaction must be done** |

### Day 2 — Friday
| Time | What to Do |
|------|-----------|
| 9:30-12:00 | Polish your project, add switching/ROI logic |
| 12:00-1:00 | Lunch + speaker talks |
| 1:00-3:00 | Final push — maximize cross-team transactions |
| 3:00-4:00 | Prepare your demo, test everything end-to-end |
| **4:00 PM** | **CODE FREEZE** |
| 5:30 | Finalists announced and present |
| 7:30 | Winners announced |

---

## Demo Tips (What Judges Want to See)

1. **Show live transactions** — have your agents actively buying/selling during the demo
2. **Show the economic logic** — WHY did your buyer choose seller A over seller B?
3. **Show the numbers** — how many transactions, how many teams, how much revenue
4. **Call out sponsor tools** — "We used Apify for data, Exa for search, and Mindra for orchestration"
5. **Keep it tight** — you have 3 minutes. Practice. No fumbling.

---

## Quick Reference: Essential Commands

```bash
# Clone and enter the repo
git clone https://github.com/nevermined-io/hackathons.git
cd hackathons

# Seller agent
cd agents/seller-simple-agent
poetry install && cp .env.example .env && poetry run agent

# Buyer agent (new terminal)
cd agents/buyer-simple-agent
poetry install && cp .env.example .env && poetry run client

# MCP server agent
cd agents/mcp-server-agent
poetry install && poetry run python -m src.setup && poetry run python -m src.server

# Strands agent
cd agents/strands-simple-agent
poetry install && poetry run python agent.py
```

---

## Key Links

- **Hackathon Repo:** https://github.com/nevermined-io/hackathons
- **Nevermined App:** https://nevermined.app
- **Nevermined Docs:** https://docs.nevermined.app
- **Discord:** https://discord.com/invite/GZju2qScKq
- **Marketplace Spreadsheet:** Check Discord for the link
- **Team Portal:** Check Discord for the link
