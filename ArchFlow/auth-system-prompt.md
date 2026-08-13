# ArchFlow Auth System Prompt — JWT + Cookie + Refresh Token

Copy everything below into your coding agent. This replaces the `AUTH_ENABLED=false` single-user shortcut from the original backend prompt with a real (but intentionally simple) auth system: email + password, no email verification, JWT access token + rotating refresh token, both delivered as httpOnly cookies. Every Workspace/Project gets tied to a `User`.

---

## 1. Scope (keep it simple, on purpose)

- Email + password signup and login only — no email verification, no OAuth/social login, no "forgot password" flow in this pass (note it as a TODO, don't build it).
- One session model: access token (short-lived) + refresh token (long-lived, rotated on use), both as httpOnly cookies — no tokens ever touch `localStorage` or JS-readable storage.
- A `User` owns Workspaces; a Workspace's Projects inherit that ownership. No team/collaborator sharing in this pass (every workspace has exactly one owner) — but the schema shouldn't make adding collaborators later painful (see §4).

---

## 2. Dependencies

- `bcrypt` — password hashing
- `jsonwebtoken` — signing/verifying access + refresh tokens
- `cookie-parser` — reading cookies in Express
- `zod` — request body validation (signup/login payloads)

---

## 3. Data Models (Mongoose)

```
User
  _id
  email: String, required, unique, lowercase, trimmed
  passwordHash: String, required
  name: String, required
  createdAt: Date

RefreshToken
  _id
  userId: ObjectId (ref User), required, indexed
  tokenHash: String, required        // never store the raw refresh token — hash it (sha256 is fine, it's not a password)
  expiresAt: Date, required
  revokedAt: Date | null              // set when rotated or on logout
  replacedByTokenHash: String | null  // audit trail for rotation
  createdAt: Date
  userAgent: String | null            // optional, useful later for a "your sessions" list
```

Storing refresh tokens server-side (rather than trusting a stateless JWT refresh token alone) is what makes logout and revocation actually work — a purely stateless refresh JWT can't be invalidated before it expires.

---

## 4. Update Existing Models

```
Workspace
  ...existing fields...
  ownerId: ObjectId (ref User), required   // was optional/unused behind AUTH_ENABLED=false — now required
```
Project already has `workspaceId` — no change needed there; ownership is inherited transitively through the Workspace. Every Workspace/Project query in every existing route must now be scoped: `Workspace.find({ ownerId: req.user.id })`, and Project routes must first verify the parent Workspace's `ownerId` matches `req.user.id` before returning/mutating anything.

---

## 5. Token Design

| Token | Lifetime | Delivery | Contains |
|---|---|---|---|
| Access token | 15 minutes | httpOnly cookie `access_token`, `path=/` | `{ sub: userId, email }` |
| Refresh token | 30 days | httpOnly cookie `refresh_token`, `path=/api/auth/refresh` (scoped so it's only ever sent on the refresh call, not every request) | random opaque string (not a JWT) — its hash is looked up in the `RefreshToken` collection |

Cookie flags for both: `httpOnly: true`, `secure: true` (in production), `sameSite: 'lax'` (sufficient CSRF protection for a same-site app without adding a separate CSRF token scheme — call this out as a deliberate "simple, not maximal security" choice consistent with the rest of this pass).

**Refresh token rotation:** every time `/api/auth/refresh` is called, the old refresh token is marked `revokedAt` and a brand-new one is issued and stored. This means a stolen-then-reused-old refresh token can be detected (if a revoked token is presented again, revoke the entire token family for that user and force re-login) — good practice, cheap to implement, worth including even in a "simple" pass.

---

## 6. API Endpoints

```
POST /api/auth/signup
  body: { email, password, name }
  → 201 { user: { id, email, name } }
  → sets access_token + refresh_token cookies
  validation: email format, password min 8 chars; 409 if email already registered

POST /api/auth/login
  body: { email, password }
  → 200 { user: { id, email, name } }
  → sets access_token + refresh_token cookies
  → 401 on wrong email/password (don't reveal which one was wrong)

POST /api/auth/refresh
  reads refresh_token cookie (no body needed)
  → 200, sets new access_token + refresh_token cookies (rotation, per §5)
  → 401 + clears both cookies if refresh token is invalid/expired/revoked

POST /api/auth/logout
  reads refresh_token cookie, marks it revoked in DB
  → 204, clears both cookies

GET /api/auth/me
  requires valid access_token cookie
  → 200 { user: { id, email, name } }
  → 401 if not authenticated (frontend uses this on app load to check session)
```

---

## 7. Middleware

```
requireAuth(req, res, next)
  - reads access_token cookie, verifies JWT
  - on success: req.user = { id, email }, next()
  - on missing/invalid/expired: 401 { error: { code: 'UNAUTHENTICATED' } }
```
Apply `requireAuth` to every route except `/api/auth/signup`, `/api/auth/login`, `/api/auth/refresh`. This replaces the `AUTH_ENABLED` feature flag entirely — auth is now always on.

**Frontend 401 handling convention:** the frontend's fetch wrapper should, on any `401 UNAUTHENTICATED` response, attempt exactly one silent call to `/api/auth/refresh` and retry the original request once; if the refresh also fails, redirect to `/login`. This keeps the 15-minute access token invisible to the user in normal use.

---

## 8. Frontend Touch Points (minimal — wire into the existing app, don't rebuild it)

- New routes: `/login`, `/signup` — simple forms (email, password, and name on signup), reusing existing shadcn `Input`/`Button` components and the app's existing dark theme.
- New `useAuthStore` (Zustand): `{ user: {id,email,name} | null, status: 'idle'|'loading'|'authenticated'|'unauthenticated' }`, populated by calling `GET /api/auth/me` once on app load.
- Wrap the existing `AppShell`/protected routes in a simple `RequireAuth` component that redirects to `/login` if `useAuthStore.status === 'unauthenticated'`.
- All existing `fetch` calls must include `credentials: 'include'` so cookies are sent — centralize this in one small `apiFetch` wrapper (this is also where the 401-retry-once-then-redirect logic from §7 lives) rather than repeating it per call site.
- Sidebar/topbar: add a simple user menu (name/email + "Log out" calling `POST /api/auth/logout` then redirecting to `/login`).

---

## 9. Environment Variables

Add to `.env.example`:
```
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."       # can reuse the same secret if you prefer, but separate is safer
ACCESS_TOKEN_TTL_MIN=15
REFRESH_TOKEN_TTL_DAYS=30
COOKIE_DOMAIN="localhost"       # set to your real domain in production
NODE_ENV="development"          # controls the `secure` cookie flag
```
Remove `AUTH_ENABLED` — no longer needed, auth is unconditional.

---

## 10. Non-Goals for This Pass

- No email verification, no password reset/"forgot password" flow (note as a clear TODO comment near the auth routes so it's easy to find later)
- No OAuth/social login
- No workspace collaborators/sharing/roles — single owner per workspace only
- No rate limiting on login/signup in this pass (worth flagging as a follow-up — brute-force protection matters, just not blocking this MVP)
- No "remember me" toggle — refresh token TTL is fixed at 30 days for everyone

---

## 11. Definition of Done

- [ ] Signing up creates a `User`, hashes the password with bcrypt (never store/log plaintext), and immediately logs the user in (cookies set, no separate "please log in" step)
- [ ] Logging in with wrong credentials returns a generic 401, not "email not found" vs "wrong password" (avoid leaking which part was wrong)
- [ ] Access token expires after 15 minutes; a request made after expiry gets a 401, and the frontend's silent refresh-and-retry recovers without the user noticing
- [ ] Calling `/api/auth/refresh` rotates the refresh token — the old one is marked revoked and can't be reused
- [ ] Logging out clears both cookies and revokes the refresh token server-side (confirm by trying `/api/auth/refresh` after logout — it should fail)
- [ ] Every Workspace and Project endpoint is scoped to `req.user.id` — one user can never see, edit, or delete another user's workspace/project via the API, even with a guessed/valid-looking ID
- [ ] Reloading the app while logged in stays logged in (session restored via `GET /api/auth/me` using the cookies, not any client-stored token)
- [ ] All protected routes redirect an unauthenticated visitor to `/login`
