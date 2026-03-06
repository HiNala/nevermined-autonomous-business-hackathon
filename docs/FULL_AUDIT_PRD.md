# Undermind — Full Product Audit & PRD

> **Date:** March 5, 2025
> **Scope:** Complete codebase audit — agents, API routes, UI pages, settings, infrastructure, UX, design tokens, contracts
> **Method:** Every file read and evaluated through the lens of the world's greatest software and UX designers

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scorecard — Every Feature Rated 1–10](#2-scorecard)
3. [How to Get Everything to 10/10](#3-how-to-get-everything-to-1010)
4. [Bugs & Must-Fix Issues](#4-bugs--must-fix-issues)
5. [Functional Gaps](#5-functional-gaps)
6. [UX & Design Audit](#6-ux--design-audit)
7. [Agent-by-Agent Deep Dive](#7-agent-by-agent-deep-dive)
8. [Infrastructure & Code Quality](#8-infrastructure--code-quality)
9. [New Agent Ideas & Use Cases](#9-new-agent-ideas--use-cases)
10. [Legendary Design Interrogation](#10-legendary-design-interrogation)
11. [Priority Roadmap](#11-priority-roadmap)

---

## 1. Executive Summary

Undermind is a **multi-agent AI studio** with four specialist agents (Strategist, Researcher, Buyer, Seller) that collaborate through a pipeline to produce structured deliverables (research reports, PRDs, strategic plans, market analyses). It integrates Nevermined for payments, supports internal credit trading between agents, external marketplace procurement, and a storefront where external buyers can purchase AI-generated outputs.

**What's working well:**
- Clean separation of agent logic into individual modules
- Robust pipeline orchestration with event emission, completeness evaluation, and follow-up research rounds
- Well-structured trading toggle system (internal/external/seller)
- Product catalog with prompt-backed on-the-fly generation
- Multi-provider AI support (OpenAI, Gemini, Anthropic) with automatic fallback
- Multi-provider search/scrape (Exa, Apify, DuckDuckGo, raw) with per-agent configuration
- SSE real-time event streaming for transactions and agent events
- Polished dark mode UI with glass morphism design system
- New light mode CSS tokens (just added)
- Rate limiting, input validation, error sanitization
- Copy/download markdown for briefs and documents

**What needs work:**
- Seller agent is fully built on the backend but barely wired into the Studio UI
- Several "three agent" references need updating to "four"
- No light/dark mode toggle mechanism exists yet (tokens are defined but no switcher)
- Long pipeline runs give users a static spinner with no real-time progress in Studio
- Store page missing navigation chrome
- Duplicate type definitions across files
- No session persistence — results lost on refresh

---

## 2. Scorecard

Every feature rated 1–10. Ten is world-class, shipping-ready, delightful.

| # | Feature / Area | Score | Summary |
|---|---------------|-------|---------|
| 1 | **Strategist Agent** | 8/10 | Solid structured brief generation. Doesn't use its own search/scrape settings yet. |
| 2 | **Researcher Agent** | 9/10 | Excellent 5-path fallback chain, completeness evaluation, follow-up rounds. Near-perfect. |
| 3 | **Buyer Agent** | 7/10 | Works but silent on failures. No standalone UI mode. No toolSettings in its API route. |
| 4 | **Seller Agent** | 7/10 | Backend is complete and impressive. AI decision engine is smart. But not in Studio UI. |
| 5 | **Pipeline Orchestration** | 8/10 | Clean event emission, trading toggles, multi-iteration. Missing SSE during execution. |
| 6 | **Product Catalog / Inventory** | 8/10 | 6 well-defined products, third-party service support, import API exists and works. |
| 7 | **Nevermined Integration** | 7/10 | x402 payment verification and settlement built. Hard to test without live credentials. |
| 8 | **Settings Panel** | 9/10 | All 4 agents + 3 trading toggles + API key status. Beautiful and functional. |
| 9 | **Tool Settings System** | 9/10 | Clean interface, localStorage persistence, defaults with merge, threaded through pipeline. |
| 10 | **Studio Page — Layout** | 7/10 | Good split-pane IDE-style layout. Missing Seller agent card and mode. |
| 11 | **Studio Page — Input UX** | 8/10 | Textarea with Enter submit, output type selector, mode switching, example prompts. |
| 12 | **Studio Page — Output Display** | 8/10 | Tabbed document/brief/purchases view. Copy and download buttons. Markdown renderer. |
| 13 | **Studio Page — Loading State** | 6/10 | Animated spinner with stage labels, but no real-time SSE updates during execution. |
| 14 | **Research Page** | 8/10 | Standalone researcher with depth/provider/tool selection, SSE event log, query params. |
| 15 | **Store Page** | 7/10 | Product cards, order modal, result view with reasoning. Missing Nav/Footer. |
| 16 | **Home Page / Landing** | 7/10 | Hero with input CTA, agent cards, services, FAQ. Says "Three" agents. |
| 17 | **Navigation** | 8/10 | Clean nav with mobile hamburger, live transaction count pill, all routes linked. |
| 18 | **Dark Mode Design Tokens** | 9/10 | Well-organized CSS custom properties, glass system, gradients, animations. |
| 19 | **Light Mode Design Tokens** | 5/10 | Tokens defined but no toggle mechanism. Placeholder color won't work in light. |
| 20 | **Mobile Responsiveness** | 6/10 | Sidebar collapse works, but fixed widths and modals may clip on small screens. |
| 21 | **Security** | 7/10 | Rate limiting, input validation, error sanitization. In-memory only, no auth. |
| 22 | **Error Handling** | 6/10 | Errors show as text. No retry buttons, no failure context, no stage trace. |
| 23 | **API Design** | 8/10 | RESTful, consistent response shapes, rate limited, SSE for streaming. |
| 24 | **Type Safety** | 6/10 | Interfaces defined but duplicated across files instead of shared. |
| 25 | **OG / SEO Metadata** | 6/10 | Layout has OG tags but says "Three specialist AI agents" — needs update. |
| 26 | **Accessibility** | 4/10 | Missing ARIA labels, keyboard navigation, focus management, screen reader support. |
| 27 | **Performance** | 7/10 | No unnecessary re-renders, useMemo/useCallback used. No code splitting though. |
| 28 | **Testing** | 1/10 | No tests exist. No unit tests, no integration tests, no E2E tests. |
| 29 | **Documentation** | 5/10 | Sponsor tools guide and design guide exist. No API docs, no README for running locally. |
| 30 | **Deployment Readiness** | 7/10 | Builds clean, all routes compile. Env vars documented in settings status. |

**Overall Score: 7.0 / 10** — Solid foundation with impressive agent architecture. Needs UI completion for the Seller agent, UX polish for loading states, accessibility work, testing, and some copy fixes to reach world-class.

---

## 3. How to Get Everything to 10/10

Plain English instructions for every item that isn't a 10.

### Strategist Agent (8 → 10)

**What's missing:** The Strategist has `toolSettings.strategist.search` and `toolSettings.strategist.scrape` plumbed through but never uses them. It also doesn't have a visible "Strategist mode" presence in the pipeline desc that acknowledges it's agent 1 of 4.

**How to fix it:**
1. Add an optional "context enrichment" step in `strategist.ts` where, before generating the brief, the Strategist does a quick web search using its configured search provider to gather real-time context about the topic. This makes the brief grounded in current data instead of purely LLM knowledge.
2. Add a flag `enrichWithSearch: boolean` (default false) to the strategist's tool settings or as a UI toggle.
3. Show the Strategist's configured provider in the brief metadata.

### Researcher Agent (9 → 10)

**What's missing:** Users can't see which search/scrape provider was actually used (especially after fallback). The research page doesn't have a download button like the Studio now does.

**How to fix it:**
1. Add `searchProviderUsed` and `scrapeProviderUsed` fields to the `ResearchDocument` return type.
2. Show these in the document header metadata bar (e.g., "exa/apify · 5cr · 12.3s").
3. Add a Download .md button to the research page's `DocumentView` component (the Studio version already has it).

### Buyer Agent (7 → 10)

**What's missing:** No standalone UI mode in Studio. No `toolSettings` in its API route. Silent on why it returned empty (not configured vs no matches vs budget exceeded). Can't be clicked in the sidebar — `onClick` is `() => {}`.

**How to fix it:**
1. Add `toolSettings` to the buyer route's `RequestBody` interface and pass it through to `runBuyer`.
2. Return a `reason` field in the buyer response: `"not_configured" | "no_matches" | "budget_exceeded" | "disabled"`.
3. In the Studio sidebar, make the Buyer card clickable to show a standalone buyer mode that lets users search the Nevermined marketplace directly.
4. Add `"buyer"` to the `ViewMode` type and add buyer example prompts and EmptyState config.

### Seller Agent (7 → 10)

**What's missing:** The Seller is fully functional on the backend but invisible in the Studio UI — no sidebar card, no mode, no stats, no example prompts.

**How to fix it:**
1. Add Seller to `initialStats` and `agentStats` in `studio-page.tsx`.
2. Add a Seller `AgentCard` in the sidebar after the Buyer, with the pipeline arrow connector.
3. Add `"seller"` to the `ViewMode` type.
4. Add seller example prompts to `EXAMPLE_PROMPTS`.
5. Add seller config to the `EmptyState` config object.
6. Update the mode indicator to handle seller mode.
7. Update the `LoadingSkeleton` status text for seller mode (e.g., "Seller Fulfilling").
8. Include `maxCredits` in the seller's AI decision prompt so it can factor budget into reasoning.

### Pipeline Orchestration (8 → 10)

**What's missing:** Studio runs synchronously — user sees a spinner for 3-7 minutes with no real-time updates. Events only populate after the response returns.

**How to fix it:**
1. During `handleSubmit` in studio-page, open an `EventSource` to `/api/agent/events` BEFORE making the POST request.
2. As pipeline stages fire events on the server, they'll stream to the UI in real-time.
3. Close the EventSource when the POST response returns.
4. This gives users live "Strategist working… Researcher searching… Buyer discovering…" updates instead of a static spinner.

### Product Catalog (8 → 10)

**What's missing:** No search/filter on the Store page. No way to add custom products from the UI.

**How to fix it:**
1. Add a search input and category filter dropdown to the Store page header.
2. Add a "Custom Request" product card that lets users describe what they need without matching to a predefined product.

### Nevermined Integration (7 → 10)

**What's missing:** Hard to verify without live credentials. No health check endpoint.

**How to fix it:**
1. Add a `/api/health/nevermined` endpoint that checks if the NVM client can connect and returns status.
2. Show Nevermined connection status in the Settings panel alongside API key status.
3. Add a "Test Payment" button in dev mode that simulates a payment flow.

### Studio Layout (7 → 10)

**What's missing:** Seller not shown. Left pane is 380px which can feel cramped on 1366px screens.

**How to fix it:**
1. Add the Seller AgentCard (see Seller Agent section above).
2. Make the left pane width responsive — 320px on medium screens, 380px on large.
3. Add a drag-to-resize handle between left and right panes (nice-to-have).

### Loading State (6 → 10)

**What's missing:** No real-time progress. No cancel button. No elapsed timer. No estimated time remaining.

**How to fix it:**
1. Wire SSE events during pipeline execution (see Pipeline section).
2. Add an elapsed time counter that starts when the user submits.
3. Add a "Cancel" button that uses `AbortController` to abort the fetch and sends a cancel signal to the server.
4. Show estimated time remaining based on which stage is active (Strategist ~30s, Researcher ~60-120s, Buyer ~30s).

### Research Page (8 → 10)

**What's missing:** No download button. No history of past queries.

**How to fix it:**
1. Add a Download .md button to the DocumentView header (like Studio has).
2. Store the last 5 research results in localStorage. Show them as clickable cards in the empty state.

### Store Page (7 → 10)

**What's missing:** No `<Nav />` or `<Footer />`. No search/filter. No order time estimate. No order history.

**How to fix it:**
1. Add `<Nav />` at the top and `<Footer />` at the bottom of the StorePage component.
2. Add a search input that filters products by name, description, and tags.
3. Show an estimated completion time in the order modal (e.g., "Usually 3–5 minutes").
4. Store completed orders in localStorage and show them in an "Order History" section.

### Home / Landing Page (7 → 10)

**What's missing:** Hero says "Three specialist agents" (should be four). Agent cards grid uses 3 columns for 4 agents.

**How to fix it:**
1. Change "Three specialist agents" to "Four specialist agents" in `hero-section.tsx` line 67.
2. Change `agent-cards.tsx` grid from `md:grid-cols-3` to `md:grid-cols-2 lg:grid-cols-4`.
3. Update the Services page tagline from "Three structured deliverables" to reflect the 4-agent, 6-product reality.

### Light Mode (5 → 10)

**What's missing:** CSS tokens are defined in `.light` class but there's no mechanism to toggle it. Placeholder color is hardcoded white-alpha. Several hardcoded rgba values throughout components won't adapt.

**How to fix it:**
1. Create a `ThemeProvider` component that reads `localStorage` preference and toggles the `.light` class on `<html>`.
2. Add a theme toggle button (sun/moon icon) in the Nav bar.
3. Update `::placeholder` in globals.css to use a CSS variable: `color: var(--gray-400)`.
4. Update `::selection` background to use `var(--accent-300)` instead of hardcoded green rgba.
5. Audit all inline `style={{ background: "rgba(255,255,255,0.xx)" }}` — replace with CSS variables where possible so they adapt in light mode.
6. Update `.glass-nav` background from hardcoded dark rgba to a CSS variable.
7. Update `.glass-pill` to use `var(--accent-*)` tokens instead of hardcoded green.
8. Update `.geo-radial-hero` gradients to adapt in light mode.
9. Update scrollbar thumb colors to use CSS variables.

### Mobile Responsiveness (6 → 10)

**What's missing:** Settings panel is fixed 360px and clips on phones. Store order modals may overflow. Studio sidebar at 380px takes full width on tablets.

**How to fix it:**
1. Make the Settings panel `w-full sm:w-[360px]` so it goes full-width on mobile.
2. Add `max-h-[90vh]` and `overflow-y-auto` to all modal wrappers.
3. Make the Studio left pane `w-full lg:w-[380px]` with proper z-indexing on mobile.
4. Test all pages at 375px, 768px, and 1024px viewports.

### Security (7 → 10)

**What's missing:** No authentication. Rate limiting is in-memory only. No CORS configuration.

**How to fix it:**
1. Add API key authentication for the inventory POST endpoint (currently anyone can add products).
2. For production, move rate limiting to Redis or an edge-level solution.
3. Add CORS headers to API routes that external buyers will call.
4. Add Content-Security-Policy headers in `next.config.ts`.

### Error Handling (6 → 10)

**What's missing:** Errors show as a single red text line. No retry mechanism. No failure context.

**How to fix it:**
1. Create an `ErrorCard` component with: error message, retry button, which stage failed, elapsed time, and a suggestion (e.g., "Try switching to a different AI provider").
2. On pipeline errors, include the last successful stage in the error response so the UI can show "Failed at Researcher stage after 45s".
3. Add automatic retry with exponential backoff for transient failures (network timeouts, rate limits).

### Type Safety (6 → 10)

**What's missing:** `ResearchSource`, `ResearchDocument`, `StructuredBrief`, `AgentTransaction`, `PipelineEvent`, `PurchasedAsset` are all re-defined locally in `studio-page.tsx` and `research-page.tsx` instead of imported from a shared module.

**How to fix it:**
1. Create `src/types/pipeline.ts` that exports all pipeline-related interfaces.
2. Import from this shared module in `studio-page.tsx`, `research-page.tsx`, `store-page.tsx`, and API routes.
3. Merge `AGENT_CONFIG` (from studio-page) and `AGENT_PROFILES` (from transactions.ts) into a single source of truth at `src/lib/agent/config.ts`.

### OG / SEO (6 → 10)

**What's missing:** Layout metadata says "Three specialist AI agents." No per-page metadata.

**How to fix it:**
1. Update `layout.tsx` OG description to "Four specialist AI agents."
2. Add `metadata` exports to each page file (`studio/page.tsx`, `store/page.tsx`, `research/page.tsx`, etc.) with page-specific titles and descriptions.
3. Add a favicon and OG image.

### Accessibility (4 → 10)

**What's missing:** Almost no ARIA attributes. No keyboard navigation for agent cards. No focus rings. No skip-to-content link. No screen reader announcements for loading states.

**How to fix it:**
1. Add `aria-label` to all icon-only buttons (sidebar toggle, send, settings gear, close).
2. Add `role="status"` and `aria-live="polite"` to loading indicators and pipeline stage updates.
3. Add visible focus rings using `focus-visible:ring-2 focus-visible:ring-[var(--accent-300)]`.
4. Add a skip-to-content link at the top of each page.
5. Make all agent cards keyboard-navigable with proper `tabIndex` and `onKeyDown` Enter/Space handlers.
6. Add `aria-expanded` to the settings panel trigger and event log toggle.
7. Add `aria-selected` to tab buttons (rightTab, bottomTab).

### Performance (7 → 10)

**What's missing:** No code splitting. All pages load the full bundle. No image optimization.

**How to fix it:**
1. Use Next.js dynamic imports for heavy components (Globe, framer-motion animations).
2. Add `loading.tsx` skeletons for each page route.
3. Move heavy computation (markdown parsing) into `useMemo`.
4. Add `next/image` for any images (currently none, but future-proof).

### Testing (1 → 10)

**What's missing:** Zero tests.

**How to fix it:**
1. Add Vitest or Jest as the test runner.
2. **Unit tests** for:
   - `tool-settings.ts` — load/save with various localStorage states
   - `security.ts` — validateInput, validateQuery, checkRateLimit, sanitizeError
   - `transactions.ts` — TransactionLedger.record, stats aggregation
   - `inventory.ts` — Catalog CRUD, findProducts, importServices
   - `seller.ts` — planFulfillment with mock AI responses
3. **Integration tests** for:
   - Each API route with mocked AI providers
   - Pipeline execution with mocked agents
4. **E2E tests** (Playwright):
   - Submit a pipeline request from Studio and verify output renders
   - Open Settings panel, change a toggle, verify it persists
   - Place an order from the Store page
   - Navigate all pages and verify no console errors

### Documentation (5 → 10)

**What's missing:** No README with setup instructions. No API documentation. No architecture diagram.

**How to fix it:**
1. Write a `README.md` with: project description, tech stack, setup instructions (env vars, npm install, dev server), build & deploy instructions.
2. Create `docs/API.md` documenting all endpoints with request/response shapes.
3. Create an architecture diagram showing the agent pipeline flow.
4. Add inline JSDoc comments to all exported functions in agent modules.

### Deployment Readiness (7 → 10)

**What's missing:** No CI/CD config. No health check endpoint. No environment validation on startup.

**How to fix it:**
1. Add a `/api/health` endpoint that returns status of all services.
2. Add environment variable validation in a `src/lib/env.ts` module that runs at startup and logs warnings for missing keys.
3. Add a GitHub Actions workflow for lint + type check + build + test.
4. Add a `vercel.json` or `netlify.toml` with proper configuration.

---

## 4. Bugs & Must-Fix Issues

These are things that are **broken or incorrect right now** and should be fixed before any demo or deployment.

### BUG 1 — Seller Agent missing from Studio sidebar (CRITICAL)

**File:** `studio-page.tsx` lines 1087–1131

The left sidebar shows Strategist → Researcher → Buyer cards but the **Seller is completely absent**. The `initialStats` and `agentStats` objects also omit seller. The backend fully supports seller mode via `/api/pipeline/run` with `mode: "seller"`, but there's no way to trigger it from the Studio UI.

**Fix:**
1. Add `seller` to `initialStats` and `agentStats`.
2. Add a Seller `AgentCard` after Buyer with the arrow connector.
3. Add `"seller"` to the `ViewMode` type.
4. Add seller to `EXAMPLE_PROMPTS`, `EmptyState` config, and mode indicator.

### BUG 2 — Hero says "Three specialist agents" (HIGH)

**File:** `hero-section.tsx` line 67

```
Describe what you need. Three specialist agents research, plan, and
build it.
```

Should say "Four specialist agents research, plan, procure, and build it."

### BUG 3 — Layout OG metadata says "Three" (HIGH)

**File:** `layout.tsx` line 33

```
"Three specialist AI agents — research, planning, and design..."
```

Should say "Four specialist AI agents."

### BUG 4 — Services page says "Three structured deliverables" (MEDIUM)

**File:** `services-page.tsx` line 129

Needs updating to reflect the 4-agent, 6-product catalog.

### BUG 5 — Store page has no `<Nav />` or `<Footer />` (MEDIUM)

**File:** `store-page.tsx`

The Store page renders directly into a `<main>` tag with no navigation bar or footer. Users navigating to `/store` have no way to navigate back except the browser back button.

### BUG 6 — Agent cards grid uses 3 columns for 4 agents (LOW)

**File:** `agent-cards.tsx` line 173

```
<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
```

The 4th agent (Seller) sits alone on a second row. Should be `md:grid-cols-2 lg:grid-cols-4`.

### BUG 7 — Pricing route describes only "Research Agent" (LOW)

**File:** `pricing/route.ts` lines 8-11

Should describe the full 4-agent system.

### BUG 8 — `::placeholder` hardcoded for dark mode only (LOW)

**File:** `globals.css` line 300

```css
::placeholder {
  color: rgba(255, 255, 255, 0.28);
}
```

This white-alpha placeholder will be invisible on the light mode white background. Should use `var(--gray-400)` or a dedicated `--placeholder` token.

### BUG 9 — `glass-nav` hardcoded dark background (LOW)

**File:** `globals.css` line 149

```css
.glass-nav {
  background: rgba(5, 8, 10, 0.70);
}
```

This dark background won't work in light mode. Needs a CSS variable or `.light` override.

---

## 5. Functional Gaps

Things that aren't broken but are **incomplete or missing expected functionality**.

### GAP 1 — No real-time SSE events during Studio pipeline runs

The Research page has live SSE events. The Studio does not. Users stare at a spinner for 3–7 minutes with no feedback on what's happening. The `PipelineStages` component only populates AFTER the response returns, which defeats its purpose.

### GAP 2 — Buyer route doesn't accept `toolSettings`

**File:** `buyer/route.ts`

Unlike the seller and pipeline routes, the buyer route's `RequestBody` interface has no `toolSettings` field. When called standalone, user preferences are ignored.

### GAP 3 — No cancel/abort for long-running pipeline

Pipeline runs can take 3–7 minutes. There's no cancel button. The user must wait or refresh the browser and lose everything.

### GAP 4 — No session persistence / result history

Every page reload wipes the Studio result. Users lose their last run. There's no way to go back and see previous outputs.

### GAP 5 — No light/dark mode toggle

Light mode CSS tokens are defined in `.light` class, but there's no toggle button, no ThemeProvider, and no mechanism to apply the class to `<html>`.

### GAP 6 — Research page has no download button

The Studio `DocumentView` now has Copy + Download .md buttons. The Research page `DocumentView` only has Copy. Users who use the standalone Research page can't download their output.

### GAP 7 — No cost estimation before submission

Users have no idea how many credits a pipeline run will cost until it's finished. The Research page shows credit cost per depth level, but the Studio and Store don't.

### GAP 8 — Buyer card not interactive in Studio

The Buyer `AgentCard` in the Studio sidebar has `onClick={() => {}}` and `isSelected={false}`. It's purely decorative.

---

## 6. UX & Design Audit

Evaluated through the combined lens of Jobs, Ive, Raskin, Norman, Nielsen, Rams, and Garrett.

### What Jobs would say

> "The core idea is clear — describe work, agents build it. But the journey breaks when a user waits 5 minutes staring at a spinner. That's where you lose them. The first 10 seconds after they hit Enter must feel alive."

**Fix:** Real-time pipeline events, elapsed timer, stage progress bar.

### What Ive would say

> "The glass morphism is tasteful and restrained. The dark mode tokens are well-organized. But the light mode is unfinished — shipping half a theme is worse than not shipping it at all. Either complete it or remove the tokens."

**Fix:** Complete light mode with toggle, or remove `.light` class until ready.

### What Raskin would say

> "A user arrives at the Studio. They see three agent cards but there are four agents. They can't click the Buyer. There's no indication what 'pipeline mode' vs 'strategist mode' actually means in terms of what they'll get. The user should never have to wonder what to do next."

**Fix:** Make all agent cards interactive. Add clear descriptions of what each mode produces. Add visual pipeline flow diagram in the EmptyState.

### What Norman would say

> "The error handling violates every principle of good feedback. When a 5-minute pipeline fails, the user gets a single line of red text. Where did it fail? Can they retry? What should they do differently? The system must match the severity of the error to the investment of the user's time."

**Fix:** Rich error cards with stage context, retry button, and suggestions.

### What Nielsen would say

> "System status is not always visible. During a pipeline run, there's no elapsed timer, no stage indicator, no progress percentage. The loading skeleton is decorative, not informative. Users can't tell if the system is working or hung."

**Fix:** Elapsed timer, stage labels updating in real-time via SSE, estimated time remaining.

### What Rams would say

> "The Settings panel is excellent — every element serves a purpose. The product cards in the Store are honest about what they do. But the home page has too many sections — Stats, Decision Logic, Agent Cards, Services, Output Showcase, Studio Entry, Transaction Feed, Marketplace Connections, FAQ, CTA. That's 10 sections on a landing page. Less, but better."

**Fix:** Consider consolidating the landing page to 5-6 sections max. Hero → Agents → How It Works → Services → FAQ → CTA.

### What Garrett would say

> "The strategy layer is solid — the product exists to turn descriptions into structured deliverables. But the structure layer has gaps. The Seller agent exists at the architecture level but not at the interface level. The Store page exists but is disconnected from the main navigation flow. All features must reinforce the same goal."

**Fix:** Wire Seller into Studio. Add Store to the primary navigation flow with consistent chrome.

### Specific UX Recommendations

1. **First-run experience:** When a user lands on Studio for the first time, show a brief animated tour: "1. Describe your need → 2. Agents collaborate → 3. Get your deliverable." This can be a dismissible overlay that sets a localStorage flag.

2. **Progress transparency:** Replace the loading spinner with a vertical timeline that fills in as each agent completes its stage. Show the actual time each stage took next to it.

3. **Result actions:** After a pipeline completes, the primary CTA should be "Download Report" not "New Request." The user came for a deliverable — celebrate the output.

4. **Empty states with social proof:** Instead of just example prompts, show "Last generated: Market Analysis for AI Agents (12 sources, 2m 34s)" as social proof that the system works.

5. **Keyboard shortcuts:** Cmd/Ctrl+Enter to submit. Esc to cancel. Cmd/Ctrl+K to open settings. Cmd/Ctrl+N for new request.

---

## 7. Agent-by-Agent Deep Dive

### Agent 1: Strategist (`src/lib/agent/strategist.ts`)

**What it does:** Transforms raw user input into a structured brief with title, objective, scope, search queries, key questions, deliverables, and constraints. Uses AI with a detailed system prompt and JSON output format.

**Strengths:**
- Clean JSON schema extraction with regex fallback
- Output type mapping to brief structure
- Proper credit calculation and metadata

**Weaknesses:**
- Doesn't use web search to ground the brief in current reality
- No validation of the generated brief quality (e.g., are search queries actually useful?)
- `toolSettings.strategist` search/scrape settings are plumbed through but unused

**Improvement ideas:**
- Add optional "context enrichment" — a quick web search before brief generation so the AI has current data
- Add a brief quality score based on completeness (all fields populated, reasonable search queries)
- Let the Strategist suggest the optimal output type if the user chose "general"

### Agent 2: Researcher (`src/lib/agent/researcher.ts`)

**What it does:** Takes search queries from the brief, searches the web using configured providers, scrapes content, and synthesizes a structured document with citations. Has a 5-path fallback chain and supports follow-up research rounds.

**Strengths:**
- Robust 5-path fallback: Exa → Apify → DuckDuckGo → raw fetch → empty
- Completeness evaluation with follow-up queries
- Multi-provider scraping with content quality checks
- Clean error handling at each provider level

**Weaknesses:**
- Doesn't report which provider was actually used after fallback
- Content extraction could be improved for JavaScript-heavy sites
- No caching of search results (same query = same API calls)

**Improvement ideas:**
- Add `searchProviderUsed` and `scrapeProviderUsed` to the result
- Cache search results for 30 minutes to reduce API costs for repeated queries
- Add a "source quality score" per source so users know which citations are strongest

### Agent 3: Buyer (`src/lib/agent/buyer.ts`)

**What it does:** Discovers and purchases assets from the Nevermined marketplace. Filters by type and budget, makes purchases, and returns content for integration into research.

**Strengths:**
- Type filtering and budget controls
- Clean purchase flow with error handling per asset
- Proper credit tracking

**Weaknesses:**
- Completely silent about why it returned empty results
- No standalone UI mode
- No `toolSettings` in its API route
- `onClick={() => {}}` in Studio sidebar — not interactive

**Improvement ideas:**
- Return a `reason` field: "not_configured", "no_matches", "budget_exceeded", "disabled"
- Add a standalone Buyer mode in Studio for marketplace browsing
- Add a "Marketplace Preview" section that shows available assets before purchasing

### Agent 4: Seller (`src/lib/agent/seller.ts`)

**What it does:** Receives external orders, uses AI to match queries to products, plans fulfillment (including whether to buy external data), and dispatches to the internal pipeline. Has a sophisticated decision engine.

**Strengths:**
- AI-powered product matching with confidence scoring
- Smart fulfillment planning that decides whether external data is needed
- Budget-aware pipeline execution
- Rich order response with reasoning transparency

**Weaknesses:**
- Decision engine doesn't see the buyer's `maxCredits` in its prompt
- Not wired into the Studio UI at all
- No order status tracking (fire-and-forget)
- No webhook/callback for async order completion

**Improvement ideas:**
- Include `maxCredits` in the AI decision prompt
- Add order status tracking with a status page
- Add webhook support for external integrations
- Show the Seller's reasoning in the Studio pipeline stages

---

## 8. Infrastructure & Code Quality

### Duplicate Type Definitions (IMPORTANT)

The following types are defined **twice or more**:

| Type | Defined in | Also defined in |
|------|-----------|----------------|
| `ResearchSource` | `researcher.ts` | `studio-page.tsx`, `research-page.tsx` |
| `ResearchDocument` | `researcher.ts` | `studio-page.tsx`, `research-page.tsx` |
| `StructuredBrief` | `strategist.ts` | `studio-page.tsx` |
| `AgentTransaction` | `transactions.ts` | `studio-page.tsx` |
| `PipelineEvent` | `pipeline.ts` | `studio-page.tsx` |
| `PurchasedAsset` | `buyer.ts` | `studio-page.tsx` |

**Fix:** Create `src/types/pipeline.ts` with all shared types and import everywhere.

### Agent Config Duplication

| Config | Defined in | Also defined in |
|--------|-----------|----------------|
| Agent names, colors, avatars | `AGENT_CONFIG` in `studio-page.tsx` | `AGENT_PROFILES` in `transactions.ts` |
| Agent descriptions, stats | `STUDIO_AGENTS` in `mock-transactions.ts` | `AGENT_CONFIG` in `studio-page.tsx` |

**Fix:** Create `src/lib/agent/config.ts` as a single source of truth.

### `mock-transactions.ts` Naming

This file contains both **real production data** (STUDIO_AGENTS, STUDIO_SERVICES) and mock generators. The name is misleading.

**Fix:** Split into `src/data/agents.ts` (real data) and `src/data/mocks.ts` (generators).

### In-Memory State

`TransactionLedger`, `EventStore`, and `Catalog` all use in-memory singletons. Every server restart zeros everything.

**Fix for production:** Persist to Redis, SQLite, or Vercel KV. For hackathon, this is acceptable but should be noted.

### No AI Call Timeout

`complete()` in `providers.ts` has no timeout. A slow LLM response could hang the pipeline indefinitely.

**Fix:** Add `AbortSignal.timeout(60_000)` to each provider call. Wrap in try/catch and fall back to next provider.

### No Request Deduplication

If a user double-clicks the submit button (despite `disabled` state), two identical pipeline runs could fire. The `isLoading` state prevents UI-level dupes but race conditions exist.

**Fix:** Add a request ID deduplication check in the API route using a short-lived set.

---

## 9. New Agent Ideas & Use Cases

### Agent 5: Writer Agent

**What it does:** Takes the Researcher's output and transforms it into specific content formats — blog posts, executive summaries, tweet threads, newsletter editions, pitch decks, email copy.

**Why it fits:** The current pipeline produces structured reports. But users often need that information reformatted for a specific channel. A Writer agent sits after the Researcher and before delivery.

**Pipeline position:** Strategist → Researcher → Buyer → **Writer** → Seller

**Use cases:**
- "Research AI agents and write a LinkedIn post about the top trends"
- "Generate a competitive analysis and format it as an investor pitch deck"
- "Research this topic and write a 5-part email sequence"

### Agent 6: Validator Agent

**What it does:** Fact-checks the Researcher's output by cross-referencing claims against sources, checking for recency, identifying unsupported assertions, and adding confidence scores per section.

**Why it fits:** The Researcher produces impressive reports but the AI can hallucinate citations or misrepresent sources. A Validator agent adds a trust layer.

**Pipeline position:** Strategist → Researcher → **Validator** → Buyer → Seller

**Use cases:**
- Adding "[verified]" badges next to claims backed by multiple sources
- Flagging sections that rely on a single source
- Checking if cited URLs are still live

### Agent 7: Designer Agent

**What it does:** Takes structured deliverables and generates visual assets — diagrams, charts, infographics, wireframes, slide decks. Uses AI image generation or SVG/Mermaid diagram generation.

**Why it fits:** The system produces text-heavy outputs. Adding visual assets dramatically increases the perceived value of deliverables.

**Use cases:**
- Auto-generating market size TAM/SAM/SOM charts from market analyses
- Creating competitive positioning matrices from competitive intel reports
- Generating wireframes from PRDs
- Building Mermaid architecture diagrams from technical reports

### Agent 8: Monitor Agent

**What it does:** A persistent agent that watches topics over time. After an initial research run, it periodically re-researches and alerts when significant changes occur.

**Why it fits:** Current deliverables are point-in-time snapshots. A Monitor agent turns one-shot research into continuous intelligence.

**Use cases:**
- "Monitor the AI agent framework landscape and alert me to new entrants"
- "Track this competitor's pricing page weekly and flag changes"
- "Watch these 10 sources for news about autonomous payments"

### Use Cases That Would Sell This Product

1. **Due Diligence Reports** — VCs and M&A teams describe a company, get a comprehensive research report with competitive analysis, market sizing, and team background. Charge $50-200 per report.

2. **Content Marketing Pipeline** — Marketing teams describe a topic, get a research report, then a Writer agent reformats it into blog posts, social threads, and newsletters. Subscription model.

3. **Competitive Intelligence Service** — Companies subscribe to ongoing competitive monitoring. The Monitor agent watches competitors, the Researcher generates weekly updates, the Writer formats executive briefings.

4. **RFP Response Generator** — Sales teams paste an RFP, the Strategist parses requirements, the Researcher gathers relevant case studies and data, the Writer formats a response document.

5. **Academic Research Assistant** — Researchers describe a hypothesis, get a literature review with proper citations and gaps identified. The Validator ensures citation accuracy.

6. **Patent Landscape Analysis** — IP teams describe a technology area, get a patent landscape report with key players, filing trends, and white space analysis.

7. **Regulatory Compliance Research** — Compliance teams describe a regulation, get a structured analysis with requirements, deadlines, and implementation guidance.

---

## 10. Legendary Design Interrogation

Applying the framework of the greatest designers to Undermind.

### Alan Kay's Questions

> *Is this a tool, or a new medium for expression and thought?*

Right now it's a tool — you input a query, you get a report. To become a medium, it needs to support **iterative thinking**. Let users refine, annotate, and build on outputs. Add a "refine this section" button per section. Let users highlight text and say "go deeper here." Make the output a living document, not a static PDF.

> *Could a child discover how to use it without instruction?*

Almost. The hero input is intuitive. But the Studio page has too many options visible at once (mode, output type, depth, provider, tool settings). Consider a progressive disclosure approach — show the input first, reveal advanced options only when expanded.

> *Will this still feel meaningful 20 years from now?*

The multi-agent orchestration pattern will outlive the specific implementation. The architecture is forward-looking. But the UI patterns (split pane, tabs) will need to evolve toward more conversational and spatial interfaces.

### Douglas Engelbart's Questions

> *Does this make individuals smarter or more capable?*

Yes — it dramatically reduces the time to go from question to structured knowledge. But it could go further by **teaching** users about the research process. Show why the Strategist chose these search queries. Explain the Researcher's evaluation of source quality. Make the process educational, not just productive.

> *Does it help groups solve complex problems together?*

Not yet. There's no collaboration — no shared workspaces, no commenting, no sharing of results. Adding shareable result URLs (`/studio/result/{id}`) would be a significant step.

### Jef Raskin's Questions

> *Does the user always know what to do next?*

In the Studio: mostly yes (type → submit → wait → read). But during the 3-7 minute wait, the user doesn't know what's happening. And after getting results, the primary action should be more obvious (download, share, refine).

> *Are there unnecessary modes or decisions?*

The Output Type selector (research/PRD/plan/analysis/general) is a cognitive burden for most users. Consider making it automatic — the Strategist should detect the best output type from the input.

### Steve Jobs's Questions

> *What is the core idea, and have we removed everything else?*

Core idea: "Describe the work. Agents build it." This is clear and compelling. But the landing page has 10 sections, the Studio has multiple panels with tabs and sub-tabs. The core experience should be: **one input box → one output document**. Everything else is progressive enhancement.

> *Does this create delight the first time someone uses it?*

The speed and quality of the first result will determine this. If the first pipeline run takes 5 minutes with a spinner, there's no delight. If it takes 30 seconds with real-time agent activity visible, it's magical. The loading experience IS the product experience.

### Don Norman's Questions

> *What mental model will users form about this?*

Users will think: "I tell it what I want, it goes and researches it, and gives me a document." The agent pipeline metaphor is powerful but needs to be more visible. Users should see the agents working, not just the final output.

> *What happens when users make mistakes?*

Not much goes wrong from a user's perspective — they can only submit text. But if they submit a vague query, the output will be poor. Consider adding a "query quality" indicator that suggests improvements before submission.

### Jonathan Ive's Questions

> *What can we remove without harming the experience?*

1. The Output Type selector — make it automatic
2. The "Demo Mode" banner — it's anxiety-inducing; show it only in settings
3. The "ads" mute button — move it to settings
4. The bottom stats bar during loading (no stats to show yet)

> *Does this feel calm and inevitable?*

The dark mode is calm. The glass morphism is tasteful. But the 380px sidebar is visually heavy. Consider making it collapsible by default on smaller screens and starting collapsed.

### Dieter Rams's Questions

> *Is every element serving a purpose?*

The Agent Cards in the Studio sidebar are partially decorative — the Buyer card does nothing when clicked. Either make every card interactive with a useful action, or remove the cards that aren't functional yet.

> *Will this still feel good in ten years?*

The glass morphism and dark mode aesthetic are trendy but could feel dated. The underlying design token system is excellent and will allow easy reskinning. The architecture will age well.

### Jakob Nielsen's Questions

> *Can users accomplish tasks quickly?*

The input-to-output flow is efficient. But the output consumption is slow — users must read through the document. Add an executive summary at the top and a "key findings" callout box.

> *Where will users get stuck?*

1. After submitting: "Is it still working?" (no progress indicator)
2. On the Store page: "How do I get back to Studio?" (no nav)
3. In Settings: "Which providers should I choose?" (no recommendations)
4. First visit: "What is this?" (no onboarding)

---

## 11. Priority Roadmap

### Phase 1: Critical Fixes (Do today)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | Fix "Three → Four" in hero, layout OG, services page | Correctness | 15 min |
| 2 | Add `<Nav />` and `<Footer />` to Store page | Navigation | 10 min |
| 3 | Fix agent-cards grid for 4 agents (`md:grid-cols-2 lg:grid-cols-4`) | Layout | 5 min |
| 4 | Fix `::placeholder` to use CSS variable for light mode compat | Theme | 5 min |
| 5 | Update pricing route description | Accuracy | 5 min |

### Phase 2: Seller Agent UI (Do this week)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 6 | Add Seller to Studio sidebar (AgentCard, stats, mode) | Feature completion | 2 hr |
| 7 | Add `"seller"` to ViewMode, example prompts, EmptyState | Feature completion | 1 hr |
| 8 | Update mode indicator and LoadingSkeleton for seller | UX | 30 min |
| 9 | Add `toolSettings` to buyer route | Consistency | 30 min |
| 10 | Wire SSE events during Studio pipeline runs | Major UX win | 2 hr |

### Phase 3: UX Polish (This week / next week)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 11 | Add cancel button for long pipeline runs | UX | 1 hr |
| 12 | Add elapsed timer during loading | UX | 30 min |
| 13 | Rich error cards with retry button | UX | 1 hr |
| 14 | Add download .md to Research page DocumentView | Feature parity | 30 min |
| 15 | Store page search/filter | UX | 1 hr |
| 16 | Complete light mode toggle | Theme | 3 hr |
| 17 | Keyboard shortcuts (Cmd+Enter, Esc, Cmd+K) | UX | 1 hr |

### Phase 4: Architecture Improvements (Next week)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 18 | Consolidate duplicate types into `src/types/pipeline.ts` | Code quality | 2 hr |
| 19 | Merge AGENT_CONFIG + AGENT_PROFILES into single source | Code quality | 1 hr |
| 20 | Add AI call timeouts | Reliability | 1 hr |
| 21 | Session persistence (localStorage result history) | UX | 2 hr |
| 22 | Cost estimation before submission | UX | 1 hr |

### Phase 5: Quality & Robustness (Next iteration)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 23 | Unit tests for core modules | Quality | 4 hr |
| 24 | E2E tests for critical flows | Quality | 4 hr |
| 25 | Accessibility audit and fixes | Accessibility | 4 hr |
| 26 | API documentation | Developer experience | 2 hr |
| 27 | README with setup instructions | Developer experience | 1 hr |
| 28 | Per-page SEO metadata | SEO | 1 hr |

### Phase 6: New Features (Future)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 29 | Writer Agent | New capability | 1 week |
| 30 | Shareable result URLs | Collaboration | 2 days |
| 31 | Order status tracking for Seller | Feature | 2 days |
| 32 | Result search/filter history | UX | 1 day |
| 33 | Webhook support for async orders | Integration | 1 day |
| 34 | Monitor Agent | New capability | 1 week |
| 35 | Validator Agent | New capability | 1 week |

---

## Final Verdict

Undermind has **exceptional agent architecture** — the 4-agent pipeline with trading toggles, event streaming, multi-provider fallbacks, and AI-powered seller reasoning is genuinely impressive engineering. The settings system is one of the best I've seen in any agent product.

The gap between the backend capability and the frontend representation is the biggest issue. The Seller agent is a fully-functional reverse pipeline on the backend but invisible in the Studio. Closing this gap and adding real-time pipeline events would transform the product from "interesting demo" to "product people want to use."

The design foundation (CSS tokens, glass system, typography) is strong and the new light mode tokens show forward thinking. The code is clean, well-organized, and follows consistent patterns.

**Ship Phase 1 and 2, and this is a product that wins hackathons and impresses investors.**
