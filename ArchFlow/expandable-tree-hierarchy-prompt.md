# ArchFlow Enhancement Prompt — Expandable Hierarchy (In-Canvas Groups)

Copy everything below into your coding agent. This builds directly on top of the recursive `parentId` tree from the drill-down prompt — no new backend data model needed, just a smarter way to *render* that same tree on the canvas so large projects stop looking like a spiderweb.

---

## 1. Problem Being Solved

At scale (a real project has hundreds of files/functions), the flat spatial canvas becomes unreadable no matter how good the layout algorithm is — too many boxes, too many crossing lines. The fix: folder-level nodes (`controllers/`, `models/`, `middleware/`, `routes/`, `config/`, etc.) **expand and collapse in place, directly on the canvas** — the same behavior a folder has in a code editor's file tree, just rendered spatially instead of as text rows, so you keep the edges/connections that make ArchFlow useful while still being able to collapse away everything you're not currently looking at.

---

## 2. In-Canvas Expandable Groups

Keep the spatial canvas for what it's good at (showing connections), but make folder-level nodes **toggle open/closed in place** rather than only supporting the full breadcrumb drill-in from the previous prompt:

- A folder/container node (`controllers`, `models`, `middleware`, etc.) renders collapsed by default as today's compact card with a `▸ N inside` badge.
- Clicking the badge (or a dedicated expand icon on the card, not the whole card body — reserve card-body click for Inspector, per the existing pattern) **toggles it open in place**: the node grows into a bounded container (dashed border, like the `GroupNode` component already specced) and its direct children render *inside* that boundary as smaller mini-cards.
- This uses React Flow's parent/child node support (`parentNode` + `extent: 'parent'`) so children move with their container and can't be dragged outside it.
- **Independent toggle state per node** — opening `models/` does not force `controllers/` open or closed; each has its own boolean in the `expandedIds` set from §2 (the tree panel and canvas groups share this exact same state, which is how the two views stay synced).
- **Accordion mode (default ON, toggleable in settings):** within the *same parent*, opening one sibling folder auto-collapses other open siblings at that level. This is the single biggest lever against "opening a lot of nodes gets messy" — it caps how much is ever visually expanded at once to roughly one open branch per level. Power users can flip this off if they genuinely want multiple folders open side by side.

---

## 3. Handling Folders With Many Children (the "opened models/ and it exploded" case)

When a container is expanded, choose its rendering mode by child count — don't just dump N full node cards into a grid:

| Child count | Rendering mode |
|---|---|
| ≤ 8 | Full mini node-cards in an internal grid (current planned behavior) — small enough to stay readable |
| 9–30 | **Compact list mode**: children render as slim single-line rows (icon + name + tiny subtitle) stacked vertically inside the container — no full card chrome, no wasted vertical space. Clicking a row opens the Inspector; it does NOT spawn another full canvas node unless the user explicitly clicks a small "pin as node" affordance (for when they want to actually see that one item's edges). |
| 30+ | Compact list mode **plus** an inline search/filter box pinned to the top of the container, and pagination or virtualized scrolling inside the container so the DOM never renders more than ~30 rows at once |

This mirrors exactly how a code editor handles a folder with 200 files — it never draws 200 boxes, it draws 200 text rows, and only "opens" the one you click, just rendered here as compact rows inside the same container instead of a separate panel.

**Reveal path:** the canvas already has a top-level "Search nodes..." box (visible in your screenshots). Wire it so a search hit walks up the matched node's `parentId` chain and force-expands every ancestor container (respecting accordion mode by collapsing unrelated siblings along the way), then pans/zooms to the match — so search alone can get you from the project root straight to one specific function without manually clicking through every level.

---

## 4. Re-Layout on Expand/Collapse

Every expand/collapse must trigger an incremental re-layout, not just a resize:

- Use `elkjs`'s layered algorithm, scoped to the affected zone only (don't re-run layout for the whole canvas when one folder inside `Backend` opens — that causes jarring full-canvas jumps).
- Animate node position/size changes (200–300ms ease) so the canvas doesn't "pop" — sibling nodes should visibly slide out of the way when a container grows, and slide back when it collapses.
- Collapsing a container that's off-screen or whose children are individually selected should clear that selection state (closing the Inspector if the selected node just got hidden inside a re-collapsed parent).

---

## 5. State additions (`useCanvasStore`)

```ts
expandedIds: Set<string>              // which container nodes are currently expanded
accordionMode: boolean                 // default true
toggleExpand: (nodeId: string) => void // handles accordion-collapse of siblings if accordionMode is on
revealNode: (nodeId: string) => void   // expands ancestor chain + pans/selects, used by search
listModeThreshold: number              // default 8, when to switch a container to compact list rendering
```

Data fetching stays exactly as specced in the drill-down prompt (`GET /graph/:nodeId/children`) — expanding a container just fetches its children and injects them as child nodes in the current view instead of replacing the whole canvas/breadcrumb. The breadcrumb-based full drill-in from that prompt still exists for when someone wants to "step inside" a single node full-screen (e.g. diving into one function's internals) — expanding a folder keeps you in context on the same canvas, drilling in takes you into a focused sub-view.

---

## 6. Non-Goals

- No drag-to-reparent (moving a node between folders visually) — the tree structure stays analysis-derived and read-only, same as the drill-down prompt.
- Compact list rows are not individually draggable/repositionable — only "pinned" full node-cards can be moved.
- No separate outline/tree sidebar — everything happens on the canvas itself.

---

## 7. Definition of Done

- [ ] Clicking a folder's expand badge on the canvas toggles it open in place (no page/breadcrumb navigation) with children rendered inside its boundary
- [ ] With Accordion mode on, opening `models/` auto-collapses any other open sibling folder at the same level (e.g. `controllers/` if it was open)
- [ ] A folder with 20+ children renders in compact list mode with a working inline filter, not 20 full cards
- [ ] Expand/collapse triggers a smooth, zone-scoped re-layout (siblings visibly reflow) rather than an instant resize or full-canvas re-render
- [ ] Using the existing canvas search box to find a deep node auto-expands every ancestor folder needed to reveal it and pans/zooms to it
