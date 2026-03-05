# Autonomous Agent Marketplace — Design Guide
### "The Agent Economy, Made Visible"
*Designed with clarity, speed, and judge impressibility in mind*

---

## On the Components You Were Sent

**Use them. Don't update them.** You have ~14 hours before code freeze. All four components — the Interactive Globe, AI Prompt Box, Glowing Effect cards, and Animated State Icons — are stable, well-structured, and exactly what you need. The only dependency worth double-checking:

```bash
npm install framer-motion motion @radix-ui/react-dialog @radix-ui/react-tooltip lucide-react
```

The `motion` package (for GlowingEffect) and `framer-motion` (for everything else) are separate — install both. Everything else is likely already in your Next.js + shadcn setup.

---

## The Design Philosophy

Think **Bloomberg Terminal meets Vercel Dashboard** — a tool that feels like it's actually running a real economy. Not a demo. Not a prototype. A live system.

**The one thing judges will remember:** A live globe with real agent transaction arcs flying between cities, a feed ticking with actual purchases happening in real-time, and numbers that keep moving. It should feel *alive*.

Steve Jobs' rule: **Every pixel is a decision. Make fewer, better decisions.** Strip everything that doesn't pull its weight. Add nothing decorative that doesn't also inform.

---

## Color System

Abandon dark-mode-first. Go **light with green intelligence** — it reads as confident, modern, and different from every other hackathon project in the room.

```css
/* globals.css — paste into your Tailwind base layer */
:root {
  /* Backgrounds — warm white, not clinical */
  --bg-base:        #F8FAF7;   /* very slightly green-tinted white */
  --bg-surface:     #FFFFFF;   /* cards, panels */
  --bg-elevated:    #F1F5F0;   /* sidebar, code blocks */
  --bg-overlay:     #E8EFE6;   /* hover states, subtle fills */

  /* Greens — your primary brand color family */
  --green-50:       #F0F9F0;
  --green-100:      #DCEFDA;
  --green-200:      #B8DFB4;
  --green-300:      #86C882;   /* globe dots */
  --green-400:      #52AD4D;   /* arc lines */
  --green-500:      #3A9435;   /* primary CTA, active states */
  --green-600:      #2D7629;   /* hover on CTA */
  --green-700:      #1F5C1C;   /* text on light bg */
  --green-900:      #0D2B0B;   /* headings, heavy text */

  /* Neutrals */
  --gray-50:        #F9FAFB;
  --gray-100:       #F3F4F6;
  --gray-200:       #E5E7EB;
  --gray-400:       #9CA3AF;
  --gray-600:       #4B5563;
  --gray-800:       #1F2937;
  --gray-900:       #111827;

  /* Semantic */
  --tx-success:     #3A9435;   /* completed transaction */
  --tx-pending:     #D97706;   /* in-flight */
  --tx-credit:      #059669;   /* money in */
  --tx-debit:       #DC2626;   /* money out */

  /* Borders */
  --border-default: #E2E8DF;
  --border-strong:  #C4D4C0;
}
```

**The rule:** Green means activity, money, success. Gray means structure. White means content. Never mix the two signals.

---

## Typography

Use **Geist** (already in Next.js by default with Vercel) for body/UI, and **DM Serif Display** for your hero headline — it reads as "serious intelligence" without being corporate.

```js
// app/layout.tsx
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
```

**Type Scale:**

| Role | Class | Usage |
|------|-------|-------|
| Hero | `font-display text-6xl tracking-tight` | One headline only |
| Section | `text-2xl font-semibold tracking-tight` | Page sections |
| Card title | `text-sm font-semibold` | Agent names, labels |
| Body | `text-sm text-gray-600` | Descriptions |
| Mono | `font-mono text-xs` | Prices, addresses, tx hashes |
| Badge | `text-[10px] font-bold uppercase tracking-widest` | Status pills |

---

## Page-by-Page Design Guide

---

### 1. The Navigation Bar

**Keep it invisible until it needs to exist.** One-line, borderless on scroll-top, gets a subtle white blur + border on scroll.

```tsx
// Behavior: transparent → frosted glass on scroll
// Height: 56px, never taller
// Left: Logo (wordmark "NVM MARKET" in mono font, green dot before it)
// Center: nothing — don't dilute
// Right: Status pill + "Connect" button

// The status pill is the most important nav element:
<div className="flex items-center gap-1.5 rounded-full border border-green-200 
                bg-green-50 px-3 py-1">
  <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
  <span className="font-mono text-xs text-green-700">
    {txCount} transactions live
  </span>
</div>
```

The live counter in the nav tells judges immediately: **this is running.**

---

### 2. Hero Section

This is the scene-setter. You have 3 seconds. Use the Interactive Globe but swap its colors to your green palette.

**Layout:** Two columns. Left = text + CTA. Right = Globe. No more than that.

```tsx
// The Globe customization for green palette:
<Globe
  size={460}
  dotColor="rgba(82, 173, 77, ALPHA)"      // --green-400
  arcColor="rgba(58, 148, 53, 0.45)"        // --green-500 at 45%
  markerColor="rgba(134, 200, 130, 1)"      // --green-300
  autoRotateSpeed={0.0015}
  connections={yourLiveConnections}         // make this dynamic!
/>
```

**Left column copy — keep it this short:**

```
[eyebrow: small caps, green-500]
AUTONOMOUS BUSINESS HACKATHON · LIVE

[headline: DM Serif Display, 56px, gray-900]
Agents That Buy.
Agents That Sell.

[subhead: 16px, gray-600, max-w-sm]
A live agent economy running on Nevermined.
Watch your agents transact — or build something 
that trades with ours.

[two CTAs]
[Primary] "View Marketplace"   → bg-green-500, white text
[Ghost]   "See Our Agent API"  → border-green-200, green-700 text
```

**Below the fold immediately:** Three stat cards — transactions, volume, unique teams transacted with. Make these **count up in real time** using a simple interval. Nothing signals "live system" faster.

```tsx
// Stat card pattern:
<div className="rounded-xl border border-border bg-white p-4 shadow-sm">
  <p className="font-mono text-3xl font-bold text-green-600">
    {count}
  </p>
  <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">
    Transactions
  </p>
</div>
```

---

### 3. Live Transaction Feed

This is your **most important section** for judges. It needs to feel like a real-time financial terminal. Place it directly below the hero — don't make them scroll far.

**Design:** A narrow left column of labels, a wide right column of scrolling rows. Each row is one transaction.

```tsx
// Transaction row anatomy:
// [green dot or orange dot] [time mono] [buyer agent name] → [seller agent name] 
//                           [tool used]  [credits]  [USDC amount]

// Example:
<div className="flex items-center gap-3 py-2.5 border-b border-gray-100
                hover:bg-green-50/40 transition-colors px-4">
  
  {/* Status dot */}
  <span className="size-2 rounded-full bg-green-500 flex-shrink-0" />
  
  {/* Time */}
  <span className="font-mono text-[11px] text-gray-400 w-14 flex-shrink-0">
    {time}
  </span>
  
  {/* Agents */}
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <span className="font-mono text-xs font-medium text-gray-800 truncate">
      {buyer}
    </span>
    <span className="text-gray-300">→</span>
    <span className="font-mono text-xs font-medium text-green-700 truncate">
      {seller}
    </span>
  </div>
  
  {/* Tool */}
  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] 
                   font-medium text-gray-600 flex-shrink-0">
    {tool}
  </span>
  
  {/* Amount */}
  <span className="font-mono text-xs font-bold text-green-600 flex-shrink-0">
    +{credits}cr
  </span>
</div>
```

**New transactions slide in from the top** — use a simple CSS `animate-slide-in` or Framer Motion `AnimatePresence`. Cap the list at 20 visible rows, let them scroll.

The section header:
```
LIVE FEED                    [pause button]   [17 transactions · last 5 min]
```

---

### 4. Agent Cards (Your Seller + Buyer)

Use the **GlowingEffect component** here — it's exactly right for this. Each agent gets a card. The glow on hover shows "this is interactive, this is alive."

**Card anatomy:**
```
┌─────────────────────────────────┐
│  [icon: robot/agent emoji]       │
│  NOVA                            │  ← agent name, all-caps mono
│  Research Agent · Seller         │  ← role badge
│                                  │
│  "Delivers deep multi-source     │
│   research with citations."      │
│                                  │
│  ─────────────────────────────── │
│  search_data      1 credit        │
│  summarize_data   5 credits       │
│  research_data    10 credits      │
│  ─────────────────────────────── │
│                                  │
│  [47 sales] [3 repeat buyers]    │
│                                  │
│  [Buy from NOVA →]               │
└─────────────────────────────────┘
```

The pricing tiers inside the card should use the Animated State Icons — specifically the **SuccessIcon** next to each completed sale count. It auto-animates and adds life to an otherwise static number.

**Color code your agents:**
- Buyer agents: left border `border-l-4 border-blue-400`  
- Seller agents: left border `border-l-4 border-green-500`
- Your main agent: left border `border-l-4 border-green-600` + GlowingEffect enabled

---

### 5. Marketplace / Discovery Section

A grid of OTHER TEAMS' agents that your buyer has transacted with. This shows judges your "Most Interconnected" story at a glance.

**Header:**
```
MARKETPLACE CONNECTIONS

[Your buyer has traded with 6 teams]  [6 green dots in a row]
```

Each partner team's agent shows as a minimal card:
- Team name
- What you bought from them
- How many credits spent
- A small sparkline or just the number "3 purchases"

The visual trick: draw a **simple SVG connection line** from YOUR agent card to each partner card, faintly in green. It mirrors the globe arcs above and makes the interconnection literal.

---

### 6. Economic Logic Section (ROI Story)

This is where you win Best Autonomous Buyer. One clean section explaining WHY your buyer makes decisions. Not a wall of text — a visual decision tree.

```
HOW OUR BUYER DECIDES

[Step 1: Discover]     [Step 2: Evaluate]    [Step 3: Buy / Switch]
Query /pricing         Score quality          Buy cheapest high-quality
on 6+ sellers          vs. price ratio        Switch if ROI drops
      ↓                      ↓                       ↓
[Animated State:        [Animated State:       [Animated State:
 DownloadDoneIcon]       SuccessIcon]           ToggleIcon]
```

Use the **Animated State Icons** as the visual metaphors for each step. They auto-animate, so this section has life with zero extra code.

---

### 7. The AI Prompt Box (Optional Feature)

If you build any kind of "Try our agent" feature — where a visitor can submit a query and watch it get routed through your buyer → seller chain — the **AI Prompt Box** component is perfect. Drop it at the bottom above the footer.

```
TRY THE ECONOMY

Ask anything. Our buyer agent will find the best seller, 
pay them in credits, and return you the result.

[AI Prompt Box component here]

[Below it: last 3 queries + which agent answered + cost]
```

This is a judge magnet. If they can type something and see a live transaction happen in the feed above, you win the demo.

---

## Component Placement Map

```
page.tsx (homepage)
├── <Nav />                          — always visible
├── <HeroSection />
│   ├── Left: headline + CTAs
│   └── Right: <Globe /> (green palette)
├── <StatsBar />                     — 3 live counters
├── <TransactionFeed />              — live scrolling rows
├── <AgentCards />                   — GlowingEffect on each
│   ├── <YourSellerCard />
│   └── <YourBuyerCard />
├── <MarketplaceConnections />       — partner team grid
├── <DecisionLogic />                — AnimatedStateIcons step flow
├── <TryIt />                        — PromptInputBox (if time allows)
└── <Footer />                       — minimal, mono font
```

---

## Spacing Rules

The system uses **4px base unit**, multiples of 4 only:

| Space | Value | Use |
|-------|-------|-----|
| `gap-1` | 4px | Tight label pairs |
| `gap-2` | 8px | Icon + label |
| `gap-4` | 16px | Inside cards |
| `gap-6` | 24px | Between card elements |
| `gap-8` | 32px | Between sections within a page area |
| `gap-16` | 64px | Between major page sections |
| `gap-24` | 96px | Hero breathing room |

**Padding inside cards:** always `p-5` or `p-6`. Never `p-3` — it reads cheap.

**Max content width:** `max-w-6xl` centered. The globe can bleed slightly outside on large screens.

---

## Motion Principles

**Rule 1: Only animate things that change.** Don't add hover animations to static content just to add life. Animate the transaction feed, the stat counters, and the globe arcs.

**Rule 2: Duration budget.** Page load animations: 400ms max. Hover transitions: 150-200ms. Feed items sliding in: 300ms.

**Rule 3: One wow moment.** On page load, have the globe fade in and start rotating, then have 2-3 arc animations "draw" themselves in sequence over 1.5 seconds. Everything else fades in below at staggered 50ms delays. That's the whole movie.

```tsx
// Page load stagger pattern:
const sections = ["hero", "stats", "feed", "agents"];
sections.forEach((section, i) => {
  // animation-delay: ${i * 100}ms
});
```

---

## The Demo Day Checklist

**Before you present, verify:**
- [ ] Globe is rotating and showing green arcs
- [ ] Transaction feed has at least 5 real transactions and is updating
- [ ] Stat counters show non-zero numbers and are live
- [ ] Agent cards show real transaction counts from Nevermined
- [ ] At least 2 partner team agents visible in Marketplace section
- [ ] The "Try It" prompt box (if built) routes a real query
- [ ] On mobile: hero stacks, globe shrinks gracefully, feed is readable

**The opening line of your 3-minute demo:**
> "This is a live agent economy. Every number you see is real. Let me show you what's happened in the last hour."

Then point at the feed. Then show the globe. Then explain the decision logic. Then do a live query if you have it. Done.

---

## Quick Copy-Paste Tailwind Classes

```tsx
// Primary button
"bg-green-500 hover:bg-green-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"

// Ghost button  
"border border-green-200 hover:border-green-400 text-green-700 hover:text-green-800 font-medium text-sm px-4 py-2 rounded-lg transition-colors bg-transparent"

// Section header
"text-xs font-bold uppercase tracking-widest text-gray-400 mb-4"

// Card base
"rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"

// Status badge: live
"inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[10px] font-bold text-green-700 uppercase tracking-widest"

// Mono value (prices, counts)
"font-mono text-sm tabular-nums"

// Transaction amount: credit
"font-mono text-xs font-bold text-green-600"

// Transaction amount: debit
"font-mono text-xs font-bold text-red-500"
```

---

## What to Skip (Time Budget)

Given you have today + tomorrow morning, **do not build:**
- Dark mode toggle — ship light only
- Mobile-specific layouts — good responsive Tailwind will handle it
- Animations on every hover — only the feed, globe, and stat counters
- Custom illustrations — the globe IS your hero illustration

**Ship this instead:**
- Globe ✅
- Live feed ✅  
- Agent cards with GlowingEffect ✅
- Stat counters ✅
- Decision logic section ✅

That's a winning submission.
