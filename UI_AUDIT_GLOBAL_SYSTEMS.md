# Global UI And Bug Audit

## Scope

These issues showed up across multiple routes and should be treated as shared-system fixes rather than one-off page tweaks.

## Critical Bugs

### 1. Mobile nav overlay is visually weak

- Severity: High
- Seen on: `agents`, likely all routes using the shared shell
- Problem: opening the nav leaves page content strongly visible underneath the menu. The overlay does not fully separate navigation from page content, so the menu feels unfinished and visually noisy.
- Fix direction:
  - Increase backdrop opacity and blur
  - Prevent underlying hero/cards from competing with the menu
  - Give the opened sheet a stronger surface, spacing, and z-layer separation

### 2. First-paint content delay / empty-above-the-fold behavior

- Severity: High
- Seen on: `services`, `agents`, and intermittently on other routes
- Problem: on initial load, the first viewport can appear mostly blank before hero content resolves. Even if this is animation-related rather than pure layout, it makes the site feel broken or slow.
- Fix direction:
  - Remove delayed entrance animations on primary hero copy
  - Ensure headline, eyebrow, and intro copy render immediately
  - Reserve animation for secondary cards, not the first screen

### 3. Shared responsive behavior is inconsistent

- Severity: High
- Seen on: `research`, plus likely any route using fixed multi-column shells
- Problem: layout containers do not consistently collapse at narrow widths, causing clipped panes, off-screen content, and awkward split layouts.
- Fix direction:
  - Audit all grid/flex layouts for minimum widths and hard-coded panel sizes
  - Add explicit stack behavior below tablet width
  - Remove horizontal overflow from content panes and sticky toolbars

## Cross-Page Polish Issues

### 4. Too many zero-state metrics

- Severity: Medium
- Seen on: `/`, `store`, `agents`, `studio`
- Problem: multiple screens show `0` usage, `0 cr`, or empty states in hero-adjacent modules. This makes the product feel inactive and prototype-like.
- Fix direction:
  - Replace with meaningful sample/demo values where appropriate
  - Or hide metrics entirely until the user has real data

### 5. Surface styling is too uniform

- Severity: Medium
- Seen on: nearly every page
- Problem: most cards share similar pale backgrounds, thin borders, and similar elevation. Important actions, supporting content, and decorative modules blend together.
- Fix direction:
  - Increase contrast between primary action surfaces and secondary informational surfaces
  - Use fewer card treatments with clearer roles
  - Establish a stronger hierarchy for hero, utility, and reference content

### 6. Too much product explanation on too many screens

- Severity: Medium
- Seen on: `/`, `services`, `agents`, `store`
- Problem: the same pipeline story appears repeatedly in slightly different forms. This increases page length without increasing clarity.
- Fix direction:
  - Pick one canonical page for deep architecture explanation
  - Keep other pages focused on their job: conversion, workflow, or reference

## Technical Bug

### 7. Home page hydration mismatch

- Severity: High
- Seen on: `/`
- Problem: the browser console shows a hydration mismatch tied to dynamic home page content, especially the transaction feed/timing output.
- Risk:
  - layout instability on load
  - rerender flashes
  - degraded trust in the UI
- Fix direction:
  - make time-based feed values client-only after mount, or render stable placeholders on the server
  - remove server/client drift in animated counters and feed rows

## Shared Acceptance Criteria

- No page content is cut off horizontally at narrow widths
- Mobile navigation fully obscures background content and feels intentional
- Hero content appears immediately on page load
- Zero-state metrics are either meaningful or hidden
- Shared page sections have clear visual hierarchy instead of card-on-card sameness
