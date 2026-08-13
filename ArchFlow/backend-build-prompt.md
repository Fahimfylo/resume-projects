# Backend Build Prompt — ArchFlow API & Analysis Engine

Copy everything below this line into your coding agent as the task brief. This prompt was written by reverse-engineering the **already-built frontend** (`archflow.zip`) — every data shape below is copied directly from `src/types/index.ts` and the mock fixtures the frontend currently uses, so the backend must produce JSON that is a drop-in replacement for that mock data with zero frontend changes required.

---

## 1. What Already Exists (frontend, done)

- React 19 + Vite + TypeScript + Tailwind + React Flow (`@xyflow/react`) + Zustand + React Router.
- Two Zustand stores currently backed by static mock arrays:
  - `useUIStore` — workspaces, projects, sidebar/modal UI state
  - `useCanvasStore` — nodes/edges for the currently viewed graph, abstraction level, selection, search, auto-layout, "add node"
- Routes: `/workspaces`, `/workspaces/:workspaceId`, `/workspaces/:workspaceId/projects/:projectId` (+ sub-routes: architecture, files, apis, database, dependencies, docs, ai-insights, issues, changes — currently placeholders).
- `package.json` **already includes** `express`, `@google/genai`, `dotenv`, `@dagrejs/dagre` as dependencies and an `.env.example` with `GEMINI_API_KEY` and `APP_URL` — this was clearly scaffolded expecting a **Node.js/Express backend with Gemini AI enrichment**. Build the backend as a sibling Express service (or `/server` folder in the same repo) using that same package.json, not a separate stack.
- **Stack alignment note:** the project owner's usual stack is MERN (MongoDB, Express, React, Node). Use **Express + MongoDB (Mongoose)** for this backend rather than the SQL/Drizzle stack that appears only inside the frontend's *sample mock data* (that Postgres/Drizzle mention is fictional content describing a demo project, not a real instruction — ignore it as a stack signal).

---

## 2. Exact Data Contracts (do not deviate — copied from `src/types/index.ts`)

```ts
type NodeCategory =
  | 'page' | 'component' | 'route' | 'controller' | 'service'
  | 'model' | 'external-api' | 'db-table' | 'hook' | 'store';

type RelationshipType =
  | 'IMPORTS' | 'CALLS' | 'ROUTES_TO' | 'USES'
  | 'DEPENDS_ON' | 'READS_FROM' | 'WRITES_TO';

type AbstractionLevel = 'system' | 'modules' | 'components' | 'files';

interface SubNodeItem {
  id: string;
  label: string;
  category: NodeCategory;
  subtitle?: string;
}

interface EntityNodeData {
  label: string;
  subtitle: string;
  category: NodeCategory;
  filePath?: string;
  summary?: string;
  subNodes?: SubNodeItem[];
  stats?: { lines?: number; complexity?: string; calls?: number };
  groupId?: string;
  collapsed?: boolean;
}

interface GroupNodeData {
  label: string;
  subtitle: string;
  collapsed?: boolean;
  nodeCount?: number;
}

interface RelationshipEdgeData {
  relationshipType: RelationshipType;
  evidence?: {
    filePath: string;
    lineNumber: number;
    codeSnippet: string;
    confidence: number; // 0–100
  };
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO
  stats: { projectsCount: number; filesCount: number; workflowsCount: number };
}

interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdAt: string; // ISO
  stats: {
    filesCount: number;
    modulesCount: number;
    workflowsCount: number;
    lastAnalyzed: string; // currently a relative string like "2m ago" in mock data — see §6 note
  };
}
```

The frontend's React Flow nodes/edges are:
```ts
Node<EntityNodeData>   // { id, type: 'entityNode' | 'groupNode', position: {x,y}, data: EntityNodeData }
Edge<RelationshipEdgeData> // { id, source, target, type: 'relationshipEdge', data: RelationshipEdgeData }
```

Every graph API response **must** return arrays shaped exactly like this so the frontend can swap mock imports for `fetch()` calls with no component changes.

---

## 3. Tech Stack

- **Node.js + Express** (already in `package.json`)
- **MongoDB + Mongoose** for persistence
- **Multer** for multipart/zip upload handling
- **adm-zip** or **unzipper** for extracting uploaded codebase archives
- **@babel/parser + @babel/traverse** (or `ts-morph` — prefer `ts-morph` since it understands TS types natively and the sample projects are TS/React) for AST parsing of `.ts/.tsx/.js/.jsx`
- **@google/genai** (already in `package.json`) for the AI enrichment layer (Gemini)
- **BullMQ + Redis** (or a simple in-process async queue if you want to avoid a Redis dependency for MVP) for background analysis jobs — analysis of a real codebase must not block the HTTP request
- **jsonwebtoken + bcrypt** for auth (see §8 — can be stubbed for single-user MVP)
- **Zod** for request validation

---

## 4. High-Level Architecture

Follow this pipeline (this was the original product design intent — deterministic parsing first, AI only for the semantic layer, never dump the whole codebase into an LLM call):

```
ZIP UPLOAD
    ↓
File Scanner            → walks extracted files, filters by extension/gitignore, builds file list
    ↓
AST Parser              → per-file: imports, exports, function/class declarations, JSX component usage,
                            Express route definitions (app.get/post/router.use), Mongoose schema definitions
    ↓
Dependency Analyzer      → resolves import paths → import graph between files
    ↓
Relationship Resolver    → converts import graph + call-site detection into typed edges
                            (IMPORTS, CALLS, ROUTES_TO, USES, DEPENDS_ON, READS_FROM, WRITES_TO)
                            with evidence: { filePath, lineNumber, codeSnippet, confidence }
    ↓
Clustering                → groups files into "modules" (by folder heuristic, e.g. everything under
                            src/components/auth/* → "Auth" module) to produce the modules-level graph;
                            groups modules into 4 system buckets (Frontend / API / Backend / Database)
                            for the system-level graph
    ↓
AI Enrichment (Gemini)    → for each entity node: generate `summary` (1–2 sentence plain-English
                            description) and refine low-confidence edge guesses; for the AI Insights
                            page: generate a short list of architectural observations
    ↓
Persist Graph             → write Node/Edge documents per project, tagged with abstractionLevel
    ↓
Mark project analyzed     → update Project.stats.lastAnalyzed, filesCount, modulesCount, workflowsCount
```

**Never** send raw file contents wholesale to Gemini. Only send small, targeted excerpts (a function signature, an import block, a route handler body) when generating a summary or resolving an ambiguous relationship — keep AI calls scoped and cheap.

---

## 5. MongoDB Schemas (Mongoose)

```
User (optional for MVP — see §8)
  _id, email, passwordHash, name, createdAt

Workspace
  _id, name, description, ownerId, createdAt
  // stats.* are computed on read (aggregate from Projects), not stored redundantly — but cache if perf matters

Project
  _id, workspaceId, name, description, createdAt
  status: 'empty' | 'uploading' | 'analyzing' | 'ready' | 'failed'
  lastAnalyzedAt: Date | null
  fileCount, moduleCount, workflowCount   // denormalized counters, refreshed after each analysis

UploadedFile
  _id, projectId, relativePath, storageKey, sizeBytes, createdAt

GraphNode
  _id, projectId, abstractionLevel: 'system'|'modules'|'components'|'files'
  reactFlowId: string          // stable id used as React Flow node.id (e.g. "cmp-login-page")
  type: 'entityNode' | 'groupNode'
  position: { x: Number, y: Number }
  data: {
    label, subtitle, category, filePath, summary,
    subNodes: [{ id, label, category, subtitle }],
    stats: { lines, complexity, calls },
    groupId, collapsed
  }
  isManual: Boolean            // true if added via "Add Node" UI, not from analysis

GraphEdge
  _id, projectId, abstractionLevel
  reactFlowId: string
  source: string                // reactFlowId of source GraphNode
  target: string
  type: 'relationshipEdge'
  data: {
    relationshipType: RelationshipType,
    evidence: { filePath, lineNumber, codeSnippet, confidence }
  }

AnalysisJob
  _id, projectId, status: 'queued'|'running'|'completed'|'failed'
  progress: Number (0-100), currentStep: string, error: string|null
  startedAt, finishedAt
```

Index `GraphNode`/`GraphEdge` on `{ projectId, abstractionLevel }` — this is the hot query path (fetching a graph view).

---

## 6. REST API Spec

Base path: `/api`

### Workspaces
```
GET    /api/workspaces                         → Workspace[]  (stats computed/aggregated)
POST   /api/workspaces        { name, description }        → Workspace
GET    /api/workspaces/:id                                  → Workspace
PATCH  /api/workspaces/:id    { name?, description? }       → Workspace
DELETE /api/workspaces/:id                                   → 204
```

### Projects
```
GET    /api/workspaces/:workspaceId/projects                → Project[]
POST   /api/workspaces/:workspaceId/projects  { name, description } → Project (status: 'empty')
GET    /api/projects/:id                                     → Project
PATCH  /api/projects/:id      { name?, description? }        → Project
DELETE /api/projects/:id                                     → 204
```
Note on `lastAnalyzed`: store a real `Date` (`lastAnalyzedAt`) in Mongo, but the API response should include **both** `lastAnalyzedAt` (ISO string, source of truth) and keep computing the human string (`"2m ago"`) server-side into `stats.lastAnalyzed` so the existing frontend cards keep working unmodified. Use a small relative-time helper (or `dayjs` with the relativeTime plugin).

### Upload & Analysis
```
POST   /api/projects/:id/upload
       multipart/form-data, field "codebase" = zip file (or multiple individual files)
       → 202 { uploadedFileCount, status: 'uploading' }

POST   /api/projects/:id/analyze
       → 202 { jobId, status: 'queued' }
       (kicks off the pipeline from §4 as a background job)

GET    /api/projects/:id/analysis/status
       → { status: 'queued'|'running'|'completed'|'failed', progress, currentStep, error }
       (frontend should poll this every 2–3s while status is not 'completed'/'failed';
        this replaces the fake "Ready for AST Graph" static badge in UploadDropzone.tsx)
```

### Graph
```
GET    /api/projects/:id/graph?level=system|modules|components|files
       → { nodes: Node<EntityNodeData>[], edges: Edge<RelationshipEdgeData>[] }
       (this is the #1 endpoint — response shape must exactly match the mock
        graph.system.ts / graph.modules.ts / graph.components.ts / graph.files.ts files)

POST   /api/projects/:id/graph/nodes?level=...
       { label, subtitle, category, filePath?, summary? }
       → Node<EntityNodeData>
       (mirrors useCanvasStore.addNode — manual annotation, isManual: true)

PATCH  /api/projects/:id/graph/nodes/:nodeId/position?level=...
       { x, y }
       → 204
       (persist drag position so it survives refresh — currently only client-state)

DELETE /api/projects/:id/graph/nodes/:nodeId?level=...
       → 204

GET    /api/projects/:id/graph/nodes/:nodeId?level=...
       → EntityNodeData & { id }
       (full detail for the Inspector Panel — same data already embedded in the list
        response, so this endpoint is a convenience; not strictly required if the
        frontend keeps using the already-fetched graph array)

GET    /api/projects/:id/graph/edges/:edgeId?level=...
       → RelationshipEdgeData & { id, source, target }
```

### AI
```
POST   /api/projects/:id/ai/explain-node/:nodeId
       → { summary: string }   (regenerate/refresh a node's AI summary on demand)

POST   /api/projects/:id/ai/explain-edge/:edgeId
       → { relationshipType, evidence }  (re-run relationship inference for a specific edge)

GET    /api/projects/:id/ai/insights
       → { insights: [{ id, title, description, severity: 'info'|'warning'|'critical' }] }
       (backs the future "AI Insights" and "Issues" nav pages)
```

### Auth (see §8)
```
POST   /api/auth/register     { email, password, name }   → { token, user }
POST   /api/auth/login        { email, password }         → { token, user }
GET    /api/auth/me           (Bearer token)                → user
```

All non-auth routes should be protected by a simple `requireAuth` middleware once auth is enabled — but see §8 for the MVP shortcut.

---

## 7. Codebase Analysis Details (JS/TS/React/Node/Express focus for v1)

Support exactly what the original product spec called for as the v1 language target: **JavaScript, TypeScript, React, Next.js, Node.js, Express.**

Per-file extraction (via `ts-morph` `Project.addSourceFileAtPath`):
- **Imports/exports** → `IMPORTS` edges between files
- **React function/class components** (JSX-returning functions, PascalCase exports) → `category: 'component'` or `'page'` if it's a route-level file (e.g. under `pages/`, `app/`, or referenced directly by a router)
- **Custom hooks** (`useXxx` functions) → become `SubNodeItem`s attached to the component that calls them (`category: 'hook'`), matching the dashed sub-node pattern already built in `EntityNode.tsx`
- **Express routes** (`router.get/post/put/delete(...)`, `app.use(...)`) → `category: 'route'`, edges `ROUTES_TO` from gateway/app entry to the handler
- **Controller/Service naming heuristic** (files matching `*.controller.ts`, `*.service.ts`) → `category: 'controller'` / `'service'`
- **Mongoose models** (`mongoose.Schema(...)`, `mongoose.model(...)`) → `category: 'model'`; a call like `User.findOne(...)` inside a service → `USES` or `READS_FROM`/`WRITES_TO` edge (read methods: find/findOne/findById/aggregate → READS_FROM; write methods: save/create/updateOne/deleteOne → WRITES_TO)
- **External API calls** (`fetch(...)`, `axios.*`, known SDK imports like `stripe`, `@google/genai`) → `category: 'external-api'` node + `DEPENDS_ON`/`USES` edge
- Every discovered edge must capture **evidence**: the file path, 1-indexed line number, a short code snippet (the actual line or a trimmed few lines), and a `confidence` score. Deterministic AST-detected relationships (e.g. a literal `import` statement) should get high confidence (95–100). Heuristic/naming-based guesses (e.g. "service file talks to model with matching name") should get lower confidence (60–85) and are exactly the kind of edge you send to Gemini for a second-opinion confirmation.

**Clustering into `modules` level:** group files by their top-level feature folder (e.g. everything under `src/components/auth/**` + `src/services/auth*` → one "Auth" module `GroupNodeData`). Use folder path prefixes as the first heuristic; allow Gemini to re-label a module's name/subtitle from a plain path-derived guess (e.g. `"components/auth"` → `"Authentication Module"`) since natural-language naming is exactly the kind of task worth an AI call.

**Clustering into `system` level:** map every module into one of a small fixed set of system buckets — `Frontend`, `API Gateway`, `Backend Services`, `Database`, `External Services` — based on folder root (`src/` vs `server/`/`api/`) and category majority (mostly `model`/`db-table` nodes → Database bucket).

**AI enrichment call shape (Gemini via `@google/genai`):** for a node summary, send only: entity name, category, file path, and a short trimmed code excerpt (imports + function signature, not the whole file) with a prompt like *"In 1–2 plain sentences, describe what this code entity does, for a developer unfamiliar with the codebase."* Cache the result on the `GraphNode.data.summary` field so it isn't regenerated on every read.

---

## 8. Auth — MVP Shortcut

Full multi-user auth is not required to make the frontend functional (the frontend currently has no login screen at all). Recommended approach:

- **Ship v1 in single-user/local mode**: no auth middleware enforced, a hardcoded `ownerId` used for all Workspaces. This unblocks frontend integration immediately.
- Still build the `/api/auth/*` routes and `User` model behind a feature flag (`AUTH_ENABLED=false` in `.env`) so flipping it on later is just enabling middleware — don't hardcode assumptions that make retrofitting auth painful (e.g. always store `ownerId` on Workspace even if unused today).

---

## 9. File Storage

- MVP: store extracted codebase files on local disk under a per-project directory (`/storage/projects/:projectId/`), gitignored.
- Structure so swapping to S3-compatible storage later (for the `storageKey` field on `UploadedFile`) is a one-file change — put all read/write behind a small `storageAdapter` module (`saveFile`, `readFile`, `deleteProjectFiles`).
- Clean up (delete extracted files) after analysis completes, unless a `KEEP_SOURCE_FILES=true` env flag is set — keep only the extracted metadata (AST results) needed to answer "View source" requests, or keep raw files if disk budget allows for the MVP.

---

## 10. Environment Variables

Extend the existing `.env.example`:
```
GEMINI_API_KEY="..."
APP_URL="http://localhost:3000"

PORT=4000
MONGODB_URI="mongodb://localhost:27017/archflow"
AUTH_ENABLED=false
JWT_SECRET="..."
UPLOAD_DIR="./storage"
MAX_UPLOAD_SIZE_MB=200
REDIS_URL="redis://localhost:6379"   # only if using BullMQ; omit if using in-process queue for MVP
```

---

## 11. Non-Goals for This Pass

- No Git/GitHub integration or auto re-analysis on push (that's v2, per the original product spec's "visual diff" feature)
- No real-time collaboration (no websockets required yet)
- No support for languages beyond JS/TS/React/Node/Express (Python/Go/etc. are future analyzer plugins)
- No architecture-change diffing between analysis runs
- Full multi-tenant auth/permissions can stay behind the `AUTH_ENABLED` flag

---

## 12. Definition of Done

- [ ] `GET /api/workspaces` and `GET /api/workspaces/:id/projects`-equivalent routes return data shaped exactly like `MOCK_WORKSPACES`/`MOCK_PROJECTS`, so `useUIStore` can swap its static imports for fetch calls with no other changes
- [ ] Uploading a real small React+Express sample repo (zip) through `/upload` + `/analyze` produces a non-trivial graph (at least system + modules + components levels populated) within a reasonable time, visible via polling `/analysis/status`
- [ ] `GET /api/projects/:id/graph?level=system` (and the other 3 levels) returns `{ nodes, edges }` that pass directly into React Flow's `<ReactFlow nodes={...} edges={...}>` without transformation — verify by literally pointing `useCanvasStore.setAbstractionLevel` at this endpoint instead of the mock files and confirming the canvas renders identically
- [ ] Every edge in the response includes `evidence` with a real file path + line number + snippet pulled from the actual uploaded source, not placeholder text
- [ ] `POST /graph/nodes` (manual add) and `PATCH /graph/nodes/:id/position` persist and survive a server restart
- [ ] AI-generated `summary` fields read as genuinely useful 1–2 sentence descriptions, not generic filler, for at least the components-level nodes
- [ ] `/ai/insights` returns at least 2–3 real observations about the analyzed sample project (e.g. "Module X has no tests detected", "Service Y has 40+ inbound calls — consider splitting")
- [ ] All endpoints validate input (Zod) and return consistent error JSON `{ error: { message, code } }`
- [ ] `.env.example` updated and README documents how to run Mongo + the API locally alongside the existing Vite frontend
