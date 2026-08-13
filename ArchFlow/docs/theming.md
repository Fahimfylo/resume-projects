# ArchFlow — Theming & Colors

## How it works

- **Every color is a CSS custom property.** Components reference tokens with Tailwind arbitrary values, e.g. `bg-[var(--bg-card)]`, `text-[var(--text-1)]`, `border-[var(--border-2)]`. There are no hardcoded theme colors in components (a few one-off status colors and the minimap palette are exceptions — see [Gotchas](#gotchas)).
- **Token definitions:** `src/theme/tokens.css`.
- **Four themes**, selected via `data-theme` on the `<html>` element: `midnight` (default), `graphite`, `ocean`, `light`.
- **Switching:** `src/store/useThemeStore.ts` sets `document.documentElement.dataset.theme` and persists the choice in `localStorage` under the key `archflow-theme`. The picker lives in `src/components/settings/SettingsModal.tsx` (gear icon in the topbar).
- **CSS load order** (`src/index.css`): Tailwind → `@xyflow/react` styles → `./theme/tokens.css`.

## Token groups

| Group        | Prefix        | Purpose                                   |
|--------------|---------------|-------------------------------------------|
| Surfaces     | `--bg-*`      | App, canvas, panels, overlays, rows, nodes, hover/selected states |
| Text         | `--text-*`    | `--text-strong` → `--text-5` (strongest → most muted) |
| Borders      | `--border-*`  | `--border-soft` → `--border-strong` (subtle → strong) |
| Accent       | `--accent*`   | Brand color + hover + text-on-accent + translucent bg/border variants |
| Categories   | `--cat-*`     | Node category colors (minimap / accents)   |

## Token inventory

### Midnight (default) — indigo-black dark theme

`:root` and `:root[data-theme='midnight']` are identical (midnight is the default).

| Token | Value |
|---|---|
| `--bg-app` | `#0e0e11` |
| `--bg-canvas` | `#0f0f12` |
| `--bg-code` | `#111115` |
| `--bg-raised` | `#121216` |
| `--bg-topbar` | `#141418` |
| `--bg-card` | `#141419` |
| `--bg-panel` | `#16161a` |
| `--bg-overlay` | `#18181d` |
| `--bg-inset` | `#1a1a1f` |
| `--bg-row` | `#1c1c22` |
| `--bg-btn` | `#1e1e26` |
| `--bg-hover` | `#24242e` |
| `--bg-node` | `#222227` |
| `--bg-node-hover` | `#26262c` |
| `--bg-selected` | `#282830` |
| `--bg-selected-strong` | `#4b4b58` |
| `--bg-hover-strong` | `#262632` |
| `--text-strong` | `#ffffff` |
| `--text-high` | `#f4f4f5` |
| `--text-1` | `#e4e4e7` |
| `--text-2` | `#d4d4d8` |
| `--text-3` | `#a1a1aa` |
| `--text-4` | `#71717a` |
| `--text-5` | `#52525b` |
| `--border-soft` | `#22222c` |
| `--border-1` | `#262630` |
| `--border-2` | `#2a2a35` |
| `--border-3` | `#2e2e3a` |
| `--border-4` | `#33333d` |
| `--border-strong` | `#383842` |
| `--accent` | `#4f46e5` |
| `--accent-hover` | `#6366f1` |
| `--accent-text` | `#818cf8` |
| `--accent-text-soft` | `#a5b4fc` |
| `--accent-bg` | `rgba(79, 70, 229, 0.2)` |
| `--accent-border` | `rgba(99, 102, 241, 0.3)` |
| `--accent-border-soft` | `rgba(99, 102, 241, 0.2)` |

### Graphite — softer, cooler dark

bg `#101014` → surfaces `#16161b`–`#24242f`; text `#ffffff`/`#f5f5f6` → muted `#a6a6b3`/`#757584`/`#555565`; borders `#24242e`–`#3f3f50`.

Accent: **not overridden** — inherits the indigo accent from midnight.

### Ocean — deep navy dark

bg `#0a0f18` → blue-tinted surfaces `#101827`–`#1c283e`; text `#ffffff`/`#eef2f9` → muted `#8fa3c0`/`#6b7f9c`/`#4e5f78`; borders `#1a2436`–`#37475f`.

Accent overridden to blue: `#1d4ed8` / hover `#2563eb` / text `#60a5fa` / soft `#93c5fd`.

### Light — bright, high-contrast

bg `#f4f4f7`, white surfaces; text `#111114`/`#18181c` → muted `#6b6b76`/`#8a8a96`/`#a3a3ae`; borders `#e2e2ea`–`#b0b0c0`.

Accent indigo `#4f46e5` / hover `#6366f1` with darker text variants (`--accent-text: #4f46e5`).

### Node category colors (`--cat-*`)

Defined only on `:root`/midnight, so **identical across all themes**.

| Token | Value |
|---|---|
| `--cat-page` | `#3b82f6` |
| `--cat-component` | `#8b5cf6` |
| `--cat-route` | `#10b981` |
| `--cat-controller` | `#14b8a6` |
| `--cat-service` | `#f59e0b` |
| `--cat-model` | `#06b6d4` |
| `--cat-external-api` | `#f43f5e` |
| `--cat-db-table` | `#a855f7` |
| `--cat-hook` | `#eab308` |
| `--cat-store` | `#6366f1` |

## Global styles (`src/index.css`)

- Body: `bg-[var(--bg-app)]`, `text-[var(--text-1)]`, accent-colored text selection.
- Custom 6px scrollbar: track `--bg-raised`, thumb `--border-2` (hover `--border-3`).
- React Flow overrides: attribution chip, controls (bg `--bg-overlay`, hover `--bg-hover-strong`), minimap mask `--bg-app` at 75% opacity.
- Canvas dot-grid background: `--bg-hover-strong` (`src/components/canvas/WorkflowCanvas.tsx`).

## Adding a new theme

1. Add a `:root[data-theme='<id>']` block in `src/theme/tokens.css`. Tokens you omit inherit from the previous scope, so re-declare only what changes (surfaces, text, borders, and accent).
2. Register it in `THEMES` in `src/store/useThemeStore.ts` (id, name, description, preview colors, `isDark`). It will appear automatically in the settings picker.

## Gotchas

- **Minimap palette is duplicated.** `src/components/canvas/WorkflowCanvas.tsx` (the `minimapColor` function) hardcodes the `--cat-*` hex values instead of reading `var(--cat-*)`. Changing a category color in `tokens.css` will not update the minimap.
- **Graphite inherits undefined tokens.** `--bg-node`, `--bg-selected`, `--bg-selected-strong`, `--bg-hover-strong`, and all `--cat-*` are only defined on midnight/`:root`; graphite falls back to those values.
- **One-off status colors are hardcoded** in components: rose (`rose-300`/`rose-500`) for errors/danger, emerald for file stats, amber for workflows/analysis, and indigo glow shadows (`shadow-indigo-600/30`).
