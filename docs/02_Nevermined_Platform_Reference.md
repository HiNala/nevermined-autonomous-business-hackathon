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
