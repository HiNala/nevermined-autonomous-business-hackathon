# Auto Business Application Logic Review

> Date: 2026-03-05
> Scope: Current application review, agent/workflow logic review, and a proposed architecture that makes the product easier to understand and scale
> Reviewer focus: Product logic, agent responsibilities, user experience, API semantics, seller workflow, and future extensibility

---

## 1. Executive Summary

Auto Business already has a strong technical base:

- A real multi-agent backend
- A working seller flow
- A working research pipeline
- A store and marketplace concept
- Nevermined payment hooks
- Good UI ambition and a solid design system

But the app currently has a **logic clarity problem**:

- The names of the agents do not match their real jobs clearly enough
- The seller currently does too much planning and too much orchestration
- The same system is presented differently across home, studio, store, and API surfaces
- The user-facing story is not yet one simple mental model

The product will make much more sense if you formalize one canonical pipeline:

`Seller -> Interpreter -> Composer -> optional Buyer -> Seller`

That is the cleanest model based on your stated goal.

In plain English:

- The `Seller` should be the commercial wrapper and delivery layer
- The `Interpreter` should turn vague requests into a structured execution brief
- The `Composer` should create the actual report/document
- The `Buyer` should optionally enrich the work with third-party assets later
- The `Seller` should package, style, deliver, and finalize the transaction

That is much more logical than the current split where the seller still acts partly like a planner and partly like a storefront and partly like a fulfillment engine.

My overall assessment of the application as it is now:

| Area | Score / 10 | Notes |
|---|---:|---|
| Core architecture | 8 | Real backend depth, not a fake demo |
| Product logic clarity | 5 | Powerful system, but roles and flows are still mentally muddy |
| Agent naming clarity | 4 | Current names do not map cleanly to responsibilities |
| Seller workflow clarity | 5 | Works technically, but responsibilities are overloaded |
| API design | 7 | Strong base, but the route semantics should align to the canonical flow |
| Studio UX | 7 | Rich and promising, but the user story is more complex than it should be |
| Store / commerce UX | 7 | Functional, but not yet the primary logical source of truth |
| Marketplace enrichment model | 6 | Good foundation, but not yet positioned as an optional stage cleanly |
| Design system | 8 | Strong visual consistency and polish |
| Readiness for the next architecture step | 9 | The codebase can support this restructure well |

---

## 2. What The App Is Today

At a high level, the application currently behaves like four products sharing one codebase:

1. A landing page that sells the vision of agent-produced deliverables
2. A `Studio` for running internal pipelines
3. A `Store` for ordering deliverables from the seller
4. An API surface for agent-to-agent transactions and Nevermined integration

That is not bad. In fact, it is a good foundation. The problem is that the internal logic is not yet expressed consistently across those surfaces.

### Current pages and what they really mean

- `/` is the marketing surface
- `/studio` is the internal execution surface
- `/store` is the commercial catalog surface
- `/agents` is the team/architecture explanation surface
- `/.well-known/agent.json` is the machine-readable entry point for outside agents

### Current implemented backend capability

The backend is more mature than the frontend copy suggests.

There is already:

- A full pipeline executor
- A standalone strategist/interpreter-style agent
- A standalone researcher/composer-style agent
- A buyer agent for Nevermined marketplace discovery and purchase
- A seller route that accepts paid or internal orders
- Transaction and event streams
- Product inventory and third-party services
- AI provider abstraction
- Web search/scrape provider abstraction

So the app is not missing the hard part. It is mostly missing a clearer model of **who owns what**.

---

## 3. Current Agent Logic Review

This section describes what each agent currently does in the codebase and whether that job makes logical sense.

### Agent 1: Current Strategist

Current responsibility:

- Takes vague input
- Produces a structured brief
- Defines objective, scope, search queries, key questions, deliverables, constraints

What this really is:

- This is not just a strategist
- This is an **interpreter**
- It translates buyer intent into an execution-ready internal contract

Why `Interpreter` is a better name:

- "Strategist" sounds optional or business-oriented
- "Interpreter" explains the actual job better
- It gives the agent a clearer place in every workflow
- It makes sense whether the input comes from a human, another agent, or the seller API

Verdict:

- Keep the behavior
- Rename the role
- Make it the universal first step after request intake

Score: `8/10` technically, `10/10` if renamed and made canonical

### Agent 2: Current Researcher

Current responsibility:

- Searches the web
- Scrapes content
- Synthesizes findings
- Produces the final structured document
- Evaluates completeness and can trigger follow-up loops

What this really is:

- This is more than a researcher
- It is actually your **composer**
- It turns structured intent plus source material into a finished report

Why `Composer` is a better name:

- "Researcher" implies gathering only
- But this agent also organizes, synthesizes, writes, and outputs
- "Composer" better reflects that it composes the actual deliverable

Verdict:

- Keep most of the implementation
- Rename the role to better match the output responsibility
- Treat web research as one of the composer's tools, not its identity

Score: `9/10` technically, `10/10` if reframed as the document-authoring engine

### Agent 3: Buyer

Current responsibility:

- Discovers marketplace assets
- Purchases third-party assets
- Returns purchased content for integration

What this should be:

- An optional enrichment specialist
- Not part of every request by default
- A conditional branch used only when the composer or seller needs external enhancement

Verdict:

- Good as a specialist
- Should not dominate the primary user mental model
- Should become a subordinate stage later, exactly as you described

Score: `7/10`

### Agent 4: Seller

Current responsibility:

- Accepts external orders
- Matches product
- Plans fulfillment
- Runs the internal pipeline
- Returns the result
- Handles payment verification and settlement

This is the biggest logic issue in the app.

Right now the seller is:

- storefront
- payment gate
- product matcher
- planner
- fulfillment orchestrator
- delivery wrapper

That is too many jobs for one role.

What the seller should be instead:

- the public-facing commercial boundary
- the transaction owner
- the delivery/styling/packaging layer
- the final sender of the work

It can still orchestrate the pipeline, but conceptually it should do so as a **traffic controller**, not as the thinking engine that defines the job.

Verdict:

- Keep seller as the API and payment boundary
- Remove strategic reasoning from its public identity
- Push intent-structuring to the Interpreter
- Push content creation to the Composer
- Keep styling, packaging, delivery, and settlement in Seller

Score: `6/10` logically, even though the code itself is solid

---

## 4. Current Workflow Review

### A. Current Studio workflow

Current logic:

- User enters a request
- Pipeline runs
- Strategist creates brief
- Researcher creates report
- Buyer may enrich
- Result is shown directly in Studio

What works:

- It proves the internal pipeline exists
- It is good for demos and internal testing

What is confusing:

- Studio is both a lab and a production path
- It is not always clear whether the user is invoking a public seller flow or an internal dev flow
- The user sees agents, but not always their real responsibilities

Recommendation:

- Keep Studio as the internal orchestration console
- Present it explicitly as: "Run the internal production pipeline"
- Mirror the same canonical flow used by the seller API

### B. Current Store workflow

Current logic:

- User picks a product
- User submits an order
- Seller route fulfills it through pipeline logic
- User receives output

What works:

- This is actually close to the future model
- It already feels commercial

What is confusing:

- The seller still plans too much instead of acting like the commercial shell around a more explicit internal chain
- The user is buying a seller product, but the downstream agent story is not explained clearly

Recommendation:

- The Store should become the clearest representation of your business model
- Every product order should be described as:
  - Seller receives order
  - Interpreter structures it
  - Composer drafts it
  - Optional Buyer enriches it
  - Seller packages and delivers it

### C. Current external seller API workflow

Current logic:

- External caller hits seller route
- Seller verifies payment
- Seller matches product and plans fulfillment
- Seller runs internal generation
- Seller responds

What works:

- Technically valid
- Already useful

What is missing:

- A clean distinction between:
  - inbound commercial request
  - internal requirement interpretation
  - document composition
  - optional enrichment
  - seller packaging and settlement

This is exactly the flow you want to improve.

---

## 5. Main Logic Problems In The App Today

These are the biggest reasons the app does not yet "make more logical sense."

### Problem 1: The public story and the internal architecture are out of sync

The app often markets itself as a simple AI agent studio, but internally it is a commerce pipeline with layered specialization.

That is fine, but the UI and naming do not consistently teach that.

### Problem 2: Agent names describe flavor more than responsibility

`Strategist` and `Researcher` sound reasonable, but they do not describe the actual contracts these agents fulfill.

`Interpreter` and `Composer` are much clearer system roles.

### Problem 3: Seller owns too much reasoning

The seller currently does product matching, fulfillment planning, payment boundary work, and delivery work.

That makes the system harder to reason about and harder to extend.

### Problem 4: The final document does not have a clear owner

Right now the researcher produces the document, but the seller also kind of owns fulfillment.

Your desired model is better:

- Composer creates content
- Seller styles/packages/delivers the artifact

That clarifies ownership.

### Problem 5: Marketplace enrichment is present too early in the mental model

Buyer exists now and is technically useful, but in the ideal product story it should feel like an enhancement stage, not part of the basic explanation.

Your later plan is the right one.

---

## 6. Recommended Canonical Architecture

This is the architecture I recommend based on your desired product logic.

### New agent names

| Current | Recommended | Why |
|---|---|---|
| Strategist | Interpreter | Converts request into a structured execution contract |
| Researcher | Composer | Produces the report/document, not just research |
| Buyer | Buyer | Still correct |
| Seller | Seller | Still correct, but narrower role |

### Canonical pipeline

#### Stage 1: Seller receives order

Seller responsibilities:

- authenticate / verify payment
- create job record
- accept product or request intent
- pass raw request inward

Seller should not be the main reasoning agent.

#### Stage 2: Interpreter structures the work

Interpreter responsibilities:

- normalize the request
- infer missing fields
- map vague text to a proper deliverable type
- produce a structured brief
- define required sections and output expectations

Output:

- a formal internal brief / work order

#### Stage 3: Composer produces the report

Composer responsibilities:

- take the Interpreter brief
- gather research and sources
- synthesize the actual document
- ensure the report meets the required structure

Output:

- a raw completed report artifact

#### Stage 4: Optional Buyer enrichment

Later stage, conditional only.

Buyer responsibilities:

- purchase relevant third-party data or reports
- return usable external material

Composer then:

- merges external assets into the report
- updates the final content

#### Stage 5: Seller styles and delivers

Seller responsibilities:

- apply final formatting and packaging
- add styling, branding, metadata, markdown/html/doc export layers
- settle/complete the transaction
- send final response to caller

This is the cleanest product logic.

---

## 7. The Best Version Of Your Seller API Workflow

You specifically said:

> when an agent asks to buy from the seller via the api call the interpreter agent structures that request and fills it out and passes it to agent two composer and then when the report is finished it is passed to the seller agent that will handle the transaction / sending and styling of the documentation

I agree with that model.

Here is the recommended final sequence:

### External API transaction flow

1. External agent calls Seller API
2. Seller validates request shape
3. Seller verifies payment capability or x402 token
4. Seller creates internal `job`
5. Seller forwards raw request to `Interpreter`
6. Interpreter returns structured brief
7. Seller stores brief on the job
8. Seller passes brief to `Composer`
9. Composer generates report
10. Seller receives raw report artifact
11. Seller applies final formatting/styling/package rules
12. Seller settles payment
13. Seller returns final deliverable

Later:

10a. Composer decides enrichment is needed
10b. Composer calls Buyer
10c. Buyer purchases third-party asset
10d. Buyer returns external material
10e. Composer merges it into the report
10f. Seller packages the enriched result

This is much easier to explain to:

- users
- hackathon judges
- future engineers
- other agent builders integrating through your API

---

## 8. What Should Change In The Current Code Architecture

This section translates the logical model into structural changes.

### A. Seller should become thinner conceptually

Current seller responsibilities are too broad.

Recommended change:

- keep seller route as the public API
- keep payment verification there
- keep payment settlement there
- keep delivery formatting there
- move request interpretation ownership to Interpreter
- move document creation ownership to Composer

### B. Product matching should move or be reframed

Right now seller does product matching and fulfillment planning.

You have two clean options:

#### Option 1: Seller keeps lightweight routing only

Seller decides:

- what product family this is
- what output shell is needed

Then Interpreter does all semantic structuring.

This is the easiest migration path.

#### Option 2: Interpreter owns deliverable mapping

Seller only:

- receives request
- validates commerce
- forwards raw job

Interpreter decides:

- requested artifact type
- scope
- expected structure
- whether enrichment may be needed later

This is logically cleaner long term.

My recommendation:

- short term: Option 1
- long term: Option 2

### C. Composer should explicitly own document completion

Right now the system still feels like:

- researcher generates document
- seller fulfills order

Instead it should become:

- composer creates report
- seller transforms report into a delivered commercial artifact

That distinction matters because later you may want seller to:

- output markdown
- output HTML
- output PDF
- add customer-facing metadata
- add order IDs and provenance
- add delivery branding

### D. Buyer should be invoked by composition need, not by pipeline default

When you add Buyer later, do not position it as "agent three always runs."

Instead:

- Composer attempts first-pass completion
- Composer or Seller evaluates whether external enrichment is needed
- Buyer runs only when necessary

That keeps the base workflow understandable.

---

## 9. Recommended New Contracts Between Agents

To make the app logical, each handoff should have a named contract.

### Contract 1: Seller -> Interpreter

`IncomingOrder`

Suggested fields:

- `jobId`
- `caller`
- `productId` or `requestedDeliverable`
- `rawRequest`
- `budget`
- `priority`
- `deliveryFormat`
- `paymentContext`

Purpose:

- seller gives interpreter the raw commercial request in a predictable format

### Contract 2: Interpreter -> Composer

`StructuredBrief`

Suggested fields:

- `jobId`
- `title`
- `objective`
- `scope`
- `questionsToAnswer`
- `requiredSections`
- `searchPlan`
- `constraints`
- `targetAudience`
- `tone`
- `deliveryFormat`

Purpose:

- composer should never receive ambiguous intent

### Contract 3: Composer -> Buyer

`EnrichmentRequest`

Suggested fields:

- `jobId`
- `gapSummary`
- `neededAssetTypes`
- `keywords`
- `maxCredits`
- `requiredRecency`

Purpose:

- buyer should buy because the composer has a specific documented gap

### Contract 4: Composer -> Seller

`ComposedReport`

Suggested fields:

- `jobId`
- `title`
- `summary`
- `sections`
- `sources`
- `citations`
- `draftFormat`
- `qualityNotes`
- `usedExternalAssets`

Purpose:

- seller receives a complete artifact that it can style and deliver

---

## 10. UI And Product Changes Needed To Match The New Logic

The architecture should be reflected in the product.

### A. Rename the agents everywhere

Change user-facing names:

- `Strategist` -> `Interpreter`
- `Researcher` -> `Composer`

Update:

- Studio sidebar
- Agents page
- Home page copy
- API descriptions
- metadata descriptions
- docs
- sample outputs

### B. Make the Studio show the real canonical path

Studio should visually show:

- Seller intake
- Interpreter structuring
- Composer drafting
- Buyer enrichment when enabled
- Seller packaging/delivery

Even if seller is not a "manual mode" used often in Studio, it should still appear as the terminal delivery layer in the workflow.

### C. Make seller outputs visibly different from composer outputs

This is important.

Users should be able to tell the difference between:

- a raw internal report
- a final delivered seller package

Suggested difference:

- Composer output = internal artifact
- Seller output = branded, formatted, customer-ready deliverable

This gives seller a real visible job instead of being a hidden transport layer.

### D. Clarify the Store around this flow

Each store product should explain:

- what the Interpreter will do
- what the Composer will produce
- whether Buyer enrichment may occur
- what final package the Seller will deliver

That makes the product understandable and premium.

---

## 11. Review Of The App By Surface

### Home page

What works:

- Strong visual system
- Good first impression
- Clear CTA structure

What is logically weak:

- It still sells a broad promise, but not a precise workflow
- Users do not leave the page with a simple model of which agent does what

Improve it by:

- making the 4-step flow explicit
- showing the commercial path, not just the studio fantasy

### Studio

What works:

- Best place to demonstrate internal agent intelligence
- Richest operational interface
- Strongest proof of real backend depth

What is logically weak:

- It is a hybrid of debug console, creative IDE, and end-user workspace
- The mode system is powerful, but still mentally heavier than it needs to be

Improve it by:

- making the main mode the canonical production path
- treating single-agent modes as advanced/internal views

### Store

What works:

- Strong commerce direction
- Good place for repeatable deliverables

What is logically weak:

- It should be the cleanest expression of your business logic, but it still feels secondary

Improve it by:

- making Store the clearest external purchasing surface
- aligning product descriptions to the new agent handoff model

### Seller API

What works:

- Already real and useful
- Good payment structure
- Strong foundation for agent-to-agent commerce

What is logically weak:

- The internal handoff story is not explicit enough

Improve it by:

- codifying the pipeline as Seller -> Interpreter -> Composer -> optional Buyer -> Seller

---

## 12. Detailed Improvement Plan

These are the improvements I would make in order.

### Phase 1: Make the architecture make sense

1. Rename `Strategist` to `Interpreter`
2. Rename `Researcher` to `Composer`
3. Update all UI copy and metadata to reflect the new names
4. Rewrite the agents page so each agent has one crisp responsibility
5. Update the home page and store page to explain the canonical sequence

### Phase 2: Reframe seller as intake + delivery

1. Keep seller as the public API boundary
2. Keep seller as the payment owner
3. Keep seller as the final packaging and delivery owner
4. Reduce seller's identity as the internal reasoning engine
5. Make Interpreter the formal owner of request structuring

### Phase 3: Formalize contracts

1. Create shared types for `IncomingOrder`, `StructuredBrief`, `EnrichmentRequest`, and `ComposedReport`
2. Stop duplicating document and pipeline types across UI files
3. Make each agent return a clearly typed artifact

### Phase 4: Upgrade the final deliverable model

1. Let Composer create raw content
2. Let Seller apply presentation/styling/output formatting
3. Add markdown/html/pdf-ready packaging logic later
4. Expose provenance in the final document:
   - structured by Interpreter
   - composed by Composer
   - optionally enriched by Buyer
   - delivered by Seller

### Phase 5: Add Buyer only when it has a clear gap to fill

1. Do not make Buyer part of the default explanation yet
2. Add it as an enrichment branch only
3. Trigger it only when:
   - data is too recent
   - marketplace asset quality is higher
   - the requested product explicitly allows/needs enrichment

---

## 13. Suggested Final User-Facing Story

This is the cleanest version of the product story.

### Simple explanation

"You send a request to the Seller. The Interpreter turns it into a structured brief. The Composer builds the report. If needed, the Buyer fetches third-party assets. Then the Seller packages and delivers the final document."

### Even shorter version

"Seller takes the order. Interpreter clarifies it. Composer builds it. Buyer enriches it when needed. Seller delivers it."

That is clear.
That is memorable.
That is extensible.

---

## 14. Suggested Future Agent Additions

These are the additions that fit your architecture best after the rename/restructure.

### Validator

Role:

- checks factual quality
- verifies citations
- scores confidence

Best place:

- after Composer
- before Seller packaging

### Formatter

Role:

- converts raw report into different presentation formats

You may not need this if Seller absorbs this job.

Given your desired model, I would **not** add a separate Formatter yet.
Let Seller own this.

### Monitor

Role:

- reruns compositions on a schedule
- delivers updates when topics change

This becomes compelling after the canonical workflow is stable.

---

## 15. Final Recommendation

Your requested direction is the right one.

The application should be reorganized conceptually as:

`Seller -> Interpreter -> Composer -> optional Buyer -> Seller`

That change will make:

- the app easier to explain
- the UI easier to simplify
- the seller API easier for outside agents to understand
- the future buyer enrichment step much cleaner
- the final deliverable ownership much more obvious

### If you only do five things next

1. Rename `Strategist` to `Interpreter`
2. Rename `Researcher` to `Composer`
3. Rewrite the seller workflow so Seller is intake/delivery and Interpreter is the first semantic step
4. Make Composer the clear owner of the report artifact
5. Add Buyer later only as an optional enrichment branch before final Seller delivery

That will make the whole application feel much more logical.

---

## 16. Build And Codebase Notes

Current observed runtime/dev status during review:

- Production build succeeds
- Lint passes with only minor warnings
- The codebase is strong enough to support this refactor without a rewrite

Notable engineering observations:

- The backend is ahead of the product narrative
- Types are still duplicated in a few UI-heavy areas
- The workflow naming should now become the main organizing principle for the next iteration

---

## 17. One-Sentence Product Definition After Refactor

**Auto Business is a commerce-ready agent workflow where the Seller accepts and delivers work, the Interpreter structures it, the Composer builds it, and the Buyer enriches it when necessary.**

---

## 18. External Best-Practice Enrichment

This section enriches the report with current external guidance from agent orchestration, API design, AI UX transparency, and Nevermined/x402 patterns, plus your own repo docs.

### A. Multi-agent orchestration best practices

Across current agent orchestration guidance, the strongest repeated advice is:

- specialize agents by role
- use explicit handoff contracts
- validate every boundary
- preserve provenance through the chain
- keep orchestration deterministic where possible

The most important external pattern that applies to your app is this:

**Do not let one LLM loosely "interpret" another LLM's freeform prose.**

Instead:

- Seller should pass structured input to Interpreter
- Interpreter should return a versioned structured brief
- Composer should consume a validated brief, not ambiguous text
- Buyer should only receive explicit enrichment requests
- Seller should package a structured report artifact, not infer delivery from raw content

That aligns very closely with your desired refactor.

### B. Long-running API best practices

External API guidance for long-running operations is very clear:

- if an operation can exceed about 10 seconds, do not block the request
- model the job as a first-class resource
- return a tracking token or operation object immediately
- provide explicit status transitions
- attach progress metadata and partial failure information

For Auto Business, this means your future seller/composer flow should not ultimately remain a long blocking POST if you want the architecture to feel professional.

Best-practice pattern:

1. `POST /api/orders` returns `202 Accepted`
2. response includes `jobId` and `statusUrl`
3. client polls or subscribes to `/api/orders/{jobId}`
4. job moves through states like:
   - `received`
   - `interpreting`
   - `composing`
   - `enriching`
   - `packaging`
   - `delivered`
   - `failed`
   - `cancelled`

That would make your API much more credible to external agent buyers and much easier to integrate.

### C. Nevermined / x402 monetization best practices

The current Nevermined guidance reinforces several important ideas:

- Seller should remain the payment-protected public boundary
- plans and agents should be clearly linked
- buyers should discover, order, get an access token, then call the protected endpoint
- pricing and access policy should live in a clean policy layer, not be tangled through business logic

That strongly supports your intended model:

- Seller stays public
- Seller verifies `payment-signature`
- Seller owns settlement
- internal semantic work happens behind Seller

The external best-practice lesson here is:

**keep commerce boundary and execution boundary separate, but connected**

That is exactly what your `Seller -> Interpreter -> Composer -> optional Buyer -> Seller` design does well.

### D. AI transparency UX best practices

External UX guidance on trustworthy AI systems consistently points to three trust requirements:

- visibility
- explainability
- accountability

For your app, that means users should be able to see:

- what the system is doing
- why each agent is involved
- when outside data was used
- what stage failed if something breaks
- what the final document contains and where it came from

The strongest design lesson for Auto Business is:

**show, explain, and guide**

In practical terms:

- show pipeline state
- explain why Buyer was called
- guide users with templates and example requests
- make provenance part of the final deliverable

### E. Your own docs already point in the same direction

Your repo docs reinforce this architecture nicely:

- `docs/DESIGN_GUIDE.md` pushes the idea that the system should feel like a visible live economy, not a hidden demo
- `docs/02_Nevermined_Platform_Reference.md` reinforces that Nevermined should own the commercial/payment boundary
- `docs/05_Apify_Integration.md` already describes a clean `search -> scrape -> synthesize` chain, which maps naturally to the `Composer`

So your own internal documentation already supports the refactor. The app logic just needs to catch up and become more explicit.

---

## 19. What The External Research Changes In This Report

The core recommendation does not change.

It becomes stronger and more specific:

`Seller -> Interpreter -> Composer -> optional Buyer -> Seller`

But external best practices add several requirements that should now be considered part of the design, not optional polish.

### A. Add versioned contracts between agents

This should now be considered mandatory for the new architecture.

Each contract should include:

- `schemaVersion`
- `jobId`
- `traceId`
- `createdAt`
- `sourceAgent`
- `targetAgent`
- typed payload

That gives you:

- replayability
- debuggability
- safer evolution
- easier external integrations

### B. Introduce a first-class job model

Right now the internal logic is pipeline-oriented, but the product should become **job-oriented**.

That means:

- Seller creates the job
- every stage updates the same job
- Studio and Store should both read from the same job lifecycle
- external buyers should be able to track jobs cleanly

Suggested job model:

- `jobId`
- `status`
- `input`
- `product`
- `brief`
- `report`
- `externalAssets`
- `delivery`
- `payment`
- `events`
- `errors`

### C. Prefer asynchronous delivery semantics for seller flows

If the seller flow can take longer than a few seconds, the external best-practice answer is:

- accept fast
- process asynchronously
- expose status cleanly
- let clients poll or stream

That is a major improvement over a single blocking seller response for long compositions.

### D. Treat Buyer as a formal sub-process, not a side effect

External orchestration guidance supports this strongly.

Buyer should only run when one of these is true:

- the brief explicitly requires third-party enrichment
- Composer reports a quality gap
- product policy says enrichment is required
- seller budget policy allows it

This prevents your architecture from feeling bloated.

### E. Treat Seller packaging as a real product step

This is one of the best consequences of your proposed architecture.

External AI UX guidance says final deliverables should visibly communicate:

- what was generated
- what was sourced
- what was purchased
- what confidence or provenance exists

So Seller should not just "send the response."

Seller should produce a customer-facing deliverable package with:

- title
- executive summary
- styled sections
- sources
- external asset disclosure
- job metadata
- timestamps
- order ID
- export formats

That makes Seller a meaningful end-stage, not an invisible wrapper.

---

## 20. Best-Practice Architecture For Auto Business

If you apply both your intended workflow and the external guidance, the best-practice version of the app becomes:

### Public architecture

- `Seller API` is the public commerce interface
- `Orders` are the first-class resource
- `Nevermined/x402` remains the trust and payment boundary

### Internal architecture

- `Interpreter` creates the execution contract
- `Composer` creates the artifact
- `Buyer` enriches only when policy or quality requires it
- `Seller` packages, settles, and delivers

### Data architecture

- structured contracts between every stage
- versioned payloads
- provenance preserved end to end
- job lifecycle persisted independently from UI

### UX architecture

- users see the state machine, not a spinner
- every agent has one visible responsibility
- every final deliverable explains where it came from

This is the version of the app that will make the most logical sense.

---

## 21. Concrete Improvements To Add To The App Now

These are the highest-value improvements based on both the code review and external research.

### Immediate architecture improvements

1. Rename `Strategist` to `Interpreter` everywhere
2. Rename `Researcher` to `Composer` everywhere
3. Define explicit handoff types in a shared module
4. Refactor seller so it no longer semantically "owns" briefing logic
5. Create a job lifecycle model with named states

### Immediate API improvements

1. Introduce a stable `jobId` for every seller request
2. Add idempotency support for external seller requests
3. Add a status endpoint for long-running seller jobs
4. Return structured metadata instead of only a final document blob
5. Preserve partial failures and stage-specific error information

### Immediate UX improvements

1. Show stage-level progress in Studio and Store
2. Explain why Buyer was used when enrichment happens
3. Show provenance in the final document
4. Distinguish internal draft output from final seller-delivered output
5. Replace vague agent descriptions with responsibility-based copy

### Immediate product improvements

1. Reposition the Store as the cleanest commercial expression of the system
2. Make Studio the internal execution console, not the only product story
3. Rewrite product cards to explain the new agent flow
4. Make the final delivery package feel premium and intentional
5. Treat external buyer integrations as a first-class product audience

---

## 22. Refined Final Recommendation

After enriching this review with external research and your own docs, my recommendation is:

Do the rename and workflow refactor exactly as you described, but implement it with three extra rules:

1. **Use structured, versioned contracts between agents**
2. **Move seller flows toward async job semantics for long operations**
3. **Make AI work visible and explainable in the UI and final deliverable**

That gives you a product that is not only more logical, but also more:

- interoperable
- scalable
- trustworthy
- marketable
- understandable to outside agent builders

### Updated one-sentence definition

**Auto Business should become a job-based agent commerce system where the Seller owns payment and delivery, the Interpreter structures intent, the Composer builds the report, and the Buyer enriches it only when required.**

