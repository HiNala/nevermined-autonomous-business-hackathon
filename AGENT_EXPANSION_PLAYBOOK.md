# Auto Business Agent Expansion Playbook

> Date: 2026-03-05
> Purpose: expand the usefulness of every current agent with practical, finite, high-leverage improvements
> Scope: current agents only, plus tightly bounded platform changes that make them smarter and more useful

---

## 1. Executive Summary

Auto Business already has four real agents with distinct value:

- `Strategist`
- `Researcher`
- `Buyer`
- `Seller`

The right next step is **not** to add many new agents.

The right next step is to make each current agent:

- better at its core job
- more stateful
- more explainable
- more reusable across surfaces
- more useful in real business workflows

This guide is intentionally finite. It avoids vague "add more AI" advice and focuses on changes that are:

- practical
- incremental
- architecture-friendly
- easy to explain to users and judges
- aligned with current best practices for agent systems

The strongest pattern from current external research is clear:

1. Use **layered memory**, not stateless runs
2. Treat **handoffs as protocols**, not loose prompts
3. Model long operations as **jobs**, not blocking requests
4. Show **citations, provenance, and confidence**
5. Add **guardrails, budgets, and approvals** around costly or irreversible actions

This playbook applies those principles to each existing agent.

---

## 2. The Design Filter To Use Before Expanding Any Agent

You included a strong set of founder-level design questions. That is the right lens.

Before shipping any new agent feature, ask:

### Capability questions

- Does this expand user capability or just add output volume?
- Does it help the user think, decide, or act better?
- Does it support ongoing work after the first response?

### Simplicity questions

- Does the user know what to do next without training?
- Does this remove friction or introduce new cognitive load?
- Can we remove steps, settings, or modes instead of adding them?

### Trust questions

- Can the user verify where the result came from?
- Can the user safely explore without fear of costly mistakes?
- Does the system explain why it made a choice?

### Product questions

- Would someone use this weekly, not just once?
- Does this make the product more habit-forming or more complicated?
- Does this strengthen the core workflow or distract from it?

### Durability questions

- Will this still matter in 2 years?
- Is this a real capability or a demo feature?
- Does it scale operationally and technically?

If a proposed feature fails these questions, do not ship it.

---

## 3. External Best-Practice Patterns Worth Adopting

The online research points to a few patterns that are especially relevant for Auto Business.

### 1. Layered memory

Modern agent systems work best with:

- working memory for the current run
- episodic memory for recent jobs and artifacts
- semantic memory for durable user/workspace facts

Why this matters here:

- your agents currently execute well, but mostly start fresh each time
- adding memory makes every agent feel smarter without changing their identities

### 2. Structured handoffs

The best production guidance now recommends designing agent handoffs as typed protocols:

- versioned payloads
- trace IDs
- validated schemas
- explicit ownership of each artifact

Why this matters here:

- your pipeline is already strong
- making handoffs stricter will improve reliability, explainability, and reuse

### 3. Async jobs plus SSE

Best-practice long-running AI workflows now favor:

- `202 Accepted`
- stable `jobId`
- status endpoint
- SSE for real-time progress

Why this matters here:

- your pipelines are already long enough to benefit from first-class job semantics
- this will make both `Studio` and external seller workflows feel more professional

### 4. Provenance and trust UX

Current trustworthy AI guidance consistently rewards:

- citations
- source transparency
- confidence markers
- clear stage visibility
- human-readable provenance

Why this matters here:

- your product already has visible stages
- the next step is to make final outputs visibly trustworthy, not just internally traceable

### 5. Scoped and revisable memory

The strongest memory systems support:

- identity-scoped memory
- consolidation over time
- expiration for stale facts
- revision history

Why this matters here:

- business context changes
- stale memory is worse than no memory

---

## 4. Current Agent Roles And Best Expansion Direction

### `Strategist`

Current role:

- turns raw input into structured brief

Best expansion direction:

- become the request understanding, context, and planning brain

### `Researcher`

Current role:

- searches, scrapes, synthesizes, writes report

Best expansion direction:

- become the evidence and composition engine

### `Buyer`

Current role:

- discovers and purchases external assets

Best expansion direction:

- become the budget-aware enrichment and procurement specialist

### `Seller`

Current role:

- receives orders, matches products, fulfills and returns results

Best expansion direction:

- become the job owner, packaging layer, and delivery boundary

---

## 5. Expand `Strategist` Into A Real Request Intelligence Agent

### What `Strategist` should become

`Strategist` should not just make better prompts.

It should become the system that:

- understands ambiguous requests
- fills in missing context safely
- maps work to the right product and output type
- decides what quality level is needed
- prepares the rest of the pipeline to succeed

### Most practical feature upgrades for `Strategist`

#### 1. Clarification mode

When requests are ambiguous, `Strategist` should ask 1-2 targeted questions before full execution.

Examples:

- "Do you want a fast brief or a board-ready report?"
- "Should this focus on US, Europe, or global markets?"
- "Is this for product strategy, fundraising, or competitor tracking?"

Why this is high value:

- improves output quality immediately
- reduces bad first-pass reports
- keeps the user in control

Finite implementation:

- only trigger when confidence is low
- cap clarifications at 2 questions
- offer sensible defaults

#### 2. Workspace-aware briefing

`Strategist` should read saved workspace context before composing briefs.

Examples of reusable context:

- company stage
- target market
- preferred format
- recurring competitors
- tone preference
- budget sensitivity

Why this is high value:

- makes repeat usage feel genuinely intelligent
- reduces repeated typing

Finite implementation:

- add a simple workspace profile object
- inject it into strategist prompts
- allow user override per run

#### 3. Better output routing

`Strategist` should decide:

- which product/output type best fits the request
- whether deep research is necessary
- whether external enrichment may be useful
- whether this should become a recurring monitor later

Why this is high value:

- strengthens the whole pipeline
- reduces user decision burden

Finite implementation:

- add a routing object to `StructuredBrief`
- include fields like `recommendedMode`, `recommendedDepth`, `enrichmentLikelihood`, `candidateTemplates`

#### 4. Brief scoring

Have `Strategist` self-score its own brief before handoff.

Suggested dimensions:

- clarity
- specificity
- answerability
- sourceability
- deliverable completeness

Why this is high value:

- cheap quality boost
- catches weak briefs early

Finite implementation:

- if score falls below threshold, regenerate once

#### 5. Saved brief templates

Let `Strategist` apply known templates:

- market scan
- competitive brief
- PRD
- GTM plan
- technical evaluation

Why this is high value:

- better structure
- more consistent deliverables

Finite implementation:

- 5-8 curated templates only
- no user-generated template builder yet

### What not to do yet

- do not turn `Strategist` into a chatty brainstorming buddy
- do not add too many configuration knobs
- do not let it own final document generation

### Success metrics for `Strategist`

- fewer retries per job
- better first-pass report quality
- fewer vague outputs
- higher usage of saved workspace context

---

## 6. Expand `Researcher` Into A Stronger Evidence And Composition Engine

### What `Researcher` should become

`Researcher` is already your most visible intelligence agent.

It should become best-in-class at:

- collecting evidence
- comparing sources
- identifying conflicts
- structuring output clearly
- delivering reports that are actually decision-useful

### Most practical feature upgrades for `Researcher`

#### 1. Multi-pass report generation

Instead of one synthesis pass, use:

- outline pass
- evidence pass
- draft pass
- review pass

Why this is high value:

- higher report quality
- better structure
- better consistency

Finite implementation:

- start with 2 passes only: outline -> final
- add review pass later

#### 2. Source scoring and freshness

Score each source on:

- recency
- authority
- relevance
- uniqueness
- completeness

Why this is high value:

- better trust
- better decision making when sources conflict

Finite implementation:

- compute simple scores
- surface top trusted sources in output metadata

#### 3. Contradiction detector

When sources disagree, `Researcher` should explicitly say:

- what conflicts
- which side looks stronger
- where uncertainty remains

Why this is high value:

- makes the system feel more honest
- reduces hallucinated certainty

Finite implementation:

- only run contradiction check for deep reports or when 3+ sources exist

#### 4. Comparison mode

Add a reusable comparison structure for:

- competitors
- vendors
- tools
- markets
- strategies

Why this is high value:

- extremely practical business output
- much more useful than generic summaries

Finite implementation:

- support matrix-style sections
- do not build a full visual comparison UI yet

#### 5. Research rerun / delta mode

When rerunning a similar job, `Researcher` should show:

- what changed
- what is new
- what stayed the same
- whether prior conclusions still hold

Why this is high value:

- increases repeat usage
- turns reports into living assets

Finite implementation:

- compare latest result to previous artifact in the same workspace/topic

#### 6. Claim-level citations in final report

Move beyond just source list at the bottom.

Why this is high value:

- stronger trust
- more professional output

Finite implementation:

- section-level citation blocks first
- inline citation markers later

#### 7. Research confidence summary

At the top of each report, show:

- confidence level
- source count
- freshness level
- unresolved uncertainty
- whether premium/external data was used

Why this is high value:

- makes reports easier to consume quickly

### What not to do yet

- do not add autonomous web roaming without guardrails
- do not overload the UI with research internals
- do not let it purchase assets directly without a Buyer contract

### Success metrics for `Researcher`

- higher report save/export rate
- lower user follow-up asking for clarification
- better source diversity
- fewer weak or generic sections

---

## 7. Expand `Buyer` Into A Budget-Aware Enrichment Specialist

### What `Buyer` should become

`Buyer` should remain optional, but more intelligent.

It should not be "the marketplace agent that always runs."

It should be:

- the specialist that improves report quality when external assets are actually worth the cost

### Most practical feature upgrades for `Buyer`

#### 1. Value-based purchase ranking

Rank candidate assets by:

- relevance to current brief
- provider quality
- recency
- information gain
- price-value ratio

Why this is high value:

- prevents bad purchases
- makes the marketplace stage feel intelligent rather than random

Finite implementation:

- simple weighted ranking formula first

#### 2. Purchase rationale

Before purchase, log:

- what gap this asset fills
- why it is worth the credits
- what outcome improvement is expected

Why this is high value:

- improves trust
- helps future analytics

Finite implementation:

- store a short `purchaseReason` field with every attempted asset

#### 3. Approval thresholds

For higher-cost assets, require approval.

Why this is high value:

- practical for real usage
- avoids runaway spend

Finite implementation:

- one simple rule: if external asset cost exceeds threshold, mark job as `awaiting_approval`

#### 4. Asset memory

Save purchased assets to a reusable library.

Why this is high value:

- avoids rebuying the same thing
- increases compounding value of the system

Finite implementation:

- save purchased content and metadata by workspace
- allow reuse before re-purchase

#### 5. Asset comparison before purchase

If multiple assets match, compare them on:

- coverage
- likely uniqueness
- price
- provider
- fit to the job

Why this is high value:

- makes `Buyer` visibly intelligent

Finite implementation:

- compare top 3 only

#### 6. External service health and trust score

Track which providers:

- return usable data
- fail often
- produce low-quality assets

Why this is high value:

- improves buying quality over time

Finite implementation:

- record outcome score after each purchase

### What not to do yet

- do not turn `Buyer` into a full marketplace browser UI first
- do not let it buy multiple assets automatically without budget logic
- do not make it part of every pipeline explanation

### Success metrics for `Buyer`

- higher usefulness of purchased assets
- lower wasted credits
- higher merge rate of asset content into final output
- fewer irrelevant purchases

---

## 8. Expand `Seller` Into A Better Job Owner And Delivery Layer

### What `Seller` should become

`Seller` should be the cleanest and most professional part of the system.

It should own:

- order intake
- commerce boundary
- job tracking
- delivery packaging
- final export
- customer-facing communication

### Most practical feature upgrades for `Seller`

#### 1. Async job flow

Change long-running seller workflows from blocking POST requests to:

- `POST /api/orders`
- return `jobId`
- track on `GET /api/orders/{jobId}`
- stream progress via SSE

Why this is high value:

- strongest API improvement
- better UX for store and external buyers

Finite implementation:

- keep current path working
- add new async route in parallel

#### 2. Delivery package layer

Have `Seller` produce a structured delivery package:

- title
- executive summary
- polished body
- source appendix
- provenance
- external asset disclosure
- cost summary
- job metadata

Why this is high value:

- turns raw report into premium deliverable

Finite implementation:

- define a `DeliveryPackage` type
- render markdown and HTML first

#### 3. Status communication

`Seller` should expose job status as clear states:

- received
- planning
- researching
- enriching
- packaging
- delivered
- failed

Why this is high value:

- makes the system easier to understand
- reduces anxiety during long jobs

#### 4. Delivery variants

Support output variants such as:

- full report
- executive brief
- summary-only
- source appendix
- JSON artifact

Why this is high value:

- very practical
- improves reuse

Finite implementation:

- same underlying report, different packaging views

#### 5. External buyer developer experience

Improve seller API ergonomics with:

- idempotency keys
- stable schemas
- clear errors
- status URLs
- event envelopes

Why this is high value:

- helps external agent adoption
- makes the product feel real, not hacky

#### 6. Quality gate before delivery

Before delivery, `Seller` should check:

- report completeness
- citation presence
- failure state
- external asset disclosure

Why this is high value:

- avoids delivering obviously weak packages

### What not to do yet

- do not overload `Seller` with too much semantic reasoning
- do not make it the content author
- do not create too many pricing tiers immediately

### Success metrics for `Seller`

- better completion UX
- higher export/share rate
- fewer support-style retries
- cleaner external API integrations

---

## 9. Cross-Agent Changes That Will Help Every Agent

These are the finite platform upgrades that unlock better behavior across all four agents.

### 1. Persistent `Job` model

Every run should create a durable job record with:

- `jobId`
- `workspaceId`
- `input`
- `status`
- `brief`
- `document`
- `assets`
- `deliveryPackage`
- `events`
- `costs`

### 2. Workspace profile

This is the minimum useful memory layer.

Suggested fields:

- company name
- market
- preferred report style
- recurring competitors
- preferred geography
- budget policy
- preferred depth

### 3. Artifact library

Save:

- briefs
- reports
- purchased assets
- delivery packages

### 4. Versioned handoff types

Suggested shared contracts:

- `IncomingRequest`
- `StructuredBrief`
- `ResearchArtifact`
- `EnrichmentDecision`
- `PurchasedAssetRecord`
- `DeliveryPackage`

### 5. Guardrails and approvals

Add simple, explicit controls:

- max external spend
- approval threshold
- allowed tool/provider set
- safe retry behavior

### 6. Provenance block

Every final output should include:

- generated by which agents
- model/provider used
- when sources were fetched
- whether external assets were purchased
- confidence summary

---

## 10. Finite Roadmap: What To Change First

This is the most important section if you want bounded, logical implementation.

### Phase 1: Highest-value, low-complexity changes

Ship first:

1. Add workspace profile memory for `Strategist`
2. Add report confidence + freshness summary for `Researcher`
3. Add purchase rationale for `Buyer`
4. Add `DeliveryPackage` output for `Seller`
5. Add persistent `jobId` to every run

Why these first:

- they improve intelligence, trust, and usefulness quickly
- they do not require a full architecture rewrite

### Phase 2: Strong production upgrades

Ship next:

1. Async seller order flow with status endpoint
2. Artifact library for briefs/reports/assets
3. Brief scoring and clarification logic
4. Source scoring and contradiction detection
5. Approval threshold for high-cost `Buyer` decisions

Why these next:

- this is where the app starts feeling like a product system, not just a pipeline

### Phase 3: Repeat-usage and retention upgrades

Ship after that:

1. Delta reports on reruns
2. Recurring monitors
3. Reuse of prior purchased assets
4. Comparison mode for research outputs
5. Share/export variants from `Seller`

Why these later:

- they are highly valuable, but depend on persistent jobs and artifacts first

---

## 11. Recommended Concrete Changes By File/Concept

This section keeps the guide grounded in the current app.

### `Strategist`

Current concept:

- structured brief generator

Change next:

- extend `StructuredBrief` with routing and confidence fields
- inject workspace profile context
- add optional clarification pass

### `Researcher`

Current concept:

- search + scrape + synthesize

Change next:

- add source score metadata
- add freshness summary
- add contradiction scan for deep reports
- add version comparison mode later

### `Buyer`

Current concept:

- discover and purchase marketplace assets

Change next:

- add ranking reasons
- add purchase rationale
- add asset outcome scoring
- save purchased assets to library

### `Seller`

Current concept:

- seller route + fulfillment + response

Change next:

- separate job intake from final delivery
- return `jobId`
- produce `DeliveryPackage`
- support async tracking

### `Studio`

Change next:

- show workspace context in use
- show confidence/freshness summaries
- show why Buyer was or was not called
- distinguish draft artifact from delivered package

### `Store`

Change next:

- explain product flow more clearly
- show delivery variants
- show whether a product may use enrichment
- later, show job tracking post-order

---

## 12. What To Avoid

These are the easiest ways to make the system feel more impressive but less useful.

### Avoid adding many new agents too early

More agents do not automatically mean more intelligence.

### Avoid adding too many controls

If users have to tune everything manually, the system feels less smart.

### Avoid invisible paid behavior

Never let `Buyer` spend credits without clear policy and visible rationale.

### Avoid black-box reports

Without citations, confidence, and freshness, the app will feel less trustworthy.

### Avoid mixing all roles together

Each agent should stay legible:

- `Strategist` understands and plans
- `Researcher` proves and composes
- `Buyer` enriches selectively
- `Seller` owns job, package, and delivery

---

## 13. The Best Short Version Of The Product Story

If you expand the current agents the right way, the product story becomes:

**The Strategist clarifies what needs to be done, the Researcher gathers and composes evidence, the Buyer enriches the work when premium external data is worth it, and the Seller turns the result into a trackable, deliverable product.**

That story is:

- clear
- practical
- extensible
- credible

---

## 14. Final Recommendation

If you want the best practical expansion of your current agent system, do these five things first:

1. Add workspace memory so `Strategist` stops starting from zero
2. Add confidence, freshness, and contradiction handling so `Researcher` becomes more trustworthy
3. Add rationale, ranking, and approval thresholds so `Buyer` becomes economically intelligent
4. Add async jobs and delivery packaging so `Seller` becomes a real product boundary
5. Add persistent artifacts and shared contracts so every agent handoff becomes durable and reusable

This is the finite, logical path that will make Auto Business more intelligent without making it chaotic.

---

## 15. Research Notes

This guide is informed by current external patterns around:

- multi-agent orchestration and structured handoffs
- layered memory and scoped personalization
- async job-based API design with SSE
- trustworthy AI UX with citations and provenance
- risk-managed AI systems with guardrails and approvals

Helpful references:

- OpenAI Cookbook: context personalization and state injection
- Google Cloud Vertex AI Memory Bank overview
- Microsoft 2025 Responsible AI Transparency Report

