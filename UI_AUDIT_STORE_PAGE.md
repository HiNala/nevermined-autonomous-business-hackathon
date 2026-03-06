# Store Page UI Audit

Route: `/store`

## Overall Verdict

The Store page is cleaner than the home page, but it still spends too much above-the-fold space explaining the pipeline instead of helping the user browse and buy something. It looks informational before it looks transactional.

## Main Issues

### 1. Hero is too explanatory for a storefront

- Severity: High
- Observation: the first screen focuses on describing the four-agent pipeline rather than putting products, pricing, and selection in front of the user.
- Fix:
  - keep a shorter line explaining fulfillment
  - move product cards or the first purchasable options above the fold

### 2. Zero-state metrics weaken trust

- Severity: Medium
- Observation: hero-adjacent values like fulfilled orders and credits settled show zero. That makes the store feel inactive.
- Fix:
  - remove demo-zero metrics
  - or replace with curated proof values/testimonial-style trust signals

### 3. Purchase path is not immediate enough

- Severity: Medium
- Observation: the hero explains how the system works in four steps, but the actual act of selecting a product is not the clear next action.
- Fix:
  - promote catalog/product cards above the process explanation
  - make one primary CTA explicit: `Choose a deliverable`

## Visual Cleanup

### 4. Benefits list feels like placeholder framing

- Severity: Medium
- Observation: bullets like delivery formats and credit info are useful, but the current treatment feels like supporting metadata without enough visual anchoring.
- Fix:
  - group pricing and delivery info into a compact trust bar
  - attach it directly to product selection rather than the hero intro

### 5. The four-step explainer is too similar to other pages

- Severity: Low
- Observation: it repeats architecture language already present elsewhere.
- Fix:
  - keep one short "how fulfillment works" note
  - use the rest of the screen for actual store inventory

## Recommended Redesign Direction

Make the page feel like a product shelf:

1. clear catalog headline
2. visible purchasable cards
3. short trust/pricing bar
4. minimal fulfillment explanation

## Acceptance Criteria

- A user can see real deliverable options without scrolling through system explanation first
- No zero-value metrics remain in the hero
- The page feels like commerce, not documentation
