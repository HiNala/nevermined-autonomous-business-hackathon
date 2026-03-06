# Seller-Led Third-Party Enrichment PRD

> Date: 2026-03-05
> Product: Auto Business
> Feature: Seller agent orchestrates third-party procurement and incorporates purchased assets into the final report
> Status: PRD

---

## 1. Executive Summary

This PRD defines how the `Seller` agent should be worked into the production pipeline as the commercial and orchestration boundary for third-party enrichment.

The core idea is:

1. A buyer submits a request to the `Seller`
2. The `Seller` plans fulfillment and decides whether outside data is needed
3. The `Seller` invokes internal agents to produce the report
4. When needed, the `Seller` instructs the `Buyer` agent to purchase one or more third-party assets
5. Purchased content is merged into the report
6. The `Seller` delivers the final enriched report

This feature already partially exists in the backend, but it needs to be formalized as a product capability with clearer behavior, settings, UI constraints, demo rules, and artifact packaging.

The most important product constraint is:

**Third-party marketplace purchasing must be disabled for internal UI demo flows, because payments cannot be transacted from the UI today. Third-party purchasing should remain available for agentic/external seller flows that can complete x402/Nevermined transactions.**

This means the system must support two execution modes:

- `UI Demo Mode`: Seller flow visible, third-party purchasing off
- `Agentic Live Mode`: Seller flow live, third-party purchasing on when policy allows

---

## 2. Problem Statement

Auto Business already has:

- a `Seller` route
- a `Seller` fulfillment planner
- a `Buyer` agent
- marketplace purchase logic
- document merging of purchased assets
- settings toggles for `externalTrading` and `sellerEnabled`

However, the full product behavior is not yet formalized.

The current gaps are:

- the `Seller`-led enrichment path is not described as a first-class feature
- UI demo flows can accidentally imply capabilities that are not safe to transact from the UI
- third-party enrichment is not yet framed as a controlled, policy-driven step
- there is no clearly specified final delivery package for enriched reports
- settings behavior for demo versus agentic execution is not yet defined as product policy
- report incorporation logic exists, but the user-facing experience and acceptance criteria are not formalized

Without a clear PRD, this feature risks becoming:

- confusing in demos
- hard to explain
- inconsistent across `Studio`, `Store`, and API surfaces
- risky from a payment/operations perspective

---

## 3. Product Vision

Auto Business should support a professional seller-led enrichment flow where:

- the `Seller` is the public intake and delivery boundary
- the `Seller` decides whether external enrichment is needed
- the `Buyer` acts as a subordinate procurement specialist
- purchased third-party content becomes part of the final report when it improves quality
- the entire workflow is transparent, controllable, and safe for demos

The ideal product story is:

**The Seller accepts the order, plans the fulfillment strategy, calls the internal generation pipeline, optionally buys third-party data through the Buyer agent when needed, merges it into the report, and delivers the final package.**

---

## 4. Goals

### Primary goals

- make seller-led third-party enrichment a clear first-class feature
- allow external/agentic seller orders to buy third-party assets and merge them into reports
- keep UI demo flows safe by disabling third-party purchases in settings
- make enriched outputs visibly different from standard outputs
- define a clean report integration and delivery model

### Secondary goals

- improve trust by making enrichment visible and explainable
- strengthen Nevermined/x402 as the commerce boundary
- make the system easier to demo, judge, and explain

### Non-goals

- enabling direct end-user payment from the UI
- building a general marketplace browser in the UI
- supporting arbitrary manual asset purchases from the Studio
- introducing new agents beyond the current four

---

## 5. Users And Use Cases

### Primary users

- external agents buying from the seller API
- judges or internal operators demoing the system via UI
- internal developers testing seller flows

### Secondary users

- future B2B customers using seller-delivered reports
- marketplace providers whose assets may be purchased by the Buyer

### Core use cases

#### Use case 1: External agent orders an enriched report

- external agent calls the `Seller`
- payment is verified through x402/Nevermined
- `Seller` decides external data would improve output
- `Buyer` purchases third-party assets
- purchased data is merged into the report
- `Seller` returns final report and transaction details

#### Use case 2: Internal UI demo of seller flow

- operator runs Seller mode from `Studio` or `Store`
- `Seller` plans fulfillment and shows that external enrichment could occur
- settings disable actual external purchasing
- report is generated with internal pipeline only
- UI clearly indicates that third-party buying was disabled for demo mode

#### Use case 3: Internal UI with seller enabled but external procurement disabled

- operator wants to show seller orchestration logic
- `sellerEnabled` is on
- `externalTrading` is off
- result shows Seller -> Strategist -> Researcher -> packaged delivery
- Buyer step is skipped with an explicit reason

---

## 6. Current State In Code

The current codebase already supports much of the backend behavior needed.

### Existing backend support

- `POST /api/agent/seller` handles seller orders
- seller route supports external x402 verification and settlement
- `fulfillSellerOrder()` in `src/lib/agent/pipeline.ts` already:
  - receives seller order
  - runs seller planning
  - generates strategist brief
  - runs researcher document generation
  - optionally calls Buyer to purchase third-party assets
  - merges purchased asset content into the report
- `runBuyer()` already supports targeted DID purchases
- settings already support:
  - `externalTrading`
  - `sellerEnabled`
  - `nvmTracking`

### Existing UI support

- settings panel already exposes `External Marketplace` and `Seller Agent`
- Studio already has Seller mode in the main page logic
- tool settings are already passed from UI to the server for internal requests

### What is missing product-wise

- clear PRD and execution policy
- explicit demo-safe behavior definition
- formal seller packaging model
- explicit UI messaging about why Buyer is skipped in demo mode
- a defined enriched-report format

---

## 7. Proposed Solution

We will formalize the seller-led enrichment path as a controlled feature with two distinct execution contexts.

### Execution Context A: UI Demo Mode

Definition:

- request originates from internal UI
- payment is not transacted from the UI
- third-party purchases must be disabled

Behavior:

- `Seller` still plans whether external data would be useful
- `Seller` may show that enrichment was considered
- `Buyer` does not transact
- final report is generated from internal pipeline only
- UI explicitly states that external procurement was skipped because demo mode disables third-party purchasing

Settings policy:

- `sellerEnabled`: can be on
- `externalTrading`: should be off for demos

### Execution Context B: Agentic Live Mode

Definition:

- request originates from external agent / agentic caller
- x402/Nevermined payment flow is available
- seller route may purchase third-party assets if policy allows

Behavior:

- `Seller` plans fulfillment
- if external enrichment is justified, `Buyer` procures assets
- purchased content is merged into the report
- final enriched deliverable is returned

Settings/policy:

- external seller calls can transact agentically
- procurement allowed only when policy allows and valid target services exist

---

## 8. Canonical Workflow

### Standard seller enrichment workflow

1. Buyer submits request to `Seller`
2. `Seller` validates request and payment context
3. `Seller` matches product and runs fulfillment planning
4. `Seller` decides whether external enrichment is needed
5. `Seller` dispatches to `Strategist`
6. `Strategist` creates structured brief
7. `Seller` dispatches to `Researcher`
8. `Researcher` creates report draft
9. If needed, `Seller` dispatches to `Buyer`
10. `Buyer` purchases third-party assets
11. Purchased content is normalized and merged into the report
12. `Seller` packages final deliverable
13. `Seller` returns enriched report and metadata

### UI demo workflow

1. UI request triggers seller flow
2. `Seller` evaluates whether enrichment would help
3. system sees `externalTrading = false`
4. `Buyer` is skipped
5. report is generated with internal sources only
6. UI surfaces: "External procurement disabled in demo mode"

---

## 9. Functional Requirements

### FR1: Seller must own the enrichment decision

The system must treat external procurement as a seller-led planning decision, not a default behavior.

Requirements:

- `Seller` decides whether third-party data is needed
- the decision must be based on:
  - product type
  - request characteristics
  - available external services
  - budget/policy constraints

### FR2: Buyer must operate as a subordinate procurement specialist

Requirements:

- `Buyer` should only run when the `Seller` plan says external enrichment is required
- `Buyer` should receive either:
  - targeted service DIDs
  - a bounded procurement request
- `Buyer` should return:
  - purchased assets
  - status of each purchase
  - credits spent
  - any errors

### FR3: Purchased content must be incorporated into the report

Requirements:

- purchased asset content must be appended or merged into the report
- the final report must clearly distinguish external material from base research
- each purchased asset used must be visible in the final artifact metadata

Minimum merge behavior:

- add each external asset as a named report section

Preferred future behavior:

- integrate the strongest purchased findings into existing report sections plus appendix disclosure

### FR4: UI demo mode must disable real procurement

Requirements:

- if request comes from internal UI and `externalTrading` is off, no third-party purchase may occur
- the pipeline must continue successfully without procurement
- events and final output must explicitly explain why procurement was skipped

### FR5: Settings must control seller and procurement behavior clearly

Requirements:

- `sellerEnabled` controls whether Seller mode is available for internal UI execution
- `externalTrading` controls whether third-party procurement is allowed for internal UI execution
- settings copy must clearly explain that UI demos should keep external procurement off

### FR6: Final output must include enrichment metadata

Requirements:

- final seller response must include:
  - whether external data was used
  - count of purchased assets
  - names/providers of purchased assets
  - credits spent externally
  - reason enrichment was skipped if it did not happen

### FR7: The system must remain safe when procurement is disabled

Requirements:

- disabling procurement must not break seller flow
- Seller should still deliver a valid report using internal pipeline only

---

## 10. Settings And Demo Policy

This section is one of the most important parts of the PRD.

### Current available toggles

The current settings model already includes:

- `internalTrading`
- `externalTrading`
- `sellerEnabled`
- `nvmTracking`

### Required behavior

#### For UI demos

Recommended demo settings:

- `sellerEnabled = true`
- `externalTrading = false`
- `internalTrading = true` or `false`, depending on desired demo story
- `nvmTracking = optional`

Meaning:

- show the Seller in the pipeline
- allow seller orchestration from UI
- do not permit actual third-party procurement from UI

#### For live agentic seller transactions

Recommended live settings/policy:

- seller endpoint active
- x402 verification/settlement active
- third-party procurement allowed when plan requires it

### Required UI copy

The settings copy should make this explicit:

Suggested text:

- `External Marketplace`: "Buyer agent purchases third-party assets from Nevermined. Keep this OFF for UI demos. Turn ON only for agentic/live procurement flows."

Suggested seller mode banner text:

- "Demo mode: seller orchestration is visible, but external third-party procurement is disabled in the UI."

---

## 11. Detailed User Flows

### Flow A: Internal UI demo with seller enabled and procurement off

1. User opens `Studio`
2. User enables `Seller Agent`
3. User keeps `External Marketplace` off
4. User submits seller request
5. `Seller` plans fulfillment and may decide external data would help
6. pipeline reaches procurement stage
7. system checks `externalTrading = false`
8. Buyer does not transact
9. event emitted: procurement skipped due to demo settings
10. Seller delivers internal-only report
11. UI indicates:
   - external enrichment considered
   - external procurement disabled for demo mode

### Flow B: External agentic request with procurement on

1. External caller discovers seller endpoint
2. External caller receives 402/payment-required response
3. External caller acquires x402 token
4. External caller retries with payment signature
5. `Seller` verifies payment best-effort
6. `Seller` plans fulfillment
7. `Seller` invokes `Strategist`
8. `Seller` invokes `Researcher`
9. `Seller` decides to enrich and instructs `Buyer`
10. `Buyer` purchases target third-party assets
11. purchased content is merged into report
12. `Seller` settles credits and returns final enriched report

---

## 12. Report Incorporation Model

This section defines how purchased third-party content should appear in the final report.

### Current minimum model

Current behavior in code:

- purchased assets are converted into extra document sections
- section heading format:
  - `External Data: <asset name>`

This is acceptable as a first implementation.

### Required enriched report structure

The enriched report should contain:

#### 1. Core report body

- internally generated report sections from `Researcher`

#### 2. External enrichment sections

- purchased asset content represented in dedicated sections

#### 3. Enrichment summary block

At the top or bottom of the report:

- whether third-party data was used
- which providers contributed
- how many assets were purchased
- credits spent on enrichment

#### 4. Source and provenance appendix

- web research sources
- external purchased assets
- seller delivery metadata

### Future preferred merge model

Later enhancement:

- do not only append purchased content raw
- use an additional synthesis pass to blend purchased findings into the main report while preserving disclosure

For now, the minimum acceptable behavior is:

- append and clearly label third-party sections

---

## 13. UX Requirements

### UX1: Users must understand whether enrichment happened

The UI must clearly show one of three states:

- enrichment used
- enrichment available but skipped by policy
- enrichment not needed

### UX2: Seller flow must remain demo-safe

The UI must not imply that clicking in the Studio directly executes third-party payments.

### UX3: Events must narrate the procurement branch

The events feed should include messages like:

- "Seller requested external enrichment"
- "External procurement disabled in demo mode"
- "Buyer purchased 2 external assets"
- "2 external assets merged into deliverable"

### UX4: Final output should expose enrichment metadata

The output view should show:

- purchased asset count
- external providers used
- whether external procurement was skipped

### UX5: Store and Studio should tell the same story

Both surfaces should reflect the same model:

- Seller owns intake and delivery
- Buyer is optional enrichment
- UI demo mode disables real procurement

---

## 14. API Requirements

### Seller route behavior

The seller API should continue to support:

- `GET /api/agent/seller`
- `POST /api/agent/seller`

### Required response fields for seller result

Seller responses should include:

- `status`
- `orderId`
- `product`
- `fulfillmentPlan.reasoning`
- `fulfillmentPlan.usedExternalData`
- `document`
- `brief`
- `purchasedAssets`
- `transactions`
- `events`
- `totalCredits`
- `totalDurationMs`

### Required future response metadata

Add or standardize:

- `procurementStatus`
- `procurementSkippedReason`
- `externalCreditsSpent`
- `externalProviders`
- `enrichmentSummary`

### Proposed enum: procurement status

- `not_needed`
- `disabled_in_demo`
- `disabled_by_policy`
- `attempted_none_purchased`
- `purchased_and_merged`
- `failed_and_skipped`

---

## 15. Settings Requirements

### Current requirement

Use existing settings instead of inventing a new toggle system.

### Product decision

The current `externalTrading` toggle should be the main control for demo safety in internal UI requests.

### Recommended product wording changes

#### Existing toggle

`External Marketplace`

#### Recommended description

"Buyer agent discovers and purchases outputs from third-party agents on the Nevermined marketplace. Keep OFF for UI demos. Use ON only for agentic/live procurement flows."

### Optional future enhancement

If needed later, add a more explicit derived label in UI:

- `Demo-safe procurement mode`

But this is optional. The existing toggle can carry the behavior if copy is clear.

---

## 16. Acceptance Criteria

### Demo-safe behavior

- internal UI seller runs succeed with `sellerEnabled = true` and `externalTrading = false`
- no third-party purchase occurs in that mode
- output explicitly says procurement was skipped due to demo settings

### Agentic live behavior

- external seller calls can still run procurement when policy allows
- purchased assets are returned in `purchasedAssets`
- purchased content is incorporated into the report

### Report behavior

- final report remains valid even when no purchase occurs
- final report clearly labels externally purchased sections when they exist
- final output includes enrichment metadata

### UX behavior

- settings explain demo-safe procurement policy
- event stream clearly narrates whether procurement happened or was skipped

### Reliability behavior

- procurement failures do not crash the full seller pipeline
- seller still returns best-possible internal report when external procurement fails

---

## 17. Risks

### Risk 1: Demo confusion

Users may think the UI can transact external payments directly.

Mitigation:

- explicit settings copy
- explicit event messages
- explicit output disclosure

### Risk 2: Hidden procurement costs

Third-party buying could feel opaque.

Mitigation:

- visible procurement status
- visible purchased assets
- visible external credits spent

### Risk 3: Weak report integration

Purchased content may feel bolted on instead of integrated.

Mitigation:

- minimum labeled append model now
- planned synthesis pass later

### Risk 4: Policy inconsistency across UI and API

Behavior may differ in confusing ways.

Mitigation:

- define internal UI and external agentic execution contexts explicitly
- document them in code and UI copy

---

## 18. Rollout Plan

### Phase 1: Product formalization and demo safety

- keep current backend enrichment path
- formalize `externalTrading` as demo-safe procurement gate for UI
- update settings copy
- update event copy for procurement skipped vs used
- add final output metadata for procurement status

### Phase 2: Better enriched output packaging

- add enrichment summary block to final report
- add procurement status enum to seller output
- better labeling of external sections

### Phase 3: Stronger synthesis of purchased assets

- add optional post-purchase synthesis pass
- blend purchased findings into main report
- preserve full disclosure in appendix

### Phase 4: Async seller jobs

- move seller flows toward job/status semantics
- improve external integration quality

---

## 19. Open Questions

These should be resolved during implementation planning.

1. Should UI demo mode always force `externalTrading = false`, or just recommend it?
2. Should Store orders from internal UI ever simulate procurement results, or always skip cleanly?
3. Should purchased asset content remain appended raw, or should an additional synthesis step be required before delivery?
4. Should seller output expose a dedicated `deliveryPackage` object in addition to `document`?
5. Should there be a visible "enrichment eligible" badge on products that may use third-party data?

---

## 20. Final Recommendation

The right product model is:

**Seller owns intake, planning, policy, and delivery. Buyer only procures third-party assets when Seller decides enrichment is worth it. UI demos keep procurement off through settings, while agentic external flows remain capable of real third-party purchases and report enrichment.**

That gives you:

- a strong demo story
- a clean architecture story
- a safe UI policy
- a real agentic commerce story
- a practical path to richer reports

