# ArchFlow Fix Prompt — Graph Connectivity (Dropped Edges & Unresolved Imports)

Copy everything below into your coding agent. This is a bug-fix pass on the already-implemented analysis pipeline, addressing six root causes of nodes appearing falsely disconnected. Fix in the priority order below — the first fix (edge rescoping) is structural and makes several of the others much simpler.

**Implementation order — do not parallelize:** implement §1 first, in isolation, then run the full §7 Definition of Done checklist against it before touching §2 onward. §1 changes what the root/module/file scopes display (see its caveats below), so it needs to be verified as a stable baseline on its own before the other five fixes layer on top of it.

---

## 0. Diagnosis Recap

| # | File | Problem |
|---|---|---|
| 1 | `dependencyAnalyzer.js:25` | Only `.` and `@/` import specifiers resolve — tsconfig path aliases, `~`, bare packages not in `KNOWN_EXTERNAL_SDKS` → silently produce zero edges |
| 2 | `relationshipResolver.js:97` | `CALLS` edges only created for resolved imports or uniquely-exported symbols — local helpers/closures/callbacks get no edge |
| 3 | `clustering.js:271,386` | Same-module and same-bucket edges are **deleted** as self-edges instead of rescoped down to child level |
| 4 | `clustering.js:468,530` | External-dependency (`ext-*`) nodes and any edge touching them are stripped from depth 2+ entirely |
| 5 | `canvasHierarchy.ts:533`, `graphService.js:49` | Cross-module edges forced to `parentId: null`; scope loading only fetches same-scope edges, so they never render anywhere |
| 6 | `clustering.js:538` | Depth-3 function nodes only get intra-file `CALLS` edges — no cross-file function-to-function/function-to-file edges possible |

---

## 1. Priority 1 — Fix Edge Scoping With Lowest-Common-Ancestor (LCA) Placement

**This single change resolves #3 and #5 together and simplifies #6.** Stop force-deleting or force-nulling edges based on ad hoc rules. Instead, compute where an edge belongs using one consistent rule:

> **An edge's `parentId` = the lowest common ancestor (LCA) of its source node's parent chain and its target node's parent chain.**

Concretely: walk both endpoints' ancestor chains (via `parentId`) up to the root, find the deepest node that appears in both chains, and that node's id is the edge's `parentId`. If the two nodes share no ancestor below the root, `parentId = null` (a true system-level cross-cutting edge — rare, and now correctly distinguished from "just collapsed together").

What this fixes automatically:
- **File-to-file edges within the same module** (#3): LCA = the module node. The edge is invisible while viewing the module from outside (correct — it's an internal detail) but becomes visible the instant you expand/drill into that module, because `getChildren(moduleId)` now correctly includes edges scoped to that module.
- **Cross-module edges within the same system bucket** (#3, at the system level): same logic, one level up — LCA = the bucket node, edge appears when you enter it.
- **Genuinely cross-branch edges** (e.g. a Frontend file calling a Backend API route) (#5): LCA = whatever shared ancestor actually contains both — likely the project root, or `null` if they're in entirely separate top-level zones. These should render as **boundary edges** at whatever scope is their LCA, not be discarded. If your canvas needs to show *some* indication of this connection while deep inside just one branch (e.g. while browsing only Frontend), render a small "↗ connects to Backend" stub/badge on the relevant node rather than nothing at all — but the full edge itself only draws at its LCA scope.

**Implementation notes:**
- Compute `parentId` for every edge once, right after clustering assigns `parentId` to every node — don't compute it inline during rendering. This replaces the current ad hoc assignment in `buildTree` (`clustering.js:514-535`).
- `getChildren(nodeId)` (`graphService.js:49`) already filters edges by scope correctly — no change needed there once edges have correct `parentId` values; it was never the bug, it was just faithfully rendering already-wrong data.
- Remove the `sMod === tMod → continue` self-edge skip (`clustering.js:271`) and the equivalent system-level skip (`clustering.js:386`) entirely — replace both with the LCA assignment. Nothing gets silently dropped anymore; it just gets placed at the right depth.

**Two caveats to plan for before shipping this:**
- **The root/full-system view will show fewer edges after this change, on purpose.** Cross-module edges that share a bucket are currently forced to `parentId: null`, so they render at the root view today (incorrectly — that's the bug). After LCA scoping, they move down to their bucket's scope. This is a real, visible behavior change for existing users, not a regression — call it out in release notes / verify it doesn't read as "edges disappeared" without context.
- **The "↗ connects to Backend" boundary-stub idea from §1 needs new frontend rendering — nothing like it exists yet.** The `buildScopeEdges` hierarchy lines in `useCanvasStore.ts:106` are a separate client-side construct (used for something else) and are unaffected by this change. Treat the boundary stub as a nice-to-have follow-up, not a blocking requirement for this fix — the core LCA scoping fix stands on its own without it; the stub just adds a hint when you're deep in one branch that a connection exists elsewhere.

---

## 2. Priority 2 — Resolve Real Import Aliases (fixes #1)

`dependencyAnalyzer.js` currently only understands `.`/`@/` and a hardcoded `KNOWN_EXTERNAL_SDKS` list. Replace with:

1. **Parse `tsconfig.json` (and `jsconfig.json` fallback)** once per project during the scan phase — read `compilerOptions.baseUrl` and `compilerOptions.paths`, build a resolver map (e.g. `@components/*` → `src/components/*`, `~/*` → `src/*`). This is a clean addition to `buildImportGraph`. Apply this resolver to every import specifier before falling back to relative-path resolution.
2. **Stop hardcoding `KNOWN_EXTERNAL_SDKS`.** Read the project's `package.json` `dependencies`/`devDependencies` once, and treat *any* bare (non-relative, non-aliased) import specifier that matches a key in that list as a resolvable external node — dynamically, not from a maintained hardcoded list. **This list is hardcoded in two places, not one** — `dependencyAnalyzer.js` and, separately, `parser.js` (lines 135, 364, 368, 378-388), which is where external calls actually get tagged during parsing. Thread the `package.json` dependency set into `parser.js` too, or externals will still be under-detected even after fixing `dependencyAnalyzer.js` alone.
3. Anything still unresolved after aliases + package.json check falls back to an `ext-unknown` node rather than silently producing zero edges, so at minimum the connection is visible even if under-categorized.
4. Log (dev-mode only) every import specifier that still fails to resolve after both passes — this becomes your ongoing signal for "what alias pattern am I still missing," instead of finding out from silently-disconnected nodes.

---

## 3. Priority 3 — Keep External Nodes Visible at Every Scope (fixes #4)

Don't strip `ext-*` nodes from depth 2+. **Treat externals as `subNodes`, not tree children** — this is a good fit for the existing architecture (confirmed against `EntityNode.tsx`'s `subNodes` prop), and simpler to implement than the current strip-and-drop logic: an external dependency used by a specific file/function becomes a dashed sub-node attached to *that* node at *every* depth where the node is visible — never a separate collapsible branch of the tree, so it can't get pruned during clustering the way full tree nodes do.

Concretely: **remove `ext-*` tree nodes entirely** — delete the depth-2 skip (`clustering.js:468`) and the edge skip (`clustering.js:530`) rather than patching around them, and attach externals as `subNodes` on the relevant file's `data` instead. This removes a whole class of "strip then drop dangling edges" logic rather than adding a special case to it.

**Fallback if it gets noisy:** if a file imports many SDKs and the dashed-satellite row gets visually busy, swap to a compact badge instead — a small pill on the node card listing external dependency count (`3 external deps`) that expands the sub-node list on click/hover. Don't build this preemptively; only add it if the always-visible satellites turn out to be a real problem in practice.

---

## 4. Priority 4 — Better Call Resolution (fixes #2)

**Most of the infrastructure for this already exists** — `buildExportsIndex` (`relationshipResolver.js:12`) already builds a project-wide name→file index. The remaining work is narrower than a full rebuild:

1. **Transitive barrel re-export resolution.** `buildExportsIndex` needs to follow re-exports through barrel files (`index.ts` re-exporting from other modules) so a call to a name imported from a barrel file still traces back to its real defining file, not just the barrel itself.
2. **Add the missing third condition to the edge-creation check.** `relationshipResolver.js:97` currently requires "resolved import OR uniquely exported symbol." Private (non-exported) helper functions defined and called within the same file satisfy neither, so they get no edge today. Add: "OR defined in the same file being analyzed" — this is a small, low-risk addition, not new infrastructure.
3. Calls that are genuinely local closures/callbacks/parameters with no traceable definition remain correctly un-edged after both fixes — a callback passed to `.map()` isn't a real cross-entity relationship worth drawing.

---

## 5. Priority 5 — Rework Module Bucketing (reduces over-collapsing, feeds into #3's fix)

`moduleKeyFor` currently lumps `components/`, `pages/`, `lib/`, `utils/`, `store/`, and bare `src/` files into one catch-all `"core"` module. This is what causes *most* real connections to collapse into same-module self-edges in the first place — with the LCA fix from §1 those edges no longer vanish, but they still all pile up one level too high, making the module view itself sparse/misleading (lots of stuff inside one giant "core" blob).

Fix: make module boundaries follow actual top-level feature folders more granularly — one module per first-level directory under `src/` (or per feature-folder convention if the project uses one), rather than a fallback bucket that swallows everything uncategorized. Only fall back to a shared `"misc"`/`"core"` bucket for files that are genuinely top-level loose files (e.g. `src/App.tsx`, `src/main.tsx`), not entire categories like all of `components/` or `lib/`.

**Migration note:** changing `moduleKeyFor` changes `mod-*` node ids and bucket membership, so any already-analyzed project will show stale data until it's re-analyzed. This is expected and low-risk since `persistTree` fully regenerates the graph on each analysis run rather than incrementally patching it — just make sure re-analysis is part of your test pass for this change, not an assumption you skip.

---

## 6. Priority 6 — Cross-File Function-Level Edges (fixes #6)

Once §1 (LCA scoping) and §4 (global symbol table) are in place, this mostly resolves itself: a depth-3 function node's call that resolves (via the global symbol table) to an exported function in another file can now get a real edge whose `parentId` is computed via LCA — typically landing at the depth-2 (file) or depth-1 (module) level, since the two functions' full ancestor chains rarely share a lower common node. That's correct: cross-file function calls become visible when you zoom out one level from either function, not intra-file — verify this happens naturally rather than needing bespoke logic.

---

## 7. Definition of Done

- [ ] No edge is ever silently deleted during clustering — every edge either renders at its computed LCA scope or is a genuinely edge-less local closure/callback (§4.2's correct no-edge case)
- [ ] A file importing another file in the same module: no visible edge at the module-collapsed view, but the edge appears immediately when that module is expanded
- [ ] A tsconfig path alias (e.g. `@/components/Button`) resolves to a real file node, not zero edges
- [ ] A bare import of a `package.json` dependency not in the old hardcoded SDK list still produces an external node + edge
- [ ] External SDK usage renders as a sub-node/badge on the using file, visible at every depth, not stripped past depth 1
- [ ] A call to a function re-exported through a barrel `index.ts` resolves to the real defining file, not "no edge"
- [ ] A private (non-exported) helper function in the same file still gets an intra-file `CALLS` edge
- [ ] Re-run the analysis on your actual sample project and confirm the previously-isolated-looking leaf/utility/config files now show at least one connection once you drill into their containing module
- [ ] `components/`, `pages/`, `lib/`, `utils/`, `store/` no longer collapse into a single `"core"` module unless they're genuinely uncategorizable loose files
