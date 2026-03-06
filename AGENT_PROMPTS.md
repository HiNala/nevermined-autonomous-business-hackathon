# Undermind — Agent Improvement Prompts

Run these one at a time in order. Each prompt is self-contained: the agent will audit
the relevant area, produce a prioritised todo list, and then execute all items automatically.
Push to GitHub after each prompt completes.

---

## Prompt 1 — Type Safety & Duplicate Interface Audit

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit and fix all TypeScript type-safety issues across the codebase.

Step 1 — Review:
- Run `npm run build` and capture every TypeScript error and warning.
- Search for duplicate interface definitions. Key known duplicate: `PipelineStage` and `PipelineEvent` are defined in BOTH `src/types/pipeline.ts` AND `src/lib/agent/pipeline.ts`. There are likely others.
- Search for any `any` types that could be narrowed.
- Search for non-null assertions (`!`) that could be replaced with proper guards.
- Check that `visionResult` in `src/lib/agent/pipeline.ts` local interface exactly matches `src/types/pipeline.ts`.

Step 2 — Build a todo list of every issue found, prioritised high/medium/low.

Step 3 — Execute all items:
- Consolidate duplicate types: remove the local definitions in `pipeline.ts` and import from `@/types/pipeline` instead.
- Narrow `any` types with proper interfaces.
- Replace unsafe `!` assertions with null checks or early returns.
- Re-run `npm run build` after each major change to verify no regressions.

Step 4 — Commit: `git add -A && git commit -m "fix: TypeScript type consolidation and safety audit"` then `git push origin main`.
```

---

## Prompt 2 — API Route Hardening & Error Handling

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit every API route under `src/app/api/` and harden error handling, input validation, and response consistency.

Step 1 — Review every route file and build a todo list covering:
- Routes that catch errors but return no `status` code (defaulting to 200 on errors).
- Routes that do not validate their request body before using it.
- Routes missing rate limiting (check `src/lib/security.ts` — `checkRateLimit` exists; verify all routes that should use it do).
- Routes that leak internal error messages or stack traces to the client.
- Inconsistent response shapes — some routes return `{ error }`, others return `{ message }`.
- The `mode === "seller"` branch in `/api/pipeline/run/route.ts` does not pass `visionResult` in its response — check all modes are consistent.
- Any route that calls `JSON.parse` without a try/catch.
- Missing `export const dynamic = "force-dynamic"` on routes that read env vars or use stateful stores.

Step 2 — Execute all todo items:
- Add missing rate limiting using the existing `checkRateLimit` from `@/lib/security`.
- Standardise error response shape to `{ error: string }` with correct HTTP status codes.
- Add request body validation where missing.
- Add `export const dynamic = "force-dynamic"` to stateful routes.

Step 3 — Run `npm run build`, fix any errors, then commit:
`git add -A && git commit -m "fix: API route hardening — rate limiting, error shapes, input validation"` then `git push origin main`.
```

---

## Prompt 3 — Performance: studio-page.tsx Refactor

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: `src/components/pages/studio-page.tsx` is a very large file (3000+ lines). Audit it for performance and maintainability issues and execute improvements.

Step 1 — Read the file fully and build a todo list covering:
- Inline component definitions that cause re-renders on every parent render (functions defined inside the main component body that should be extracted to module-level or separate files).
- `useState` + `useEffect` patterns that could be custom hooks — extract to `src/hooks/`.
- Large static data arrays (like `EXAMPLE_PROMPTS`, `AGENT_CONFIG`) that should be module-level constants, not inside components.
- `VisionImageBanner` component — it is currently defined inline inside `studio-page.tsx`; extract it to `src/components/ui/vision-image-banner.tsx`.
- `DocumentView` component — evaluate whether it can be split into `src/components/pages/document-view.tsx`.
- Any `useEffect` with missing or incorrect dependency arrays (potential stale closures).
- Any event handler that is recreated on every render and should be wrapped in `useCallback`.
- Any derived state that is computed inside render and should use `useMemo`.

Step 2 — Execute all items. For each extraction:
- Create the new file.
- Update the import in `studio-page.tsx`.
- Verify the build still passes with `npm run build`.

Step 3 — Commit: `git add -A && git commit -m "refactor: extract VisionImageBanner, DocumentView, and hooks from studio-page"` then `git push origin main`.
```

---

## Prompt 4 — Pipeline Agent Error Resilience

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit `src/lib/agent/pipeline.ts`, `src/lib/agent/researcher.ts`, `src/lib/agent/buyer.ts`, and `src/lib/agent/seller.ts` for error resilience and timeout handling.

Step 1 — Read all four files and build a todo list covering:
- Any `await` call with no timeout — long-running LLM or external API calls can hang indefinitely. Add `Promise.race` timeouts (30s for LLM, 20s for external APIs, 60s for full pipeline).
- Any `catch` block that silently swallows errors without emitting a pipeline event or logging.
- The `runVisionAgent` call in `pipeline.ts` — verify it is wrapped in try/catch and never throws to the caller.
- `runBuyer` — verify it has a fallback when the Nevermined marketplace returns empty or throws.
- `runResearch` in `researcher.ts` — verify each of the 5 search paths (Exa, Apify, DuckDuckGo, raw fetch) has individual error isolation so one failing path doesn't kill the run.
- Any place where a single failed sub-task causes the entire pipeline to throw instead of degrading gracefully.
- Missing `AbortController` usage on `fetch` calls that should be cancellable.

Step 2 — Execute all todo items:
- Add timeout wrappers using a shared `withTimeout(promise, ms)` utility in `src/lib/utils.ts`.
- Ensure every catch block either rethrows with context or emits a warning event and continues.
- Add `AbortController` with a signal to any raw `fetch` calls without one.

Step 3 — Run `npm run build`, fix any errors, then commit:
`git add -A && git commit -m "fix: pipeline timeout wrappers, error resilience, and graceful degradation"` then `git push origin main`.
```

---

## Prompt 5 — Accessibility (a11y) Audit

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit all components for accessibility issues and fix them.

Step 1 — Read the following files and build a prioritised todo list:
- `src/components/pages/studio-page.tsx`
- `src/components/layout/nav.tsx`
- `src/components/sections/hero-section.tsx`
- `src/components/ui/judge-mode.tsx`
- `src/components/ui/sponsor-rail.tsx`
- `src/components/ui/settings-panel.tsx`

Issues to look for:
- Interactive `<div>` or `<span>` elements with `onClick` but no `role`, `tabIndex`, or keyboard handler (`onKeyDown`).
- `<img>` tags with missing or empty `alt` text. The `VisionImageBanner` image in `studio-page.tsx` uses `alt={title}` — verify `title` is never undefined/empty.
- Form inputs without associated `<label>` elements or `aria-label`.
- Buttons with no visible or `aria-label` text (icon-only buttons).
- Missing `aria-expanded`, `aria-controls` on accordion/toggle components.
- The mobile nav drawer — verify it has `aria-modal`, `role="dialog"`, and focus trap.
- Color contrast — check that `var(--gray-400)` text on `var(--bg-surface)` backgrounds meets WCAG AA (4.5:1 for normal text).
- The lightbox overlay in `VisionImageBanner` — verify it traps focus and pressing Escape closes it.

Step 2 — Execute all fixes. For Escape key in lightbox, add a `useEffect` with a `keydown` listener.

Step 3 — Run `npm run build`, fix any errors, then commit:
`git add -A && git commit -m "fix: accessibility — keyboard nav, aria labels, focus trapping, alt text"` then `git push origin main`.
```

---

## Prompt 6 — SEO, Metadata & OG Image Audit

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit and complete all SEO metadata across every page route.

Step 1 — Read `src/app/layout.tsx` and every `page.tsx` file under `src/app/` and build a todo list:
- Pages missing a `metadata` export: check `/studio`, `/store`, `/services`, `/agents`, `/research`.
- `layout.tsx` — verify `metadataBase`, `openGraph`, `twitter` card, `robots`, and `keywords` are fully populated.
- Check that every page `metadata.description` is unique (not the same boilerplate) and under 160 characters.
- Check that `metadata.title` on each page follows the pattern `"Page Name — Undermind"`.
- Verify a `sitemap.ts` or `sitemap.xml` exists under `src/app/` — if not, create one listing all static routes.
- Verify a `robots.ts` exists under `src/app/` — if not, create one allowing crawl of public pages and disallowing `/api/`.
- Check `public/` for an `og-image.png` (1200x630) — if missing, note it as a manual task but add a placeholder reference in metadata.
- The `/agents` page `metadata.description` was recently updated — verify it is under 160 chars.

Step 2 — Execute all items:
- Add missing metadata exports.
- Create `src/app/sitemap.ts` if missing.
- Create `src/app/robots.ts` if missing.
- Fix any description length violations.

Step 3 — Run `npm run build`, fix any errors, then commit:
`git add -A && git commit -m "feat: SEO — sitemap, robots.txt, complete page metadata"` then `git push origin main`.
```

---

## Prompt 7 — Mobile Responsiveness Audit

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit and fix mobile responsiveness across all pages and key components.

Step 1 — Read the following files and build a todo list of layout issues at < 640px (sm breakpoint) and 640px–1024px (md breakpoint):
- `src/components/pages/studio-page.tsx` — the left sidebar, event stream panel, and DocumentView. Verify the 3-column layout collapses sensibly on mobile.
- `src/components/sections/hero-section.tsx` — the pipeline step animation may overflow on very narrow screens.
- `src/components/sections/agent-cards.tsx` — now uses `xl:grid-cols-5`; verify 5 cards don't cause overflow on tablet.
- `src/components/ui/judge-mode.tsx` — the preset cards grid.
- `src/components/ui/sponsor-rail.tsx` — the horizontal badge strip; verify it wraps or scrolls.
- `src/components/pages/agents-page.tsx` — the `AgentDetailCard` two-column layout.
- The `VisionImageBanner` lightbox — verify the overlay and image are correctly sized on mobile (max-height, padding).
- Any hardcoded `px` widths that should use `max-w-` or `w-full` instead.
- Text sizes that are too large on mobile (e.g. `text-[4.5rem]` in hero — check it has a mobile override).

Step 2 — Execute all fixes using Tailwind responsive prefixes (`sm:`, `md:`, `lg:`).

Step 3 — Run `npm run build`, fix any errors, then commit:
`git add -A && git commit -m "fix: mobile responsiveness — hero, studio sidebar, agent cards, lightbox"` then `git push origin main`.
```

---

## Prompt 8 — Settings Persistence & State Management

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit all client-side state in the Studio page that should be persisted across page refreshes, and implement localStorage persistence where appropriate.

Step 1 — Read `src/components/pages/studio-page.tsx` and `src/lib/tool-settings.ts` and build a todo list:
- `toolSettings` state — currently resets to defaults on every page load. Users who have configured Apify/Exa/VISION toggles lose their settings on refresh. Persist to `localStorage` under key `"ab:toolSettings"`.
- `viewMode` (pipeline / strategist / researcher / seller) — should persist so the user returns to their last mode.
- `outputType` — should persist per mode.
- Check if `workspaceId` is persisted or regenerated — if regenerated, jobs history is lost on refresh.
- `judgeMode` open/closed state — does NOT need to persist (intentional fresh state).
- Create a custom hook `src/hooks/use-local-storage.ts` that safely wraps `localStorage` (handles SSR, JSON parse errors, and storage quota errors).
- Replace direct `useState` calls for the above values with the new hook.
- Verify the hook handles the case where `localStorage` is unavailable (private browsing, some iOS Safari configurations).

Step 2 — Execute all items. Ensure the hook uses `useEffect` for initial hydration to avoid SSR/hydration mismatch.

Step 3 — Run `npm run build`, fix any errors, then commit:
`git add -A && git commit -m "feat: persist toolSettings, viewMode, and outputType to localStorage"` then `git push origin main`.
```

---

## Prompt 9 — Loading States, Skeleton Screens & Empty States

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Audit all loading and empty states across the app and improve them for polish and user experience.

Step 1 — Read `src/components/pages/studio-page.tsx`, `src/components/pages/agents-page.tsx`, `src/components/sections/agent-cards.tsx`, and any loading skeleton components, then build a todo list:
- The agents page fetches live stats from `/api/pipeline/stats` — while loading, it renders `"—"` for all stat values. Add a skeleton shimmer instead.
- The `AgentCards` section on the home page has the same issue with live stats.
- The Studio page `DocumentView` — when the pipeline is running, the document area shows a `LoadingSkeleton`. Verify all pipeline stages have a matching label in the skeleton stage map, especially `vision_complete`.
- The `SponsorRail` — when no tools have been used yet, does it render an empty bar? Verify it renders nothing (null) when `toolsUsed` is empty, not an empty container with padding.
- The `VisionImageBanner` — when `isGeneratingImage` is true but no image yet, is there a spinner/placeholder? Add a pulsing skeleton in the same 16:9 aspect ratio.
- The event stream panel — on initial load before any run, verify the empty state message is helpful, not blank.
- Any `<img>` that could fail to load — add `onError` handlers that swap to a fallback or hide the element.

Step 2 — Execute all items.

Step 3 — Run `npm run build`, fix any errors, then commit:
`git add -A && git commit -m "feat: skeleton screens, loading states, and empty state polish"` then `git push origin main`.
```

---

## Prompt 10 — Final Production Readiness Sweep

```
You are working in the Undermind Next.js 16 / TypeScript codebase at c:\Users\NalaBook\Desktop\Undermind.

TASK: Run a full production readiness sweep across the entire codebase. This is the final pass before demo day.

Step 1 — Run `npm run build` and capture the full output. Fix every error and warning.

Step 2 — Audit and build a todo list for each category:

CONSOLE LOGS:
- Search for `console.log` across `src/` — remove any debug logs. Replace important ones with `console.warn` or `console.error` with context.

DEAD CODE:
- Search for any imported symbols that are never used.
- Search for commented-out code blocks that should be deleted.
- Check `src/components/ui/` for any component files that are not imported anywhere.

ENV COMPLETENESS:
- Cross-reference every `process.env.` usage in `src/` against `.env.example` and `env.template` — flag any that are used in code but missing from the example files.
- Verify `NEXT_PUBLIC_` variables are only accessed client-side and non-public vars are only accessed server-side (or in `server-only` modules).

DEPENDENCY AUDIT:
- Read `package.json`. Check for any packages listed in `dependencies` that are only used in dev/build (should move to `devDependencies`).
- Flag any packages with known peer dependency warnings from the build output.

DOCS & README:
- Verify `README.md` commit hash references are not stale.
- Verify all files listed in the `docs/` table in README actually exist.
- Open `docs/07_VISION_Agent.md` and verify the file paths in the Key Files table actually exist in the codebase.

HACKATHON DEMO CHECKLIST:
- Verify Judge Mode presets all work end-to-end (read the judge-mode.tsx presets and trace their tool settings through the pipeline).
- Verify the Sponsor Rail shows NanoBanana after a pipeline run with visionEnabled.
- Verify the `/api/settings/status` endpoint returns correct `configured: true/false` for each sponsor tool.

Step 3 — Execute every item from the todo list.

Step 4 — Final build: `npm run build` must pass with zero errors.

Step 5 — Commit and push everything:
`git add -A`
`git commit -m "chore: production readiness sweep — dead code, console logs, env audit, docs verify"`
`git push origin main`

Step 6 — Output a final summary of: what was fixed, what was intentionally skipped, and any items that require manual action (e.g. uploading an OG image asset).
```

---

## Usage Notes

- Run prompts **in order** — later prompts assume earlier refactors (e.g. Prompt 3 extracts `VisionImageBanner` before Prompt 9 adds a loading skeleton to it).
- Each prompt is designed to be **fully autonomous** — the agent should not ask for confirmation, just execute.
- If the agent gets stuck on a prompt, skip that item, note it, and continue with the rest of the prompt.
- After all 10 prompts are complete, the codebase will be type-safe, accessible, mobile-responsive, production-hardened, and fully documented.
