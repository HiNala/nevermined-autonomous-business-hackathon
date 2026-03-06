# VGS Payment Integration — Auto-Business

## Overview

[Very Good Security (VGS)](https://www.verygoodsecurity.com/) provides PCI-compliant secure iframes that let users enter card details directly on our site. Card data never touches our servers — VGS intercepts it, tokenizes it, and forwards it to Stripe via their outbound proxy.

This gives us a **self-hosted checkout** experience (no Stripe redirect) while remaining fully PCI DSS compliant.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (our Next.js app)                              │
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │  VGS Collect.js Secure iFrames          │            │
│  │  ┌──────────┐ ┌────────┐ ┌───────────┐ │            │
│  │  │ Card No. │ │ Exp    │ │ CVC       │ │            │
│  │  └──────────┘ └────────┘ └───────────┘ │            │
│  └────────────────┬────────────────────────┘            │
│                   │ form.submit()                       │
│                   ▼                                     │
│  ┌─────────────────────────────────────────┐            │
│  │  VGS Vault (inbound proxy)              │            │
│  │  Tokenizes PAN → alias tok_xxxx         │            │
│  └────────────────┬────────────────────────┘            │
│                   │                                     │
│                   ▼                                     │
│  ┌─────────────────────────────────────────┐            │
│  │  Our API: /api/vgs/process-payment      │            │
│  │  Receives aliased card data             │            │
│  │  Forwards to Stripe via VGS outbound    │            │
│  │  proxy to create PaymentMethod +        │            │
│  │  PaymentIntent                          │            │
│  └────────────────┬────────────────────────┘            │
│                   │                                     │
│                   ▼                                     │
│  ┌─────────────────────────────────────────┐            │
│  │  Stripe API                             │            │
│  │  Creates PaymentMethod from real PAN    │            │
│  │  Charges via PaymentIntent              │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Frontend — `@vgs/collect-js-react`
- React wrapper around VGS Collect.js
- Renders secure iframes for card-number, expiration, CVC
- Card data **never** enters our DOM or JS scope
- Submits tokenized aliases to our API route

### 2. API Routes
| Route | Method | Description |
|---|---|---|
| `/api/vgs/config` | GET | Returns vault ID + environment for client init |
| `/api/vgs/process-payment` | POST | Receives aliased card data, creates Stripe PaymentIntent via VGS outbound proxy |

### 3. Environment Variables

```bash
# VGS Configuration
NEXT_PUBLIC_VGS_VAULT_ID=tnt_your_vault_id    # VGS vault identifier (public, safe for client)
VGS_ENVIRONMENT=sandbox                         # sandbox | live
VGS_PROXY_USERNAME=your_proxy_username          # For outbound proxy to Stripe
VGS_PROXY_PASSWORD=your_proxy_password          # For outbound proxy to Stripe

# Stripe Configuration (for payment processing)
STRIPE_SECRET_KEY=sk_test_your_key              # Stripe secret key (server-only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Stripe publishable key (client)
```

## Integration Points in Auto-Business

### Buy Credits (Studio page)
Users click "Buy Credits" → modal opens with VGS secure form → payment processes → credits added to session.

### Buy from Store (Store page)
Users click "Purchase" on an agent listing → checkout modal with VGS form → payment + delivery.

## Setup Steps

### 1. Create VGS Account
1. Go to https://dashboard.verygoodsecurity.com
2. Create a new vault (sandbox for testing)
3. Note your `vault_id` (format: `tntxxxxxxxx`)

### 2. Configure Inbound Route
1. In VGS Dashboard → Routes → Inbound
2. Add filters for `card-number`, `card-expiration-date`, `card-security-code`
3. Operation: **Redact** (tokenize on the way in)

### 3. Configure Outbound Route
1. In VGS Dashboard → Routes → Outbound
2. Upstream host: `api.stripe.com`
3. Add filters to **Reveal** the tokenized fields before forwarding to Stripe
4. Note the proxy credentials (username/password)

### 4. Create Stripe Account
1. Go to https://dashboard.stripe.com
2. Get your `sk_test_` and `pk_test_` keys
3. No products/prices needed — we use PaymentIntents directly

### 5. Install Packages
```bash
npm install @vgs/collect-js-react @vgs/collect-js stripe
```

### 6. Add Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_VGS_VAULT_ID=tntxxxxxxxx
VGS_ENVIRONMENT=sandbox
VGS_PROXY_USERNAME=USxxxxxxxxxx
VGS_PROXY_PASSWORD=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
```

## Testing

### Test Card Numbers
| Card | Number |
|---|---|
| Visa (success) | `4111 1111 1111 1111` |
| Visa (success) | `4242 4242 4242 4242` |
| Mastercard | `5555 5555 5555 4444` |
| Decline | `4000 0000 0000 0002` |

Use any future expiry (e.g., `12/30`) and any 3-digit CVC.

## Security Notes
- Card data **never** touches our servers — VGS iframes isolate it completely
- Our API only receives VGS aliases (e.g., `tok_sandbox_xxxx`)
- VGS outbound proxy reveals real PAN only when forwarding to Stripe
- This architecture is PCI DSS Level 1 compliant via VGS
- No card data is stored in our database or logs

## Demo Mode
When `NEXT_PUBLIC_VGS_VAULT_ID` is not set, the checkout UI shows a demo mode badge and simulates successful payments without actually charging. This allows the app to work at hackathons/demos without real payment credentials.
