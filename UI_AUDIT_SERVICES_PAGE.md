# Services Page UI Audit

Route: `/services`

## Overall Verdict

The Services page has good raw content, but the first impression is fragile. Hero content appears delayed on first paint, and the page still leans too heavily on repeated bordered modules instead of a crisp services catalog hierarchy.

## Major Issues

### 1. Weak first paint / near-blank initial viewport

- Severity: High
- Observation: on initial load, the page can show mostly empty space before the hero resolves.
- Why it matters: this looks like a rendering problem, not a designed experience.
- Fix:
  - remove delayed entrance behavior from the hero
  - make headline and intro render immediately
  - animate only secondary sections

### 2. Hero-to-catalog transition is too soft

- Severity: Medium
- Observation: the hero, stats strip, pricing strip, and service cards all use similar pale card treatments. The hierarchy is present, but not strong enough.
- Fix:
  - increase contrast between intro surfaces and the actual service cards
  - simplify the number of stacked bordered modules before the first card grid

### 3. Repetition between catalog and lower prompt-builder section

- Severity: Medium
- Observation: the page explains service types, then later asks the user again what they need in a way that overlaps with Studio.
- Fix:
  - decide whether this page is for browsing services or initiating custom requests
  - if both are needed, make one clearly primary and the other secondary

## Visual Cleanup

### 4. Service cards need stronger differentiation

- Severity: Medium
- Observation: the three deliverables risk blending together because the overall visual language is so consistent.
- Fix:
  - give each service a clearer visual identity
  - make pricing, turnaround, and best-for use cases easier to scan

### 5. Too many framed containers before commitment

- Severity: Low
- Observation: the page uses several bars, panels, and card wrappers before the user gets into a decision flow.
- Fix:
  - collapse minor metadata into one compact row
  - let the service cards carry more of the page

## Recommended Redesign Direction

This page should behave like a clean deliverables catalog:

1. immediate headline and value proposition
2. visible service cards
3. concise pricing and delivery info
4. optional custom request handoff to Studio

## Acceptance Criteria

- Hero content appears immediately on page load
- Service cards are the visual center of the page
- The custom request module does not duplicate the core catalog story
