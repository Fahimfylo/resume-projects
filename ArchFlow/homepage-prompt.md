# ArchFlow Homepage Prompt — Public Landing Page at "/"

Copy everything below into your coding agent. Right now `/` has no route at all and everything (including unauthenticated visitors) lands directly on `/workspaces`. This adds a real public marketing homepage at `/`, built entirely on the existing token system in `theming.md` (no new hardcoded colors), with section patterns modeled on the reference designs supplied — numbered step cards, a live-stats band, a 6-module feature grid, a radial "how it thinks" diagram, and an FAQ accordion — reinterpreted in ArchFlow's actual dark canvas aesthetic, not copied verbatim.

---

## 1. Routing Change

```
/                → HomePage (public, no auth required)
/login           → existing login page (public)
/signup          → existing signup page (public)
/workspaces/*    → existing app (protected — RequireAuth, per the auth prompt)
```

- `/workspaces` is no longer the default landing destination for a fresh visit to the site root.
- If an **already-authenticated** user lands on `/`, every primary CTA button reads "Go to Dashboard" and links to `/workspaces` instead of `/signup` — check `useAuthStore.status` and swap label/target, no forced redirect needed.
- Nav bar top-right: `Log in` + `Sign up` for logged-out visitors, or a single `Dashboard` button for logged-in ones.

---

## 2. Design Tokens — Use the Real System, Not New Hex Values

This is the most important constraint in this prompt: **every color on this page must come from `src/theme/tokens.css`**, referenced the same way the rest of the app does — `bg-[var(--bg-app)]`, `text-[var(--text-1)]`, `border-[var(--border-2)]`, `text-[var(--accent-text)]`, category tints via `var(--cat-*)`. Do not introduce a separate "marketing page" palette. If a section needs a color that doesn't exist yet as a token, either reuse the closest existing one or add it properly to `tokens.css` under the right group (`--bg-*`/`--text-*`/`--border-*`/`--accent*`) — never inline a raw hex in a component.

The homepage defaults to whatever theme is currently active (`midnight` by default, matching the app), and — this is a nice, cheap win given the token system already exists — **respects the user's saved theme choice** if they've visited the app before (`useThemeStore` reads `localStorage['archflow-theme']` on load, same as inside the app). A first-time, logged-out visitor simply gets `midnight`.

Quick reference (midnight/default — see `theming.md` for the other three):
| Use | Token |
|---|---|
| Page background | `--bg-app` (`#0e0e11`) |
| Canvas/hero background | `--bg-canvas` (`#0f0f12`) + the same dot-grid pattern used in `WorkflowCanvas.tsx` |
| Cards/panels | `--bg-card` / `--bg-panel` |
| Card hover | `--bg-hover` |
| Primary heading text | `--text-strong` / `--text-high` |
| Body/secondary text | `--text-2` / `--text-3` |
| Kicker labels, muted captions | `--text-4` / `--text-5` |
| Borders | `--border-soft` → `--border-2` for most dividers, `--border-strong` for emphasis |
| Primary buttons/links | `--accent`, hover `--accent-hover`, text-on-accent per existing button component |
| Feature icon tiles | `--cat-*` tokens (reuse the exact category colors already used for node icons — component=violet, service=orange, model=cyan, etc.) so the marketing page and the product literally share a palette |

---

## 3. Typographic Pattern (borrowed from the reference designs, adapted to the app's font stack)

The reference homepages use a distinctive heading style worth adopting: **bold heading text in the strongest color, trailing word(s) in a muted/lighter weight of the same size** — e.g. "**Three steps to** launch." Apply this pattern to ArchFlow's dark palette: leading words in `--text-strong` at a heavy weight, the final word(s) in `--text-4` or `--text-5` at the same size/weight (the contrast comes from color, not weight, so it still reads as one confident headline rather than two different fonts).

Also adopt the **small tracked-out uppercase "kicker" label** above each section heading (`HOW IT WORKS`, `LIVE STATISTICS`, `THE WORKSPACE`, `FAQ` in the references) — in ArchFlow, render these in `--text-4`, monospace or the existing UI font at `text-xs tracking-widest uppercase`, paired with a right-aligned muted subtitle on the same line (the references do this too — e.g. "FROM IDEA TO EXECUTION IN MINUTES" sitting opposite "Three steps to launch.") — reuse this left-heading/right-subtitle row layout for every major section.

---

## 4. Page Sections

### 4.1 Nav bar (sticky, `--bg-app` at ~90% opacity + backdrop blur on scroll)
- Left: ArchFlow logo + wordmark (reuse existing sidebar logo mark)
- Center/right: `Product`, `How it works`, `Pricing`, `FAQ` (anchor links)
- Right: `Log in` (text link, `--text-2`) + `Sign up` (filled `--accent` button) — or `Dashboard` if authenticated

### 4.2 Hero
- Kicker: `ARCHFLOW` or `CODEBASE INTELLIGENCE`
- Headline using the pattern from §3, e.g. **"See your codebase** the way you actually built it." (write 2–3 options, pick the strongest)
- Subheadline (`--text-3`): one sentence — codebase in, interactive architecture map out, every connection explained.
- Primary CTA: `Get Started Free` → `/signup`. Secondary: `See a live example` → scrolls to the canvas demo.
- **Hero visual**: a live, non-interactive (or lightly interactive) instance of the actual React Flow canvas, pre-loaded with the sample "NEXUS Web Platform" system-level graph, using real `EntityNode`/`RelationshipEdge` components and the `--bg-canvas` dot-grid background — this is dramatically more convincing than a static screenshot. Auto-fit view; a subtle idle animation (edges gently pulsing, or a slow auto-pan) signals "this is alive" without requiring interaction.

### 4.3 "How it works" — numbered step cards (pattern from reference image 2/3)
Kicker `HOW IT WORKS`, heading per §3 pattern, right-aligned subtitle (e.g. "FROM UPLOAD TO UNDERSTANDING").
3 cards in a row, each: a circular `--bg-inset` badge with a bold `--text-strong` number (`01`, `02`, `03`), a bold title, and a `--text-3` description — border `--border-soft`, background `--bg-card`, generous padding, no heavy shadow (matches the flat-card look in the references, just recolored to dark):
1. **01 — Upload your codebase** — zip it up or point us at a repo; no config needed.
2. **02 — ArchFlow parses it** — imports, routes, models, calls — deterministic AST analysis, not guesswork.
3. **03 — Explore the map** — drill down, filter, ask "why" about any connection.

Optional: below the 3 cards, add the small connected-icon-row pattern from reference image 2 (a horizontal chain of small rounded icon tiles linked by thin lines) re-themed to represent ArchFlow's actual pipeline stages: `Scan → Parse → Resolve → Cluster → AI Enrich → Render`. Use `--bg-inset` tiles with `--text-3` icons, connecting line in `--border-2`.

### 4.4 Live stats band (pattern from reference image 3)
Kicker `LIVE STATISTICS` or `WHY IT MATTERS`, heading per §3 pattern. 3–4 stat cards, each a `--bg-card` block with a huge bold number in `--text-strong` and a muted uppercase label in `--text-4` below it, e.g.:
- `7` — LANGUAGES/FRAMEWORKS SUPPORTED (JS/TS/React/Node/Express etc.)
- `4` — ABSTRACTION LEVELS (System → Module → File → Function)
- `100%` — EVIDENCE-BACKED CONNECTIONS
- `< 5 MIN` — TYPICAL ANALYSIS TIME FOR A MID-SIZE REPO

**Important:** don't fabricate usage numbers you don't have (no "4.2M+ words generated"-style stat unless it's real) — these four are framed as product-capability facts, not usage metrics, so they're honest to ship pre-launch. Swap in real numbers once you have actual users/analyses to report.

### 4.5 "Everything ArchFlow does" — 6-module feature grid (pattern from reference image 4)
Kicker `THE PLATFORM`, heading per §3 pattern, right subtitle `SIX WAYS TO UNDERSTAND YOUR CODE`.
2×3 grid of `--bg-card` cards, each numbered (`01`–`06`) in `--text-5`, bold title, `--text-3` description — reuse a real `--cat-*` icon tile per card so it visually ties back to the node categories in the product:
1. **Interactive Architecture Canvas** — drag, zoom, explore your real structure like a workflow diagram.
2. **Evidence-Backed Connections** — every edge shows the exact file, line, and code behind it.
3. **Root-to-Leaf Drill-Down** — go from system architecture to a single function without losing context.
4. **AI-Written Summaries** — plain-English explanations for every entity in your codebase.
5. **Structured Folder Groups** — controllers, models, middleware, and routes, organized the way your editor already organizes them.
6. **Re-Analyze Anytime** — keep the map current as your code changes.

### 4.6 "How ArchFlow reads your codebase" — radial diagram (pattern from reference image 5)
Kicker `ANALYSIS ENGINE`, heading per §3 pattern. Recreate the radial layout — a center node (`ArchFlow Core`, using the app's actual AI/brain-style icon) with 6–8 satellite icon tiles arranged in a circle around it, each connected by a thin `--border-2` line radiating outward, labeled with what ArchFlow actually extracts: `Imports`, `Function Calls`, `Routes`, `DB Models`, `External APIs`, `Hooks`, `Middleware`, `Confidence Scoring`. Use `--bg-inset` tiles + `--text-3` icons + a soft `--accent-bg` radial glow behind the center node (the reference uses a soft circular glow behind its "AI CORE" — recreate with `--accent-bg`, which is already a translucent token made for exactly this).

### 4.7 Problem/Solution strip (kept from the original plan, still useful)
Short 3-column section, `--bg-panel` cards: *"Docs go stale"* / *"Onboarding takes weeks"* / *"Nobody knows why anything connects"* → each paired with how ArchFlow addresses it. One sentence each.

### 4.8 FAQ accordion (pattern from reference image 6)
Kicker `FAQ`, heading per §3 pattern, right subtitle `EVERYTHING YOU NEED TO KNOW`.
Stacked `--bg-card` rows, each a question in bold `--text-1` + a `+` icon in a circular `--bg-inset` badge that rotates/toggles to reveal the answer in `--text-3` below. Real ArchFlow questions, not the reference's placeholder ones:
- How long does analysis take for a large codebase?
- Which languages/frameworks are supported today?
- Does ArchFlow send my code to a third party?
- Can I manually add or annotate nodes?
- Is there an API?
- What happens to my uploaded source files after analysis?

### 4.9 Final CTA band
Full-width `--bg-panel` or a subtle `--accent-bg` wash, headline repeat + `Get Started Free` button. No form fields — clicking goes to `/signup`.

### 4.10 Footer
Logo, short tagline, placeholder link columns (Product / Company / Legal), copyright line — `--text-4` on `--bg-app`, `--border-soft` divider above it. Keep minimal.

---

## 5. Component Reuse Checklist

Don't build new bespoke illustration components for the product visuals. Reuse, in read-only/simplified props mode where needed:
- `EntityNode` / `GroupNode` (hero canvas + §4.5 icon tiles, sourcing colors from the same `--cat-*` tokens)
- `RelationshipEdge` (hero canvas)
- `InspectorPanel` (can render in a fixed "always open" demo state for a feature visual, showing a real evidence block)
- Existing sample/mock graph data (`graph.system.ts` etc.) — homepage uses the same "NEXUS" sample project the product itself demos with.

New homepage-only components needed: `StepCard` (§4.3), `StatCard` (§4.4), `FeatureCard` (§4.5), `RadialDiagram` (§4.6), `FaqAccordionRow` (§4.8) — all built with tokens per §2, not new one-off styles.

---

## 6. Non-Goals

- No real pricing page/logic — `Pricing` nav link can anchor to a simple "Free while in beta" note, not a real billing flow.
- No blog, docs, or case studies pages yet — single-page homepage with anchor navigation.
- No fabricated usage/traction numbers (see §4.4) — capability facts only until real metrics exist.
- No SEO/meta-tag deep work beyond basic `<title>`/`<meta description>`.
- No A/B testing or analytics wiring.

---

## 7. Definition of Done

- [ ] Visiting `/` as a logged-out user shows the new homepage, not `/workspaces`
- [ ] Visiting `/` as a logged-in user shows the same homepage but with `Dashboard`-labeled CTAs pointing at `/workspaces`
- [ ] Every color on the page resolves to a `theming.md` token — zero hardcoded hex values in the new components (spot-check by switching themes in Settings and confirming the homepage repaints correctly, same as the in-app pages do)
- [ ] Hero renders a live, auto-fit React Flow canvas using real `EntityNode`/`RelationshipEdge` components and the sample graph data
- [ ] "How it works" numbered cards, stats band, 6-module feature grid, radial diagram, and FAQ accordion are all present and match the token-based dark styling — not the reference screenshots' light cream palette
- [ ] Stats section contains only honest, real, or clearly-capability-framed numbers — no fabricated usage metrics
- [ ] `Get Started` / `Sign up` buttons route to `/signup`; `Log in` routes to `/login`
- [ ] Page is fully responsive (nav collapses to a mobile menu; step/stat/feature grids reflow to 1–2 columns; radial diagram simplifies to a stacked list on small viewports)
- [ ] Switching the app's theme (midnight/graphite/ocean/light) and revisiting `/` shows the homepage in that same theme
