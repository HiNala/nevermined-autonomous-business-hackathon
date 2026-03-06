# Home Page UI Audit

Route: `/`

## Overall Verdict

The home page is doing far too much. It reads like a landing page, product spec, API explainer, services catalog, live feed, and FAQ hub all at once. The result is cognitive overload, weak hierarchy, and a page that feels busy before it feels convincing.

## Priority Bugs

### 1. Hydration mismatch in live content

- Severity: High
- Observation: the browser console reports a hydration mismatch on the home page, with dynamic transaction-feed values changing between server and client render.
- Why it matters: even when the user does not understand the technical issue, they feel it as instability, jank, or content shifting on load.
- Fix:
  - make live feed timing client-only
  - render stable placeholders server-side
  - avoid server-rendering content that depends on continuously changing timestamps

## UX And Content Problems

### 2. Too many competing CTAs in the hero

- Severity: High
- Observation: the hero includes the prompt box, submit button, multiple large CTA buttons, and several deep-link action chips. The user is asked to choose between too many paths immediately.
- Fix:
  - keep one primary CTA: `Open Studio`
  - keep one secondary CTA: `Browse Store`
  - move deep-link chips into a simpler "Try an example" module below the hero

### 3. Hero tries to explain the entire system

- Severity: High
- Observation: the first screen already introduces the full agent chain, feature badges, stats, and a dense value proposition paragraph.
- Fix:
  - shorten hero copy to one sharp promise and one proof point
  - compress the pipeline explanation into a single visual strip
  - defer deeper architecture explanation lower on the page or to `agents`

### 4. Page is far too long for a first-touch landing page

- Severity: High
- Observation: the home page includes sample output, full pipeline, API purchasing flow, agent roster, services, transaction feed, FAQ, and another closing CTA. Many of these sections repeat the same message in different forms.
- Fix:
  - keep only the highest-conviction sections:
    - hero
    - proof/sample output
    - simplified "how it works"
    - one CTA block
  - move API details and agent deep dives off the home page
  - cut or sharply condense the FAQ

### 5. Section sequence does not support conversion

- Severity: Medium
- Observation: after the hero, the user is asked to process too many explanatory sections before reaching a clean, conversion-oriented arc.
- Better order:
  - hero
  - sample output
  - how it works in 3 steps
  - trust/provenance proof
  - CTA

## Visual Cleanup

### 6. Card density is too high

- Severity: Medium
- Observation: the page stacks many glass cards and bordered modules with similar visual weight. It feels cluttered rather than premium.
- Fix:
  - reduce the number of bordered containers
  - let key sections breathe with more whitespace
  - use stronger contrast between primary sections and supporting details

### 7. Stats bar does not help the first-time visitor

- Severity: Medium
- Observation: hero-adjacent metrics are not persuasive in their current state and add chrome without clarity.
- Fix:
  - replace with stronger social proof or product proof
  - or hide stats on landing until real production values are available

### 8. FAQ is too long and heavy

- Severity: Medium
- Observation: the FAQ contains many entries and stretches the page deep into reference-document territory.
- Fix:
  - keep 5 to 6 most important questions
  - move the rest to docs or a dedicated FAQ/help page

## Recommended Redesign Direction

Rebuild the home page around one sentence: "Describe the work, get a structured deliverable in minutes." Everything else should support that claim, not compete with it.

## Acceptance Criteria

- Hero has at most 2 primary actions
- Home page is materially shorter
- Agent architecture is summarized, not fully documented
- No hydration mismatch or load instability
- Sample output remains, but duplicate explanatory sections are removed
