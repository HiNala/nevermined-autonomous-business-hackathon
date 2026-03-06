# Research Page UI Audit

Route: `/research`

## Overall Verdict

This page has the clearest hard layout bug in the whole app. The split layout does not respond properly at narrow widths, so the right-side output area is visibly cut off and the page feels broken rather than merely unpolished.

## Critical Bugs

### 1. Right panel is clipped off-screen

- Severity: Critical
- Observation: the output pane is partially pushed off the right side of the viewport instead of stacking below the input/event-log column.
- User impact: the page immediately looks unfinished and users cannot confidently understand the intended workflow.
- Fix:
  - switch from side-by-side panels to stacked panels below tablet width
  - remove any fixed minimum width that prevents collapse
  - verify no horizontal overflow remains anywhere in the shell

### 2. Footer/status bar contributes to cramped layout

- Severity: High
- Observation: the lower status row and panel edges leave the page feeling boxed in and crowded, especially when paired with the clipped output region.
- Fix:
  - simplify the bottom status treatment
  - reduce persistent chrome in narrow viewports
  - make sure content regions, not scaffolding, own the space

## UX Problems

### 3. Empty state is too stark

- Severity: Medium
- Observation: the event log and output pane both sit in large blank containers with minimal guidance. Combined with the broken layout, the page feels dead.
- Fix:
  - give each pane a stronger empty state with one sentence and one visual cue
  - show a simple flow from query -> search -> output

### 4. Control stack is vertically heavy

- Severity: Medium
- Observation: query mode buttons, model selector, tools button, textarea, and event log are stacked in a way that eats a lot of vertical space before results exist.
- Fix:
  - compact the mode/model/tool controls into one tighter row
  - keep the query box visually dominant

### 5. Send action is too visually weak

- Severity: Medium
- Observation: the submit icon/button is small and gets lost inside a large pale textarea module.
- Fix:
  - increase contrast and emphasis on the run action
  - consider a clearer `Run Research` button label on narrow screens

## Recommended Redesign Direction

Treat the page as a responsive research workspace:

1. controls across the top
2. query composer next
3. event log and output stacked on mobile, split only on larger screens

## Acceptance Criteria

- No content is cut off horizontally
- Output pane stacks correctly on narrow viewports
- Empty state communicates the workflow clearly
- Query entry remains the strongest visual action
