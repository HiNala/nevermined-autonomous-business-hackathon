# ZeroClick — AI-Native In-Chat Advertising

**Prize track:** $2,000 for best ZeroClick + Nevermined integration  
**Contact:** developers@zeroclick.ai  
**API Dashboard:** https://developer.zeroclick.ai  
**Docs:** https://developer.zeroclick.ai/docs

---

## What Is ZeroClick

ZeroClick is the ad platform for AI. Instead of banner ads or interstitials, ZeroClick weaves **paid context directly into AI responses** — contextually matched offers that appear inline within AI-generated content. Founded by the Honey co-founder ($4B acquisition), ZeroClick raised $55M to build this category.

**For us:** When a user runs the research pipeline or gets a report, ZeroClick delivers a relevant sponsored offer inline at the bottom of the output — clearly labeled "Sponsored", text-based, and contextually matched to the research topic. No cookies, no banners.

---

## How It Works

```
User submits query
    ↓
Pipeline runs (Strategist → Researcher)
    ↓
Research report generated
    ↓
ZeroClick API called server-side with report topic as query
    ↓
Contextually matched offer returned (1 offer per response)
    ↓
Ad rendered inline at bottom of report — above citations
    ↓
Impression tracked from client browser (no auth required)
```

---

## API Reference

**Base URL:** `https://zeroclick.dev`

### Authentication

All requests to `/api/v2/offers` require the API key header:
```
x-zc-api-key: your-api-key
```

Get your key at the [Developer Dashboard](https://developer.zeroclick.ai) → App API Keys → Create API Key.

The impressions endpoint (`/api/v2/impressions`) does **NOT** require authentication.

---

### Endpoint 1: Fetch Offers

**`POST https://zeroclick.dev/api/v2/offers`**

#### Request Headers
| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | Yes | `application/json` |
| `x-zc-api-key` | Yes | Your API key from dashboard |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | `"server"` \| `"client"` | Yes | Use `"server"` for backend calls; `"client"` for browser-direct |
| `ipAddress` | string | Required when `method="server"` | Client's real IP address |
| `query` | string \| null | Recommended | Context for ad matching — use the user's topic, brief title, or chat content |
| `limit` | number | No | Number of offers to return (default: 1, max: ~3) |
| `userAgent` | string | No (recommended) | Client user-agent string |
| `userId` | string | No | Stable user identifier for personalisation |
| `userSessionId` | string | No | Session-scoped identifier |
| `userLocale` | string | No | e.g. `"en-US"` |
| `userEmailSha256` | string | No | SHA-256 hashed email (privacy-safe) |
| `userPhoneNumberSha256` | string | No | SHA-256 hashed phone number |
| `groupingId` | string | No | Groups multiple ad slots on same page |
| `signals` | array | No | Real-time IAB interest signals (see below) |

#### Server-Side Example (our pattern)
```typescript
const response = await fetch("https://zeroclick.dev/api/v2/offers", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-zc-api-key": process.env.ZEROCLICK_API_KEY!,
  },
  body: JSON.stringify({
    method: "server",
    ipAddress: clientIpAddress,     // required — extract from x-forwarded-for
    userAgent: clientUserAgent,     // recommended
    query: "AI agent payment infrastructure and blockchain transactions",
    limit: 1,
  }),
});
const offers = await response.json();
```

#### Client-Side Example (public/restricted key)
```typescript
const response = await fetch("https://zeroclick.dev/api/v2/offers", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-zc-api-key": "your-public-api-key",
  },
  body: JSON.stringify({
    method: "client",
    query: "best running shoes",
    limit: 1,
  }),
});
```

#### Response Schema
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Scale AI Infrastructure",
    "subtitle": "Enterprise-grade agent hosting",
    "content": "Deploy production AI agents with auto-scaling, monitoring, and 99.9% uptime SLA.",
    "cta": "Get Started Free",
    "clickUrl": "https://zero.click/1234abcd",
    "imageUrl": "https://example.com/brand-logo.jpg",
    "brand": {
      "name": "Cloudflare Workers AI",
      "url": "https://cloudflare.com"
    },
    "price": {
      "amount": "0.00",
      "currency": "USD"
    }
  }
]
```

#### TypeScript Type
```typescript
interface ZeroClickOffer {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  cta: string;
  clickUrl: string;
  imageUrl: string;
  brand: { name: string; url: string };
  price: { amount: string; currency: string };
}
```

---

### Endpoint 2: Track Impressions

**`POST https://zeroclick.dev/api/v2/impressions`**

> **Important:** Must be called **from the client browser**, not from a server/serverless function. This is how ZeroClick rate-limits per user IP. No authentication required.

#### Request Body
```json
{
  "ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
}
```

#### Example (call this in the browser after rendering the ad)
```typescript
// Call this client-side after the ad becomes visible
await fetch("https://zeroclick.dev/api/v2/impressions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ids: offers.map(offer => offer.id),
  }),
});
```

---

### Real-Time Signals (Optional — improves targeting)

Pass signals with your offers request to improve contextual matching using the IAB Content Taxonomy 2.2:

```typescript
body: JSON.stringify({
  method: "server",
  ipAddress: clientIpAddress,
  query: "AI agent payment infrastructure",
  limit: 1,
  signals: [
    {
      category: "interest",       // "interest" | "intent" | "behavior"
      confidence: 0.9,            // 0.0 to 1.0
      subject: "Artificial Intelligence",
      relatedSubjects: ["Web3", "Autonomous Agents", "Payments", "USDC"],
      sentiment: "positive",      // "positive" | "neutral" | "negative"
      iab: {
        type: "content",
        version: "2.2",
        ids: ["607"]              // IAB taxonomy category IDs
      }
    }
  ]
})
```

---

## Integration Patterns

### Pattern A: Server Proxy (Our Implementation — Recommended)

Keeps the API key secure on the backend. Client never sees the key.

```
Browser → POST /api/ads/offers (Next.js route) → ZeroClick API
                                                  → offer returned
Browser ← offer data ←─────────────────────────────────────────
Browser → POST https://zeroclick.dev/api/v2/impressions (direct, no auth)
```

**Next.js API route (`/api/ads/offers`):**
```typescript
export async function POST(request: Request) {
  const apiKey = process.env.ZEROCLICK_API_KEY;
  if (!apiKey) return new NextResponse(null, { status: 204 }); // graceful no-op

  const { query, userAgent } = await request.json();
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

  const response = await fetch("https://zeroclick.dev/api/v2/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-zc-api-key": apiKey },
    body: JSON.stringify({ method: "server", ipAddress, userAgent, query, limit: 1 }),
  });

  if (!response.ok) return new NextResponse(null, { status: 204 });
  const [offer] = await response.json();
  return offer ? NextResponse.json(offer) : new NextResponse(null, { status: 204 });
}
```

### Pattern B: Client-Side (Simpler, exposes public key)

Only appropriate if you use a restricted/public API key. No proxy needed but less control.

---

## Our Implementation

### Files

| File | Purpose |
|------|---------|
| `src/app/api/ads/offers/route.ts` | Server-side proxy. Accepts `{ query, userAgent }`, extracts client IP from headers, returns single offer. Returns `204` if no API key (graceful). |
| `src/components/ui/zeroclick-ad.tsx` | React client component. Fetches offer on mount, renders inline card, tracks impression, respects global mute + per-ad dismiss. |

### Where Ads Appear

Ads are injected **inside the research report output** in the Studio — specifically at the bottom of the main content sections, before the citations/sources list. They're clearly labeled "Sponsored" with a dismiss `×` button per-ad.

### Mute Toggle

A global mute toggle (`🔇 Ads`) lives in the Studio UI header area. When muted:
- No ZeroClick API requests are made
- Existing ads are hidden immediately  
- State persists in `localStorage` under key `zc_ads_muted`

Use this during demos if you don't have an API key yet or want to disable ads temporarily.

### Environment Variables

```bash
# .env.local
ZEROCLICK_API_KEY=your-api-key-from-developer-dashboard
```

When `ZEROCLICK_API_KEY` is not set, the proxy route returns `204` and the `ZeroClickAd` component renders nothing. Zero UI impact — fully graceful.

---

## Nevermined + ZeroClick Hackathon Integration

The prize pitch for best ZeroClick + Nevermined integration:

1. User runs research pipeline → research report appears
2. ZeroClick delivers a contextually matched ad inline in the report
3. The impression is recorded as a micro-payment event in the Nevermined transaction ledger
4. Advertisers can bid for the ad slot by purchasing credits on a Nevermined payment plan
5. The ad slot price (credits per impression) adjusts dynamically based on advertiser demand

**Flow:**
```
Advertiser → purchases Nevermined plan credits (e.g. 1 credit per impression)
    ↓
User runs pipeline → ZeroClick ad shown → impression tracked
    ↓
Nevermined settles: advertiser credits → pipeline operator earnings
    ↓
Repeat: higher-demand topics → higher credit bids → self-optimising auction
```

This creates a **pay-per-impression agent monetization loop** entirely on Nevermined's credit infrastructure — no direct fiat rails needed for the demo.

---

## Quick Setup (5 minutes)

```bash
# 1. Get API key
#    → https://developer.zeroclick.ai
#    → Sign up → App API Keys → Create API Key

# 2. Add to .env.local
echo "ZEROCLICK_API_KEY=your-key-here" >> .env.local

# 3. Restart dev server
npm run dev

# 4. Open /studio, run any pipeline query
#    → Ads appear automatically in the research output
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No ads appearing | Check `ZEROCLICK_API_KEY` is set in `.env.local` |
| 401 Unauthorized | Verify `x-zc-api-key` header is present and key is correct |
| Impressions not tracking | Ensure impression fetch is from browser, not server |
| Ad not relevant | Pass a more specific `query` string matching the content |
| Rate limit errors | Contact developers@zeroclick.ai for limit increases |

---

## Links

- Dashboard: https://developer.zeroclick.ai
- Docs: https://developer.zeroclick.ai/docs
- Integration guide: https://developer.zeroclick.ai/docs/integration-guide
- Offers API reference: https://developer.zeroclick.ai/docs/offers/rest-api
- Ad format explorer: https://labs.zeroclick.ai/ad-formats
- Support: developers@zeroclick.ai
