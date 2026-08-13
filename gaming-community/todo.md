# NEXUS — Remaining Tasks

## 🟢 Must Fix
- [ ] **Promote first user to admin** — create a setup page or CLI script so the first registered user auto-becomes SUPER_ADMIN (currently no way to get admin without DB access)
- [ ] **Seed default feature flags** — add a startup script that creates defaults (`ai_coach`, `tournaments`, `chat`, `clips`, `new_ui`) in the FeatureFlags collection on first run
- [ ] **Logout from mod account** — user is currently logged in as mod@nexus.com and needs to sign out to test other accounts

## 🟡 Admin Panel Gaps (from spec)
- [ ] **Security Center** (`/admin/security`) — suspicious login detection, brute-force detection, IP bans, device management, session management UI
- [ ] **Chat & Realtime Control** (`/admin/chat`) — monitor public chats, emergency mute, disable chat globally, slow mode, keyword blacklist
- [ ] **CMS / Content Management** (`/admin/cms`) — edit homepage banners, update featured games, manage landing page content, announcements carousel
- [ ] **Creator & Monetization Panel** (`/admin/monetization`) — creator verification, sponsorship requests, payouts, subscriptions, premium plans, revenue charts
- [ ] **Gaming API Management** (`/admin/integrations`) — Riot/Steam/Twitch/Discord API key management, usage monitoring, rate limits, enable/disable integrations
- [ ] **Live System Monitoring** (`/admin/monitoring`) — API latency, WebSocket connections, DB health, memory/CPU usage, AI queue status, container monitoring

## 🔵 AI & Moderation
- [ ] **AI-powered moderation** — toxic chat detection, hate speech detection, NSFW detection, spam detection (currently Report model exists but no AI analysis)
- [ ] **Moderation auto-actions** — auto-flag/mute users based on AI risk score thresholds
- [ ] **Automatic tournament bracket generation** — seeding, elimination tree, match scheduling
- [ ] **AI matchmaking** — skill-based team balancing using ML

## 🟣 Platform Features
- [ ] **Email/push notification delivery** — Notification model stores broadcasts but actual email/push sending is not implemented
- [ ] **WebSocket / real-time** — live chat, live activity counters, real-time moderation, tournament live scoreboards
- [ ] **Analytics exports** — CSV/PDF export for reports and analytics data
- [ ] **File upload to cloud storage** — currently stored locally in `server/uploads/`, should move to S3/Cloudinary for production

## ⚫ Production Readiness
- [ ] **Docker compose** — containerize frontend, backend, MongoDB
- [ ] **CI/CD pipeline** — GitHub Actions for lint → test → build → deploy
- [ ] **End-to-end tests** — Playwright or Cypress for critical flows (auth, admin, sessions)
- [ ] **Backend test suite** — Jest/Vitest for API endpoints and middleware
- [ ] **Rate limit tuning** — admin endpoints should have separate (lower) rate limits
- [ ] **HTTPS enforcement** — redirect HTTP → HTTPS in production
- [ ] **Logging service** — replace `console.log` with structured logging (winston/pino)
- [ ] **Error tracking** — Sentry or similar for production error monitoring
