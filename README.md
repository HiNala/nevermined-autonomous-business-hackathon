# NVM Market — Autonomous Agent Marketplace

A live agent economy running on **Nevermined**. Built for the Autonomous Business Hackathon (March 5–6, 2026).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Payments:** Nevermined SDK (`@nevermined-io/payments`)

## Project Structure

```
src/
├── app/
│   ├── .well-known/agent.json/  # A2A agent card (auto-discovery)
│   ├── api/
│   │   ├── agent/
│   │   │   ├── research/        # POST — x402-protected seller endpoint
│   │   │   ├── pricing/         # GET  — free pricing discovery
│   │   │   ├── stats/           # GET  — usage stats
│   │   │   └── events/          # GET  — SSE event stream
│   │   ├── payment-status/      # GET  — Nevermined config status
│   │   └── studio-request/      # POST — buyer-side studio flow
│   ├── research/                # /research page (dual-pane agent UI)
│   └── ...
├── lib/
│   ├── nevermined/server.ts     # SDK init, x402 verify/settle, maxAmount
│   ├── agent/                   # Web research agent + event store
│   └── ai/                      # Multi-provider AI (OpenAI/Gemini/Anthropic)
└── ...
docs/                            # Reference docs & design guide
```

## Getting Started (Local Dev)

```bash
npm install
cp env.template .env.local       # Fill in your keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without any env vars set the app runs in **demo mode** — all UI works, no real payments.

## Environment Variables

Copy `env.template` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `NVM_API_KEY` | Yes (for live) | From nevermined.app → API Keys. Sandbox keys start with `sandbox:` |
| `NVM_ENVIRONMENT` | Yes | `sandbox` (testnet) or `live` (mainnet) |
| `NVM_PLAN_ID` | Yes (for live) | DID of your payment plan, e.g. `did:nvm:abc...` |
| `NVM_AGENT_ID` | Yes (for live) | DID of your registered agent, e.g. `did:nvm:xyz...` |
| `NVM_SELLER_ENDPOINT` | Yes (for live) | Full URL of `POST /api/agent/research` on your deployed domain |
| `NEXT_PUBLIC_BASE_URL` | Yes (for live) | Base URL of your deployed app, e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | One of these | For the research agent LLM calls |
| `GOOGLE_AI_KEY` | One of these | Gemini fallback |
| `ANTHROPIC_API_KEY` | One of these | Anthropic fallback |

## Nevermined Sandbox Setup

### 1. Get an API Key
Go to [nevermined.app](https://nevermined.app) → sign in → Profile → API Keys → create one.
Sandbox keys start with `sandbox:` — set `NVM_API_KEY=sandbox:your-key`.

### 2. Deploy to Vercel First
You need a public HTTPS URL before registering the agent.
Push to `main` → Vercel auto-deploys. Copy your `https://your-app.vercel.app` URL.

### 3. Create a Pricing Plan (nevermined.app UI)
1. Go to **My Pricing Plans** → Create New Plan
2. Fill in:
   - **Plan Name:** e.g. "Research Agent — Standard"
   - **Description:** e.g. "Pay-per-query web research"
   - **Plan Type:** Credit-based (pay-per-use)
   - **Price:** e.g. 1 USDC (= `1_000_000` in 6-decimal BigInt)
   - **Payment Currency:** Fiat (Stripe/credit card) **and/or** Crypto (USDC on Arbitrum Sepolia)
   - **Credits in bundle:** e.g. 100 (buyer gets 100 credits per purchase)
   - **Credits per request:** 1–10 depending on depth tier
   - **Protected endpoint:** `POST https://your-app.vercel.app/api/agent/research`
3. Copy the **Plan DID** → set `NVM_PLAN_ID=did:nvm:...`

### 4. Register the Agent (nevermined.app UI)
1. Go to **Agents** → Register New Agent
2. Fill in:
   - **Agent Definition URL:** `https://your-app.vercel.app/.well-known/agent.json`
   - **Protected Endpoint:** `POST https://your-app.vercel.app/api/agent/research`
   - **Agent Name:** e.g. "Auto Business Research Agent" (max 50 chars)
   - **Description:** max 50 words
3. Link to your pricing plan
4. Copy the **Agent DID** → set `NVM_AGENT_ID=did:nvm:...`

### 5. Set Remaining Env Vars on Vercel
In Vercel dashboard → Settings → Environment Variables:
```
NVM_API_KEY             = sandbox:your-key
NVM_ENVIRONMENT         = sandbox
NVM_PLAN_ID             = did:nvm:...
NVM_AGENT_ID            = did:nvm:...
NVM_SELLER_ENDPOINT     = https://your-app.vercel.app/api/agent/research
NEXT_PUBLIC_BASE_URL    = https://your-app.vercel.app
```
Redeploy after setting.

### 6. Verify
```bash
# Confirm your agent card is live
curl https://your-app.vercel.app/.well-known/agent.json

# Confirm payment status
curl https://your-app.vercel.app/api/payment-status

# Trigger a 402 response (no token)
curl -X POST https://your-app.vercel.app/api/agent/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test","depth":"quick"}'
# → HTTP 402 with payment-required header
```

## Payment Flow (x402)

The seller endpoint at `POST /api/agent/research` implements the **manual x402 verify → execute → settle** pattern:

```
Buyer                    Nevermined               Seller (this app)
  |                          |                          |
  | GET /.well-known/agent.json ──────────────────────> |
  | <── planId, agentId, endpoint ────────────────────── |
  |                          |                          |
  | getX402AccessToken(planId, agentId) ─────────────>  |
  | <── accessToken ──────────────────────────────────  |
  |                          |                          |
  | POST /api/agent/research                            |
  |   payment-signature: accessToken ────────────────> |
  |                          |                          |
  |               verifyPermissions(maxAmount: BigInt)  |
  |                     <────────────────────────────── |
  |                          | valid ─────────────────> |
  |                          |                          |
  |                          |     [run research]       |
  |                          |                          |
  |               settlePermissions(maxAmount: BigInt)  |
  |                     <────────────────────────────── |
  |                          | settled ───────────────> |
  | <── 200 + document ───────────────────────────────  |
```

`maxAmount` is passed as a `BigInt` matching the credit cost for the request depth (1, 5, or 10). This caps the maximum credits the seller can burn per request.

## Fiat Payments (Stripe / VGS)

Buyers can pay with a credit card instead of USDC:

```typescript
const { url } = await payments.plans.orderFiatPlan(planId);
window.location.href = url; // Redirects to Stripe Checkout
```

Nevermined's sandbox uses Stripe's **test mode**. Use test card `4242 4242 4242 4242` with any future expiry and any CVC.

## A2A Discovery

The agent publishes an agent card at `/.well-known/agent.json` following the Google A2A spec with a Nevermined payment extension:

```json
{
  "name": "Auto Business Research Agent",
  "url": "https://your-app.vercel.app/api/agent/research",
  "capabilities": {
    "extensions": [{
      "uri": "urn:nevermined:payment",
      "params": { "planId": "did:nvm:...", "agentId": "did:nvm:..." }
    }]
  }
}
```

Other teams' buyer agents can discover and transact with this endpoint automatically.

## Build & Deploy

```bash
npm run build    # Production build
npm start        # Start production server
```

Deploys to **Vercel** automatically on push to `main`.

## Links

- [Nevermined App](https://nevermined.app)
- [Nevermined Docs](https://docs.nevermined.app)
- [Hackathon Repo](https://github.com/nevermined-io/hackathons)
- [x402 Protocol](https://docs.cdp.coinbase.com/x402/welcome)
