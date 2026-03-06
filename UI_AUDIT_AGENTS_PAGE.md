# Agents Page UI Audit

Route: `/agents`

## Overall Verdict

The Agents page contains strong product detail, but it is too dense and too repetitive for the amount of user value it adds. It reads like an internal architecture page that has been styled as marketing rather than a focused explanation for customers.

## Major Issues

### 1. Weak first paint / delayed hero reveal

- Severity: High
- Observation: like `services`, this page can appear nearly blank before the hero resolves.
- Fix:
  - render hero content immediately
  - keep motion limited to below-the-fold elements

### 2. Mobile nav overlay needs a stronger backdrop

- Severity: High
- Observation: when the menu is opened, the underlying page remains too visible. The sheet feels translucent enough that the page still competes for attention.
- Fix:
  - increase overlay opacity and blur
  - strengthen the menu panel styling
  - reduce background visibility behind the open menu

### 3. Too much repeated explanation per agent

- Severity: High
- Observation: each agent includes role copy, pipeline position, receives/produces blocks, outputs, stats, and action links. The page becomes long and repetitive quickly.
- Fix:
  - keep one compact card per agent by default
  - reveal technical details only on expand
  - move full receives/produces/output detail into progressive disclosure

## Content And Hierarchy Issues

### 4. The page overlaps with home and services

- Severity: Medium
- Observation: it repeats pipeline and value explanation that already appears elsewhere.
- Fix:
  - treat this page as the one canonical "meet the agents" reference
  - reduce architecture duplication on other pages instead of repeating it here too

### 5. Metrics on agent cards add noise

- Severity: Medium
- Observation: runs, credits spent, and credits earned are not useful in zero state and clutter the cards.
- Fix:
  - hide these metrics until meaningful
  - or move them into a compact secondary row

### 6. Expansion section is still too heavy

- Severity: Medium
- Observation: the lower "smarter at every stage" section adds more process explanation after the page has already made the point.
- Fix:
  - compress this into a short upgrade summary
  - keep only the most user-relevant differentiators

## Recommended Redesign Direction

Make the page easier to scan:

1. short hero
2. 5 compact agent cards
3. optional expand for technical details
4. one short section on demo vs live context

## Acceptance Criteria

- Hero appears immediately on page load
- Open navigation cleanly separates menu from page content
- Agent cards are scan-friendly and materially shorter
- The page serves as the canonical deep-dive without becoming bloated
