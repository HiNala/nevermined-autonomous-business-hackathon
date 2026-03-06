# Studio Page UI Audit

Route: `/studio`

## Overall Verdict

The Studio page contains the core product action, but it prioritizes system framing over task completion. A new user sees agent cards, mode chips, utilities, and side panels before the main input feels like the obvious next step.

## Major Issues

### 1. Primary action is pushed too low

- Severity: High
- Observation: the agent stack and surrounding controls dominate the upper screen, while the main prompt workflow feels secondary.
- Why it matters: Studio should feel like "type request -> run pipeline," not "study the orchestration layout first."
- Fix:
  - move the prompt box higher
  - reduce the visual height of the agent stack
  - collapse advanced controls behind a secondary panel or "advanced options" toggle

### 2. Too much interface chrome around the core task

- Severity: High
- Observation: the page contains agent chips, mode pills, utility buttons, tabs, workspace context controls, and example prompts before the user has done anything.
- Fix:
  - establish a clean default mode for first-time use
  - hide secondary tools until after the first run
  - keep the empty state focused on input, examples, and one clear explanation

### 3. Bottom UI elements compete for space

- Severity: Medium
- Observation: lower-page controls and fixed/sticky elements make the screen feel compressed, especially in narrow viewports.
- Fix:
  - audit sticky regions and bottom spacing
  - ensure the workspace context panel and action regions do not visually crowd each other
  - give the empty state more breathing room

## UX Problems

### 4. Pipeline explanation is overexposed

- Severity: Medium
- Observation: the page repeats agent roles even though the user is already inside the execution tool.
- Fix:
  - compress agent explanations into a compact summary
  - let the event log teach the flow once the user starts a run

### 5. Example prompts are useful but visually noisy

- Severity: Medium
- Observation: multiple example buttons create a crowded lower section instead of a clear set of guided starting points.
- Fix:
  - reduce to 3 top examples
  - style them as selectable templates rather than dense utility buttons

### 6. Tabs and utilities feel detached from user intent

- Severity: Medium
- Observation: tabs like jobs, transactions, library, judge, and tools are visible before the user understands when they matter.
- Fix:
  - keep only the most important tab visible by default
  - move admin/power-user tools into a secondary drawer or overflow menu

## Recommended Redesign Direction

Studio should open with:

1. a direct headline
2. the request box
3. 3 guided examples
4. a compact "what happens next" strip
5. expandable details for advanced users

## Acceptance Criteria

- The request box is visible and clearly primary on first load
- Advanced tools no longer compete with the first-run workflow
- Sticky or bottom-aligned UI does not crowd the main content
- The page feels like a workspace, not a systems diagram
