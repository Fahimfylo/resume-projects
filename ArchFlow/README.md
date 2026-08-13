# ArchFlow

**Visual codebase architecture mapping & workflow canvas platform.**

ArchFlow turns an uploaded source-code archive into an interactive, drill-downable architecture diagram. It statically analyzes a codebase with an AST parser, clusters it into a `System → Modules → Files → Functions` tree, infers typed relationships between entities (with code evidence + confidence scores), optionally enriches the result with Gemini AI summaries/insights, and renders it all on a React Flow canvas where you can explore, filter, annotate, and auto-arrange nodes.

> **Status:** working MVP / single-user demo. Several sidebar sections (Architecture, Files, APIs, Database, Dependencies, Docs, AI Insights, Issues, Changes) are UI placeholders — the Workflow Canvas is the fully implemented view.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [How Analysis Works](#how-analysis-works)
- [Key User Flows](#key-user-flows)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [npm Scripts](#npm-scripts)
- [Notes & Caveats](#notes--caveats)

---

## Features

- **Workspace & Project management** — create/edit/delete workspaces and projects (MongoDB-backed).
- **Upload & analyze** — drag-and-drop a `.zip` codebase archive, which is extracted (with path-sanitization and `node_modules`/`.git` filtering) and queued for analysis.
- **AST analysis engine** — parses JS/TS files with `ts-morph` to detect imports, exports, functions, hooks, React components, Express routes, Mongoose models, external SDK calls, and DB reads/writes.
- **Relationship inference** — typed edges (`IMPORTS`, `CALLS`, `ROUTES_TO`, `READS_FROM`, `WRITES_TO`, `DEPENDS_ON`, `USES`) with source `evidence` (file, line, snippet, confidence).
- **Recursive drill-down tree** — `System → Module → File → Function` hierarchy; any node with children can be entered, from root all the way to leaves.
- **Interactive canvas** — React Flow with custom entity nodes and relationship edges, minimap, dot-grid background, zoom/pan controls, and auto-layout (DAG/DAGRE tree layout along X or Y axis).
- **Breadcrumb + deep links** — scope navigation updates the URL (`?node=<id>`), so any view can be shared/restored.
- **Node & edge inspector** — click any node to see its AI/static summary, file path, line/complexity/call stats, and sub-node satellites; click any edge to see "why these are connected" with code evidence.
- **Filtering & search** — filter nodes by depth visibility (all/parents/children) or by type/folder tags, plus live label search.
- **Manual annotation** — add custom architecture nodes to any scope via the "Add Node" modal; node positions are persisted to the backend.
- **AI enrichment (optional)** — when `GEMINI_API_KEY` is set, Gemini generates node summaries, module subtitles, and codebase insights. Degrades gracefully to deterministic heuristics without a key.
- **Theming** — 4 themes (Midnight, Graphite, Ocean, Light) persisted in `localStorage`.
- **Honest error surfacing** — if the API is unreachable the UI shows an explicit error banner instead of fabricating sample data, so stale or missing data is never mistaken for real records.

---

## Tech Stack

**Frontend** (`src/`)
- React 19 · TypeScript · Vite 6 · Tailwind CSS 4 (via `@tailwindcss/vite`)
- `@xyflow/react` (React Flow 12) for the canvas
- Zustand 5 for state (UI, Canvas, Theme)
- React Router 7
- `@dagrejs/dagre` for auto-layout
- `lucide-react` icons, `motion` animations

**Backend** (`server/`)
- Node.js · Express 4 · Mongoose 9 (MongoDB)
- `ts-morph` AST parser
- `multer` + `adm-zip` for uploads / zip extraction
- `zod` for request validation
- `@google/genai` (Gemini) for optional AI enrichment
- `bcryptjs` + `jsonwebtoken` for optional auth
- `dayjs` for relative timestamps

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                         │
│  src/pages → src/components → src/store (Zustand)            │
│        └─────────────── src/api/client.ts (fetch)            │
└───────────────────────────┬──────────────────────────────────┘
                            │  /api/*  (Vite dev proxy → :4000)
┌───────────────────────────▼──────────────────────────────────┐
│  Express API  (server/app.js → routes/index.js)              │
│   auth · workspaces · projects · upload · analysis · graph   │
│   · ai                                                        │
└───────┬───────────────────────────────────┬──────────────────┘
        │                                   │
┌───────▼───────────┐            ┌──────────▼──────────────────┐
│  MongoDB (Mongoose)│            │  Storage Adapter            │
│  User · Workspace ·│            │  server/storage/            │
│  Project · UploadedFile │       │  storageAdapter.js*         │
│  GraphNode · GraphEdge ·        │  (local disk of extracted   │
│  AnalysisJob         │          │   source files)             │
└─────────────────────┘            └────────────────────────────┘
        ▲                                   ▲
        │              analysis pipeline    │
        │   server/services/analysis/*      │  readFile
        │   scan → parse (AST) → deps →     │
        │   cluster → AI enrich → persist   │
        └───────────────────────────────────┘
```

\* `server/storage/storageAdapter.js` exposes the file store for uploaded codebases and dispatches on `STORAGE_ADAPTER`: the local adapter reads/writes under `env.UPLOAD_DIR` (default `./storage`), and the Mongo adapter (`mongoStorage.js`) persists into the `CodeFile` collection (required on Vercel serverless).

### Frontend state (Zustand)

| Store | File | Responsibility |
|---|---|---|
| `useUIStore` | `src/store/useUIStore.ts` | Workspaces & projects lists + CRUD, selection, modals, sidebar, search, global confirm dialog. Every action reads/writes the API and surfaces failures through an error banner. |
| `useCanvasStore` | `src/store/useCanvasStore.ts` | Nodes/edges for the current scope, breadcrumb, abstraction level, selection, search filter, layout direction, node filters, add-node, and debounced position persistence. |
| `useThemeStore` | `src/store/useThemeStore.ts` | Active theme (persisted as `archflow-theme`). |

### Frontend routing (`src/App.tsx`)

| Route | Page |
|---|---|
| `/` | Redirect → `/workspaces` |
| `/workspaces` | `WorkspaceDashboardPage` |
| `/workspaces/:workspaceId` | `ProjectDashboardPage` |
| `/workspaces/:workspaceId/projects/:projectId` | `AppShell` (Sidebar + Topbar + `<Outlet/>`) |
| `…/projects/:projectId` (index) | `ProjectWorkflowPage` → `WorkflowCanvas` |
| `…/architecture · files · apis · database · dependencies · docs · ai-insights · issues · changes` | `ProjectPlaceholderPage` (Coming Soon) |

### Canvas rendering pipeline (`WorkflowCanvas`)

1. On mount, reads `?node=<id>` from the URL:
   - If present → `restoreScope()` fetches the node path and loads that scope (deep link restore).
   - Otherwise → `setProjectContext()` loads the full graph.
2. Nodes/edges are fetched per scope:
   - Full graph: `GET /projects/:id/graph/all` (server attaches `depth` + `parentNodeId`).
   - Scope: `GET /projects/:id/graph/root` or `GET /projects/:id/graph/:nodeId/children`.
   - On failure the canvas shows an explicit error banner instead of sample data.
3. If all nodes sit at `{x:0, y:0}`, they are auto-laid out (tree layout for full view, DAGRE otherwise).
4. Double-click a node with `childCount > 0` → `drillInto()` → breadcrumb grows, URL updates with the new `?node`, and `fitView` re-centers.
5. `AnalysisOverlay` polls `GET /projects/:id/analysis/status` every 2s while an analysis job runs; on completion it calls `resetToRoot()` to reload the freshly persisted graph.

---

## Project Structure

```
ArchFlow/
├── index.html                 # Vite entry HTML
├── vite.config.ts             # React + Tailwind plugins, /api proxy → :4000
├── tsconfig.json
├── package.json               # Frontend + backend deps & scripts
├── vercel.json                # Vercel build/output/function/rewrite config
├── .env.example               # Env var template
├── backend-build-prompt.md    # Original backend spec (data contracts)
├── drilldown-tree-prompt.md   # Spec for recursive drill-down navigation
├── metadata.json              # AI Studio deployment metadata
│
├── api/index.js               # Vercel serverless entry (cached Mongo conn + Express app)
│
├── src/                       # ── React frontend ──
│   ├── main.tsx / App.tsx     # Bootstrap + router
│   ├── index.css              # Tailwind + React Flow tweaks
│   ├── theme/tokens.css       # CSS variables for the 4 themes
│   ├── types/index.ts         # Shared TS contracts
│   ├── api/client.ts          # fetch wrapper (GET/POST/PATCH/DELETE/upload)
│   ├── utils/nodeFilters.ts   # Node tag extraction (category + folder)
│   ├── store/                 # Zustand stores
│   ├── pages/                 # Route-level pages
│   ├── components/
│   │   ├── layout/            # AppShell, Sidebar, Topbar
│   │   ├── dashboard/         # Workspace/Project cards + create modals + UploadDropzone
│   │   ├── canvas/            # WorkflowCanvas, Toolbar, Breadcrumb, Inspector,
│   │   │                      # AddNodeModal, NodeFilterMenu, AnalysisOverlay, StatusBar
│   │   │   ├── nodes/EntityNode.tsx
│   │   │   └── edges/RelationshipEdge.tsx
│   │   ├── settings/          # SettingsModal (themes)
│   │   └── ui/                # ConfirmDialog, CardMenu
│
└── server/                    # ── Express backend ──
    ├── index.js               # Connect DB → listen
    ├── app.js                 # Express app (CORS, JSON, /health, /api)
    ├── config/                # env.js, db.js
    ├── middleware/            # error.js, requireAuth.js, validate.js
    ├── models/                # Mongoose models (see Data Model)
    ├── routes/                # auth, workspaces, projects, upload, analysis, graph, ai
    ├── services/
    │   ├── workspaceService.js / projectService.js / graphService.js
    │   ├── serializers.js / relativeTime.js
    │   └── analysis/          # The analysis engine
    │       ├── scanner.js             # file discovery + ignore rules
    │       ├── parser.js              # ts-morph AST extraction
    │       ├── dependencyAnalyzer.js  # import resolution
    │       ├── relationshipResolver.js# typed edges + evidence
    │       ├── clustering.js          # system/module/file/function tree builder
    │       ├── aiEnrichment.js        # Gemini summaries/insights (deterministic fallback)
    │       ├── pipeline.js            # orchestration + persistence
    │       └── queue.js               # AnalysisJob lifecycle + progress snapshots
    └── storage/               # storageAdapter.js (dispatch) + mongoStorage.js (MongoDB)
                               #   local adapter writes extracted files under ./storage
```

---

## How Analysis Works

The pipeline (`server/services/analysis/pipeline.js`) runs per project and reports progress through an `AnalysisJob` (inline in the analyze request on Vercel; via a worker process when hosted on a persistent server):

| Step | Progress | What happens |
|---|---|---|
| Scan files | 5% | `scanner.js` lists uploaded files, drops ignored dirs (`node_modules`, `.git`, `dist`, …) and non-analyzable extensions. |
| Read sources | 15% | Reads every file through the storage adapter. |
| Parse AST | 25% | `parser.js` uses `ts-morph` to extract imports, exports, functions, hooks, React components, Express routes, Mongoose models, external SDK calls, DB read/write calls, call sites, and per-member metadata. |
| Resolve deps | 40% | `dependencyAnalyzer.js` resolves relative/`@/` imports into the import graph; `relationshipResolver.js` turns call sites + imports + DB access + external calls into typed edges with evidence and confidence. |
| Build tree | 55% | `clustering.js` groups files into modules, modules into system buckets, and builds the recursive tree (`sys-*` → `mod-*` → `file-*` → `fn-*`). Edges are scoped to their parent so each drill-down scope shows only relevant connections. |
| AI enrich | 70% | `aiEnrichment.js` calls Gemini (if a key is set) for file summaries and module subtitles; otherwise uses deterministic templates. |
| Persist graph | 82% | `persistTree` writes `GraphNode`/`GraphEdge` documents and denormalizes `childCount`/`isLeaf`. |
| Generate insights | 90% | Gemini (or heuristics) produce architectural insights — e.g. "no tests detected", "large file", "central dependency hub". |
| Done | 100% | Project status → `ready`, `lastAnalyzedAt`, counts, and insights are stored. |

Edge types produced (`RelationshipType`):
`IMPORTS` · `CALLS` · `ROUTES_TO` · `USES` · `DEPENDS_ON` · `READS_FROM` · `WRITES_TO`

Node categories produced (`NodeCategory`):
`page` · `component` · `route` · `controller` · `service` · `model` · `external-api` · `db-table` · `hook` · `store`

---

## Key User Flows

**Upload → Analyze → Canvas**
1. Workspaces dashboard → open a workspace → **New Project**.
2. Enter a name/description and drop a `.zip` into the dropzone.
3. Submit → `POST /projects/:id/upload` (or the chunked `/upload/chunk` + `/upload/complete` flow) extracts files → `POST /projects/:id/analyze` runs the job → app navigates to the canvas.
4. The `AnalysisOverlay` shows live progress; on completion the graph auto-refreshes.

**Drill-down navigation**
- Double-click a node with the **N inside** badge to enter its scope.
- Use the breadcrumb bar (top-left) to go back, jump to a depth level (`Full System / System / Modules / Components / Files`), or return to root.
- The current scope is reflected in the URL (`?node=…`) and restores on reload.

**Inspecting entities**
- **Node:** click → panel shows category badge, file path, AI/static summary, lines/complexity/calls stats, sub-node satellites, and a "View Source Code" action.
- **Edge:** click → panel shows the relationship type, static confidence, and the exact AST evidence (file, line, snippet) behind the connection.

**Annotation & layout**
- **Add Node** (+ button on canvas or on a node) opens the annotation modal — saved to the backend, parented to the current scope.
- Drag nodes freely; positions sync to the backend (debounced 400 ms).
- **Auto-arrange** re-lays out the current scope along the X or Y axis.
- **Filter** nodes by parents/children or by category/folder tags; search highlights matches.

---

## Data Model (MongoDB / Mongoose)

| Model | Collection | Purpose |
|---|---|---|
| `User` | `users` | Optional auth accounts (email, bcrypt hash, name). |
| `Workspace` | `workspaces` | Top-level grouping (name, description, ownerId). |
| `Project` | `projects` | A codebase + its analysis state. `status ∈ {empty, uploading, analyzing, ready, failed}`, plus `fileCount`, `moduleCount`, `workflowCount`, `insights[]`, `lastAnalyzedAt`. |
| `UploadedFile` | `uploadedfiles` | Tracks each extracted file (`relativePath`, `storageKey`, `sizeBytes`). |
| `CodeFile` | `codefiles` | Source-file content stored in MongoDB when `STORAGE_ADAPTER=mongo` (unique `(projectId, relativePath)`). |
| `UploadChunk` | `uploadchunks` | Base64-encoded chunks of in-flight uploads (TTL 1 h, unique `(uploadId, index)`). |
| `AvatarFile` | `avatarfiles` | User avatar bytes stored in MongoDB (unique `userId`). |
| `GraphNode` | `graphnodes` | One architecture entity. Self-referential via `parentId` (null = root/system scope). `reactFlowId` is the stable ID used by the frontend; `data` holds label, category, filePath, summary, stats, `childCount`, `isLeaf`. |
| `GraphEdge` | `graphedges` | One relationship. Scoped by `parentId`, `source`/`target` reference `reactFlowId`s, `data` holds `relationshipType` + `evidence`. |
| `AnalysisJob` | `analysisjobs` | Tracks a queued/running/completed/failed analysis with `progress`, `currentStep`, `error`, timestamps. |

Indexes: `GraphNode`/`GraphEdge` are indexed on `(projectId, parentId)` and unique on `(projectId, reactFlowId)`.

---

## API Reference

All routes except `/api/auth/*` pass through `requireAuth` (JWT access cookie). Errors are returned as `{ error: { message, code } }`.

### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/signup` | Create account → sets `access_token` + `refresh_token` httpOnly cookies, `{ user }` |
| POST | `/login` | Login → sets cookies, `{ user }` |
| POST | `/refresh` | Rotate refresh token → sets new cookies |
| POST | `/logout` | Clear auth cookies |
| GET | `/me` | Current user |

### Workspaces
| Method | Path | Description |
|---|---|---|
| GET | `/workspaces` | List (with aggregate stats) |
| POST | `/workspaces` | Create |
| GET | `/workspaces/:id` | Get one |
| PATCH | `/workspaces/:id` | Update |
| DELETE | `/workspaces/:id` | Delete (cascades projects, graphs, files) |

### Projects
| Method | Path | Description |
|---|---|---|
| GET | `/workspaces/:workspaceId/projects` | List |
| POST | `/workspaces/:workspaceId/projects` | Create |
| GET | `/projects/:id` | Get one |
| PATCH | `/projects/:id` | Update |
| DELETE | `/projects/:id` | Delete (cascades graph + files) |

### Upload & Analysis
| Method | Path | Description |
|---|---|---|
| POST | `/projects/:id/upload` | Multipart field `codebase` — accepts a `.zip` (extracted + sanitized) or a single file (small uploads / local dev). |
| POST | `/projects/:id/upload/chunk` | JSON `{ uploadId, index, total, filename, data(base64) }` — one chunk of a large upload (default 3 MB, under Vercel's body limit). |
| POST | `/projects/:id/upload/complete` | JSON `{ uploadId, filename, total }` — assemble chunks, extract, persist → `{ uploadedFileCount }`. |
| POST | `/projects/:id/analyze` | Run analysis (inline) → `{ jobId, status }` (409 if already analyzing). |
| GET | `/projects/:id/analysis/status` | Job snapshot → `{ jobId, status, progress, currentStep, error }`. |

### Graph (scope-based drill-down)
| Method | Path | Description |
|---|---|---|
| GET | `/projects/:id/graph/root` | Root-scope nodes/edges (`parentId: null`) |
| GET | `/projects/:id/graph/all` | Full graph; nodes annotated with `depth` + `parentNodeId` |
| GET | `/projects/:id/graph/:nodeId/children` | Children of a node (their scope) |
| GET | `/projects/:id/graph/:nodeId/path` | Breadcrumb path from root to a node (deep links) |
| POST | `/projects/:id/graph/nodes` | Add a node (optional `parentId`) |
| PATCH | `/projects/:id/graph/nodes/:nodeId/position` | Persist `{ x, y }` |
| DELETE | `/projects/:id/graph/nodes/:nodeId` | Delete node + subtree |
| GET | `/projects/:id/graph/nodes/:nodeId` | Get node |
| GET | `/projects/:id/graph/edges/:edgeId` | Get edge |
| GET | `/projects/:id/graph?level=system\|modules\|components\|files` | Deprecated depth-walk shim |

### AI
| Method | Path | Description |
|---|---|---|
| POST | `/projects/:id/ai/explain-node/:nodeId` | AI/static summary for a node (persisted to `data.summary`) |
| POST | `/projects/:id/ai/explain-edge/:edgeId` | Relationship type + evidence for an edge |
| GET | `/projects/:id/ai/insights` | Project insights (cached on the project) |

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB (local or Atlas).

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # edit MONGODB_URI, optionally set GEMINI_API_KEY
   ```

3. **Start MongoDB** (local): `mongod` (or point `MONGODB_URI` at Atlas).

4. **Run the backend** (from the `server/` directory)
   ```bash
   cd server
   npm run dev
   ```
   The server connects to MongoDB and listens on port 4000.

5. **Run the frontend** (from the project root, separate terminal)
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — Vite proxies `/api` to http://localhost:4000.

   > Single-server mode (optional): from the project root run `npm run build` once, then `npm run server` — Express serves both the UI and `/api` on http://localhost:4000.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Express API port |
| `MONGODB_URI` | `mongodb://localhost:27017/archflow` | MongoDB connection string |
| `APP_URL` | `http://localhost:3000` | Frontend origin(s), comma-separated, used for CORS |
| `GEMINI_API_KEY` | *(empty)* | Enables AI enrichment. Empty → deterministic-only summaries/insights. |
| `JWT_ACCESS_SECRET` | dev secret | HMAC secret for short-lived access tokens (set a strong value in production) |
| `JWT_REFRESH_SECRET` | dev secret | HMAC secret for rotating refresh tokens (set a strong value in production) |
| `COOKIE_DOMAIN` | *(empty)* | Cookie domain for auth cookies. Empty = same-origin cookies (recommended). |
| `STORAGE_ADAPTER` | `local` | `local` = disk under `UPLOAD_DIR` (development); `mongo` = files in MongoDB (required on Vercel — serverless filesystems are ephemeral) |
| `UPLOAD_DIR` | `./storage` | Local disk root for extracted codebases (local adapter only) |
| `MAX_UPLOAD_SIZE_MB` | `200` | Max upload size |
| `KEEP_SOURCE_FILES` | `false` | Keep extracted files on disk after analysis |
| `VITE_API_URL` *(frontend)* | `/api` | Base URL used by `src/api/client.ts` |

---

## Deploying to Vercel

The repo is configured for a fully serverless deploy (no separate backend host):

- `vercel.json` — builds the Vite frontend (`npm run build` → `dist`) and exposes the Express API via `api/index.js`; rewrites `/api/*` to the serverless function and all other paths to the SPA.
- `api/index.js` — Vercel serverless entry that reuses one cached Mongoose connection across warm invocations and delegates to the Express app.
- **Storage** must be `mongo` (serverless functions have no persistent disk). Uploads are chunked client-side (~3 MB pieces) to stay under Vercel's function body limit.
- **Analysis runs inline** in the request (progress persisted to `AnalysisJob`); the client polls `/analysis/status`. Large repos may approach the function `maxDuration` (60 s) limit.

1. **Link + set environment variables** (Production *and* Preview):

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | Atlas connection string |
   | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | strong random secrets |
   | `APP_URL` | your production URL, e.g. `https://arch-flow-seven.vercel.app` |
   | `STORAGE_ADAPTER` | `mongo` |
   | `GEMINI_API_KEY` | *(optional)* |

   ```bash
   vercel link --yes --project <name>
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))" | vercel env add JWT_ACCESS_SECRET production
   # repeat for JWT_REFRESH_SECRET, MONGODB_URI, APP_URL, STORAGE_ADAPTER
   ```

   > Note: when adding env vars from the shell, pipe the value from a file without a trailing newline (e.g. `cmd /c "vercel env add NAME production < value.txt"`). A trailing `\r\n` from a PowerShell `|` pipe gets stored literally and will silently break `STORAGE_ADAPTER === 'mongo'` checks (falling back to the disk adapter → `ENOENT mkdir '/var/task/storage'`).

2. **Deploy:**
   ```bash
   vercel --prod --yes
   ```

3. **Smoke test** signup → create workspace/project → chunked upload → analyze → graph, plus `GET /api/auth/me` returning `401` (confirms the function boots and reaches MongoDB).

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` (root) | Vite frontend dev server on port 3000 |
| `npm run dev` (in `server/`) | Backend on port 4000 (`node --watch index.js`) |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview the production build |
| `npm run server` | Run backend + serve built UI on 4000 with `--watch` |
| `npm run server:start` | Run backend + serve built UI once |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
| `npm run clean` | Remove `dist` + `server.js` |

---

## Notes & Caveats

- **Uploaded files** are stored through `server/storage/storageAdapter.js` (`ensureProjectDir`, `saveFile`, `readFile`, `listFiles`, `deleteProjectFiles`). With `STORAGE_ADAPTER=local` they live on disk under `env.UPLOAD_DIR` (default `./storage`, gitignored); with `STORAGE_ADAPTER=mongo` they are persisted in MongoDB (the `CodeFile` collection) — required for Vercel serverless.
- **Analysis runs inline** in the `POST /analyze` request (no background worker); progress is written to the `AnalysisJob` document and polled via `/analysis/status`.
- **Placeholder views:** only the Workflow Canvas is implemented. Architecture, Files, APIs, Database, Dependencies, Docs, AI Insights, Issues, and Changes are "Coming Soon" stubs (`ProjectPlaceholderPage`).
- **Auth is always on:** signup/login set `access_token` + `refresh_token` httpOnly cookies; every `/api/*` route except `/api/auth/*` requires the access cookie.
- **AI is optional:** without `GEMINI_API_KEY` the pipeline still completes using deterministic summaries and heuristic insights.
- **No mock/sample data:** the UI only shows records from the MongoDB API. If the backend is unreachable, dashboards and the canvas show an explicit error banner instead of fabricated data.
- **Notable UI stubs:** the Topbar "Search codebase…" and Inspector "View Source Code" actions currently show `alert()` placeholders; `CanvasStatusBar` shows static "Last analyzed 2m ago".
