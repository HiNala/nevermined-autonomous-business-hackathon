# UI Audit Summary

Audit date: 2026-03-06
Environment: local app on `http://127.0.0.1:3000`
Coverage: `/`, `/studio`, `/research`, `/store`, `/services`, `/agents`
Viewport note: audit was performed in a narrow browser viewport where responsive breakpoints and overlay behavior were easy to surface.

## What This Pack Contains

- `UI_AUDIT_GLOBAL_SYSTEMS.md`: cross-page bugs and shared layout/navigation issues
- `UI_AUDIT_HOME_PAGE.md`: home page cleanup and simplification plan
- `UI_AUDIT_STUDIO_PAGE.md`: studio workflow and layout issues
- `UI_AUDIT_RESEARCH_PAGE.md`: research page layout bugs and UX fixes
- `UI_AUDIT_STORE_PAGE.md`: storefront clarity and conversion issues
- `UI_AUDIT_SERVICES_PAGE.md`: services page hierarchy and density fixes
- `UI_AUDIT_AGENTS_PAGE.md`: agents page readability and content pruning

## Highest-Priority Findings

1. `research` has a real responsive layout bug: the right-side output pane is visibly cut off and pushed off-screen instead of collapsing into a stacked layout.
2. The global mobile navigation overlay is too transparent, so page content bleeds through and competes with the menu.
3. The home page is overstuffed. It tries to explain the whole product, the pipeline, API flow, services, transaction feed, FAQ, and CTA story all on one screen path.
4. `studio` hides the core action too low in the page. Users see the pipeline chrome first and the actual prompt workflow second.
5. Several pages appear to delay or hide their hero content on first paint, creating a blank or near-blank initial viewport before content settles in.
6. The home page shows a live hydration mismatch in the browser console, tied to dynamic transaction feed timing/state.

## Recommended Work Order

1. Fix shared layout bugs first: responsive grid collapse, nav overlay, sticky/footer overlap, first-paint behavior.
2. Simplify the home page second, since it is the main brand and acquisition surface.
3. Rework `studio` and `research` third, because they are the primary product surfaces.
4. Polish `services`, `agents`, and `store` last once shared spacing, card, and navigation patterns are stable.

## Suggested Team Split

- Engineer 1: shared shell, nav, responsive layout primitives
- Engineer 2: home page simplification and visual hierarchy cleanup
- Engineer 3: studio + research workflow UX and panel layout fixes
- Engineer 4: services + agents + store marketing page polish
