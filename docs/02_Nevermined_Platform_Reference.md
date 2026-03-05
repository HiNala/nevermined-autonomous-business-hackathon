# Nevermined Payment Platform — Complete Reference
**Autonomous Business Hackathon | March 5–6, 2026**

This is your reference for everything Nevermined — what it is, how it works, all the code patterns, and exactly how the hackathon repo agents use it.

---

## What Is Nevermined? (The Simple Version)

Nevermined is the **cash register** for AI agents. When Agent A wants to buy a service from Agent B, Nevermined handles:

1. **Who's selling what** — agent registration and discovery
2. **How much it costs** — payment plans with credit-based pricing
3. **Did they pay?** — verifying payments before granting access
4. **How much was used?** — metering every API call
5. **Moving the money** — settling payments via USDC on-chain or credit card via Stripe

Every single transaction at this hackathon MUST go through Nevermined. No exceptions.

---

## How It Works (The Flow)

Here's what happens when one agent buys from another:

```
YOUR BUYER AGENT                NEVERMINED                    OTHER TEAM'S SELLER AGENT
      |                             |                                   |
      |  1. "What do you sell?"     |                                   |
      |------------------------------------------------------------>   |
      |  <- Here's my pricing       |                                   |
      |<------------------------------------------------------------   |
      |                             |                                   |
      |  2. "I want to buy"         |                                   |
      |----------------------------->                                   |
      |  <- Here's your access token|                                   |
      |<-----------------------------|                                   |
      |                             |                                   |
      |  3. "Give me data" + token  |                                   |
      |------------------------------------------------------------>   |
      |                             |  4. "Is this token valid?"        |
      |                             |<----------------------------------|
      |                             |  <- "Yes, burn 1 credit"          |
      |                             |---------------------------------->|
      |  <- Here's your data        |                                   |
      |<------------------------------------------------------------|
```

---

## Core Concepts (Plain English)

### Payment Plans
A plan is like a menu item. The seller says "My service costs X amount, and you get Y credits for it." Each API call costs some number of credits. When you run out, you buy more.

### Credits
Think of credits like arcade tokens. You buy a bunch, then spend them one at a time each time you use a service. The seller decides how many credits each action costs (1 for a simple search, 10 for deep research, etc.).

### x402 Access Tokens
This is the "ticket" that proves you paid. When your buyer agent wants to call a seller's API, it first gets an access token from Nevermined, then includes that token in the `payment-signature` HTTP header. The seller's middleware checks the token with Nevermined, and if it's valid, the request goes through and credits get deducted.

### Two Payment Rails
Sellers should create plans for BOTH:
- **Credit Card (Fiat)** — buyers pay with Stripe, no crypto needed
- **USDC (Crypto)** — buyers pay with stablecoins on-chain

More payment options = more potential customers = more transactions = better hackathon scores.

---

## Getting Set Up (Do This First)

### Step 1: Create Your Account (2 minutes)

1. Go to [nevermined.app](https://nevermined.app)
2. Sign in with Google, GitHub, or a wallet
3. Go to your profile → API Keys → create a new key
4. Save it — you'll need it for everything

### Step 2: Set Your Environment Variables

```bash
export NVM_API_KEY="sandbox:your-api-key-here"
export NVM_ENVIRONMENT="sandbox"
export OPENAI_API_KEY="sk-your-openai-key"
```

### Step 3: Create a Payment Plan (in the web UI)

1. In nevermined.app, go to "My Pricing Plans"
2. Click "Create New Plan"
3. Set: plan type = credit-based, price, and which endpoints it covers
4. Copy the Plan ID — you'll put this in your `.env` file

### Step 4: Install the SDK

```bash
# Python
pip install payments-py

# TypeScript
npm install @nevermined-io/payments
```

---

## The Hackathon Repo (What's Actually In There)

The repo at `github.com/nevermined-io/hackathons` has 4 complete working agents:

### Seller Agent (`agents/seller-simple-agent/`)
Sells data with tiered pricing. Has 3 tools at different price points:
- `search_data` — 1 credit (quick lookup)
- `summarize_data` — 5 credits (summarize a topic)
- `research_data` — 10 credits (deep research with citations)

**To run it:**
```bash
cd agents/seller-simple-agent
poetry install
cp .env.example .env    # Edit with your credentials
poetry run agent        # Starts FastAPI server on http://localhost:3000
```

The key code pattern is the `@requires_payment` decorator:
```python
from strands import Agent, tool
from payments_py.x402.strands import requires_payment

@tool(context=True)
@requires_payment(payments=payments, plan_id=PLAN_ID, credits=1)
def search_data(query: str, tool_context=None) -> dict:
    """Quick data lookup (1 credit)."""
    return {"status": "success", "content": [{"text": f"Results for: {query}"}]}
```

That decorator does everything — checks if the caller has a valid token, verifies they have enough credits, processes the request, and burns the credits after.

**API endpoints the seller exposes:**
- `POST /data` — the main endpoint (payment protected)
- `GET /pricing` — shows pricing tiers (free, used by buyers for discovery)
- `GET /stats` — usage stats (free)

### Buyer Agent (`agents/buyer-simple-agent/`)
Discovers sellers, buys data, tracks spending. Has 3 tools:
- `discover_pricing` — calls `GET /pricing` on the seller (free)
- `check_balance` — checks how many credits you have left (free)
- `purchase_data` — gets x402 token, calls `POST /data` with it (costs credits)

**To run it:**
```bash
cd agents/buyer-simple-agent
poetry install
cp .env.example .env    # Edit with your credentials

# Make sure a seller is running first!
poetry run agent        # Interactive CLI
poetry run client       # Scripted demo (no LLM needed)
poetry run demo         # LLM-orchestrated demo
```

### MCP Server Agent (`agents/mcp-server-agent/`)
Exposes payment-protected tools via MCP protocol. Includes a setup script that registers the agent programmatically.

```bash
cd agents/mcp-server-agent
poetry install
poetry run python -m src.setup    # Register agent + create plan
poetry run python -m src.server   # Start MCP server on port 3000
```

### Strands Agent (`agents/strands-simple-agent/`)
Demonstrates the `@requires_payment` decorator pattern with full payment discovery.

```bash
cd agents/strands-simple-agent
poetry install
poetry run python agent.py
```

---

## Sandbox Environment Reference

### API Key Format
Sandbox API keys have a `sandbox:` prefix:
```
NVM_API_KEY=sandbox:eyJhbGc...
```
Production keys have no prefix. The SDK infers environment from the key prefix if `environment` is not set explicitly. **Always set both.**

### Networks
| Environment | Network | USDC Address |
|---|---|---|
| `sandbox` | Arbitrum Sepolia (testnet) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| `live` | Arbitrum One (mainnet) | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |

For the hackathon, use `sandbox` exclusively. Testnet USDC is free — get it from the Team Portal welcome bonus (20 USDC on Base Sepolia) or a faucet.

### Plan DID Format
All plan and agent IDs are DIDs (Decentralized Identifiers):
```
did:nvm:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
These appear in the Nevermined dashboard after creation and in the URL bar when viewing a plan or agent.

---

## Payment Plan — Required Fields (UI)

When creating a plan at **nevermined.app → My Pricing Plans → Create New Plan**:

| Field | What to Enter | Notes |
|---|---|---|
| **Plan Name** | e.g. "Research Agent — Standard" | Visible to buyers in the marketplace |
| **Description** | e.g. "Pay-per-query web research" | Short; shown on the plan page |
| **Plan Type** | Credit-based | Use credit-based for pay-per-request pricing |
| **Price** | e.g. `1` USDC | Displayed in USDC; stored with 6 decimals internally (1 USDC = 1,000,000) |
| **Payment Currency** | Fiat and/or Crypto | Create TWO plans (one fiat, one crypto) for maximum buyer reach |
| **Credits in bundle** | e.g. `100` | How many credits a buyer receives per purchase |
| **Credits per request** | e.g. `1`–`10` | How many credits each API call costs; match your `credits` arg in `paymentMiddleware` |
| **Protected endpoint** | `POST https://your-app.vercel.app/api/agent/research` | Must be exact HTTPS URL; localhost won't work for production plans |

**Important:** The "protected endpoint" you enter here must match EXACTLY what you pass to `buildPaymentRequired` and register in your agent. Any mismatch causes verification to fail.

### SDK Equivalent
```typescript
const priceConfig = payments.plans.getERC20PriceConfig(
  1_000_000n,                               // 1 USDC (6 decimal places)
  '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia USDC
  process.env.BUILDER_ADDRESS!              // Your wallet address (seller receives funds)
);
const creditsConfig = payments.plans.getFixedCreditsConfig(100n, 1n); // 100 credits, 1 per request
```

---

## Agent Registration — Required Fields (UI)

When registering at **nevermined.app → Agents → Register New Agent**:

| Field | What to Enter | Notes |
|---|---|---|
| **Agent Definition URL** | `https://your-app.vercel.app/.well-known/agent.json` | Must be a live HTTPS URL — deploy first, then register |
| **Protected Endpoint** | `POST https://your-app.vercel.app/api/agent/research` | Must match the plan's endpoint and your `NVM_SELLER_ENDPOINT` env var |
| **Agent Name** | Max 50 characters | Displayed in the Nevermined marketplace |
| **Description** | Max 50 words | Elevator pitch for buyers discovering your agent |
| **Pricing Plan** | Select from your existing plans | Link both fiat and crypto plans if you created two |

After registering, copy the **Agent DID** (`did:nvm:...`) from the dashboard URL or detail page and set it as `NVM_AGENT_ID`.

---

## Building a Seller From Scratch (TypeScript)

If you want to build your own seller instead of using the starter:

### Step 1: Initialize the client

```typescript
import { Payments } from '@nevermined-io/payments';

const payments = Payments.getInstance({
    nvmApiKey: process.env.NVM_API_KEY!,
    environment: 'sandbox'
});
```

### Step 2: Register your agent and plan

```typescript
const { agentId, planId } = await payments.agents.registerAgentAndPlan(
    { name: 'My Agent', tags: ['hackathon'], dateCreated: new Date() },
    { endpoints: [{ POST: 'https://your-service.com/api/query' }] },
    { name: 'Hackathon Plan', description: '50 queries', dateCreated: new Date() },
    payments.plans.getERC20PriceConfig(1_000_000n, USDC_ADDRESS, BUILDER_ADDRESS),
    payments.plans.getFixedCreditsConfig(50n, 1n)
);
```

### Step 3: Protect your endpoint

```typescript
import { paymentMiddleware } from '@nevermined-io/payments/express';

app.use(paymentMiddleware(payments, {
    'POST /api/query': { planId, credits: 1 }
}));

app.post('/api/query', async (req, res) => {
    // If we get here, payment is already verified and credits burned
    const result = await doYourThing(req.body.prompt);
    res.json(result);
});
```

---

## Building a Buyer From Scratch (TypeScript)

### Step 1: Discover what's available

```typescript
const agent = await payments.agents.getAgent('SELLER_AGENT_ID');
const plan = agent.plans[0];
console.log(`Found: ${agent.name}, price: ${plan.price}, credits: ${plan.credits}`);
```

### Step 2: Buy the plan

```typescript
// Crypto (USDC)
const order = await payments.plans.orderPlan(plan.planId);

// Or fiat (credit card — redirects to Stripe)
const { url } = await payments.plans.orderFiatPlan(plan.planId);
```

### Step 3: Get your access token and call the seller

```typescript
const { accessToken } = await payments.x402.getX402AccessToken(plan.planId, agent.agentId);

const response = await fetch(agent.endpoints[0].POST, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'payment-signature': accessToken
    },
    body: JSON.stringify({ prompt: 'Give me market data for AAPL' })
});

const result = await response.json();
```

---

## x402 Implementation Reference (TypeScript / Next.js)

This codebase uses the **manual verify → execute → settle** pattern rather than the Express middleware. This gives full control over credit costs per request depth.

### Key Function: `buildPaymentRequired`

```typescript
import { buildPaymentRequired } from '@nevermined-io/payments';

const paymentRequired = buildPaymentRequired(planId, {
  endpoint: '/api/agent/research',
  agentId: process.env.NVM_AGENT_ID!,
  httpVerb: 'POST',
});
```

This creates the payment specification used to verify and settle tokens. The `endpoint` and `agentId` must match exactly what was registered in Nevermined.

### Step 1 — Return 402 (No Token)

When a request arrives with no `payment-signature` header, return HTTP 402:

```typescript
const paymentRequired = buildPaymentSpec('/api/agent/research');
const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString('base64');

return NextResponse.json(
  { error: 'Payment Required', planId, agentId },
  { status: 402, headers: { 'payment-required': encoded } }
);
```

### Step 2 — Verify (Does NOT Burn Credits)

```typescript
const verification = await payments.facilitator.verifyPermissions({
  paymentRequired,
  x402AccessToken: token,
  maxAmount: BigInt(credits), // e.g. 1n, 5n, or 10n
});

if (!verification.isValid) {
  return NextResponse.json({ error: 'Invalid token' }, { status: 402 });
}
```

**`maxAmount` is critical.** It caps the maximum credits the facilitator is allowed to verify/settle for this request. Always set it to the exact credit cost for the operation — not a generic large number. This prevents buyers from being over-charged and prevents sellers from burning more credits than advertised.

### Step 3 — Execute

Run your agent logic here. If execution fails, do NOT call settle (credits are preserved for the buyer).

### Step 4 — Settle (Burns Credits)

```typescript
const settlement = await payments.facilitator.settlePermissions({
  paymentRequired,
  x402AccessToken: token,
  maxAmount: BigInt(credits), // same value as used in verify
});
```

Only call settle after successful execution. The `maxAmount` here must match the value used in `verifyPermissions`.

### Buyer Side

```typescript
// 1. Discover the agent
const agent = await payments.agents.getAgent(agentId);
const plan = agent.plans[0];

// 2. Get access token
const { accessToken } = await payments.x402.getX402AccessToken(
  plan.planId,
  agent.agentId
);

// 3. Call the seller with the token
const response = await fetch(agent.endpoints[0].POST, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'payment-signature': accessToken,
  },
  body: JSON.stringify({ query: 'your query', depth: 'standard' }),
});
```

---

## Fiat Payments (Stripe Sandbox / VGS)

### How Fiat Works in Nevermined

Nevermined supports credit card payments through Stripe. The buyer calls `orderFiatPlan` which redirects to a Stripe Checkout session. After payment, Nevermined mints credits to the buyer's account. The seller's x402 flow works identically regardless of whether the buyer paid with crypto or credit card.

```typescript
// Buyer side — initiate Stripe checkout
const { sessionId, url } = await payments.plans.orderFiatPlan(planId);
window.location.href = url; // Redirect to Stripe Checkout page
```

### Sandbox Test Cards (Stripe Test Mode)

Nevermined's sandbox environment is connected to Stripe's **test mode**. No real money moves.

| Card Number | Behavior |
|---|---|
| `4242 4242 4242 4242` | Always succeeds |
| `4000 0000 0000 9995` | Always declines |
| `4000 0025 0000 3155` | Requires 3D Secure auth |

Use any future expiry date and any 3-digit CVC.

### VGS (Very Good Security) — What It Is

VGS is a payment tokenization proxy that sits between buyers and Stripe. It intercepts raw card numbers and replaces them with secure aliases before they ever touch your backend — keeping you out of PCI scope. Nevermined's fiat payment infrastructure uses VGS under the hood on their server side.

**For the hackathon:** You do not need to integrate VGS directly. Simply using `orderFiatPlan` routes through Nevermined's VGS-secured Stripe integration automatically. The buyer experience is a standard Stripe Checkout page.

If you want to build your **own** credit card intake form (e.g., collect card details directly), you would use VGS Collect:
```
POST https://api.sandbox.verygoodvault.com/aliases
```
But for agent-to-agent commerce via Nevermined, `orderFiatPlan` is sufficient.

---

## A2A Protocol (Agent-to-Agent)

A2A is a standard way for agents to discover and talk to each other. Instead of custom REST APIs, agents publish an "Agent Card" at `/.well-known/agent.json` that describes what they do and how to pay them.

**How the seller agent runs in A2A mode:**
```bash
poetry run agent-a2a   # Starts A2A server on port 9000
```

**Agent Card includes Nevermined payment info:**
```json
{
    "capabilities": {
        "streaming": true,
        "extensions": [{
            "uri": "urn:nevermined:payment",
            "params": {
                "paymentType": "dynamic",
                "credits": 1,
                "planId": "<your-plan-id>",
                "agentId": "<your-agent-id>"
            }
        }]
    },
    "url": "https://your-agent.example.com/a2a/"
}
```

**Important:** The `url` must match EXACTLY what you registered in Nevermined.

### This Codebase's Agent Card (`/.well-known/agent.json`)

This app serves its agent card dynamically at `/.well-known/agent.json`. The `url` field is built from `NEXT_PUBLIC_BASE_URL`:

```typescript
// src/app/.well-known/agent.json/route.ts
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

return NextResponse.json({
  name: 'Auto Business Research Agent',
  url: `${baseUrl}/api/agent/research`,     // ← must match Nevermined registration
  capabilities: {
    extensions: [{
      uri: 'urn:nevermined:payment',
      params: {
        paymentType: 'dynamic',
        credits: 5,                           // default; actual cost set per-request
        planId: process.env.NVM_PLAN_ID,
        agentId: process.env.NVM_AGENT_ID,
      }
    }]
  }
});
```

**Checklist before registering:**
- [ ] App is deployed to Vercel and `NEXT_PUBLIC_BASE_URL` is set to the production URL
- [ ] `/.well-known/agent.json` is accessible publicly (no auth)
- [ ] `url` in the card matches the endpoint registered in Nevermined exactly
- [ ] `planId` and `agentId` in the card are populated (not empty strings)

---

## Three Protocols — When to Use Which

| Protocol | Use When | How |
|----------|----------|-----|
| **x402 (HTTP)** | Simple buyer/seller with REST APIs | `payment-signature` header on HTTP requests |
| **A2A** | Standard agent discovery + interop | Agent Card at `/.well-known/agent.json` + JSON-RPC |
| **MCP** | Tool/plugin monetization | `Authorization: Bearer <token>` on MCP tool calls |

The hackathon repo has working examples of all three.

---

## Hackathon Requirements (Don't Forget These)

1. **⚡ FIRST TRANSACTION BY THURSDAY 8PM** — This is mandatory. No transaction = no prize eligibility.
2. **All transactions through Nevermined** — No side-channel payments.
3. **List in the Marketplace** — Add your agent to the shared spreadsheet so other teams can find you.
4. **Team Portal** — Register to get your 20 USDC welcome bonus on Base Sepolia.

---

## Key Links

| Resource | URL |
|----------|-----|
| Nevermined App | https://nevermined.app |
| Documentation | https://docs.nevermined.app |
| Hackathon Repo | https://github.com/nevermined-io/hackathons |
| Python SDK | `pip install payments-py` |
| TypeScript SDK | `npm install @nevermined-io/payments` |
| Discord | https://discord.com/invite/GZju2qScKq |
| Quickstart Guide | https://docs.nevermined.app/docs/getting-started/quickstart |
