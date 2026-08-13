# AegisCore — Cybersecurity Defensive Platform

**Version:** 0.1.0 → 1.0.0 (real-world security platform)
**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI, MongoDB, Genkit + Google Gemini 2.5 Flash

---

## Core Platform (Original)

### Authentication
- Email/password with bcryptjs + JWT (jose) httpOnly cookies. AuthContext provides `user`, `login`, `register`, `logout`, `updateProfile`. Middleware protects all routes except public ones.

### Dashboard (`/dashboard`)
- Live stats (Total Scans, Threats Blocked, Safe Items, Risk Score Index), Recharts area chart (7-day), System Health panel, Recent Alerts feed.

### File Scanner (`/scanner/file`)
- Heuristic analysis (double extensions, dangerous extensions, >10MB). AI scan via Genkit. SHA256 hash, findings, threat summary. Auto-saved.

### URL Scanner (`/scanner/url`)
- AI assessment via `aiUrlRiskAssessment` Genkit flow. Phishing threats, domain reputation, defensive actions, risk gauge.

### Reports / Scan History (`/reports`)
- Paginated table, multi-select batch deletion. API: `GET/POST /api/history`, `DELETE /api/history`.

### Threat Intelligence Center (`/threat-intel`)
- AI daily brief via `aiDailySecurityBrief` Genkit flow. Global Threat Index, Active Vectors, Telemetry Sources.

### Settings (`/settings`)
- Profile management, defense engine toggles, data export, scan cache purge.

---

## 🆕 Phase 1 — Core Real-World Security Features

### 1.1 🔐 Email Phishing Analyzer
- **API:** `POST /api/security/email/analyze`
- **Input:** subject, body, sender, rawHeaders (optional)
- **Detection Engine:**
  - Simulated SPF/DKIM/DMARC validation
  - Keyword detection (urgency, login, financial, personal info, malicious)
  - URL extraction + risk scoring (suspicious TLDs, IP-based URLs, typosquatting)
  - Typosquatting detection via Levenshtein distance against trusted domains (Google, Microsoft, PayPal, etc.)
  - AI analysis via Genkit `aiEmailPhishingAnalysisFlow` (Gemini)
- **Output:** riskScore, riskLevel, reasons[], recommendedActions[], SPF/DKIM/DMARC status, URL findings, keyword flags, AI assessment

### 1.2 🌐 Website Security Scanner
- **API:** `POST /api/security/web/scan`
- **Input:** URL
- **Checks:** SSL validity, HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), open redirect detection, mixed content detection, WHOIS age estimation
- **Output:** securityScore (0–100), vulnerabilities[] with severity, headerReport, recommendation

### 1.3 🧬 Malware Static Analysis (Advanced File Scanner)
- **Service:** `analyzeFileMalware()` in `src/services/security/malware-analysis.service.ts`
- **Analysis:**
  - Entropy calculation (detect packed/encrypted files)
  - String extraction (URLs, IPs, API calls, registry keys, commands)
  - PowerShell commands detection (IEX, DownloadString, -EncodedCommand, etc.)
  - Base64/hex encoded payload detection
  - Suspicious API detection (CreateRemoteThread, VirtualAllocEx, WinExec, etc.)
  - MIME type mismatch detection
  - MITRE ATT&CK technique mapping per indicator
- **Indicators:** Double extension masquerading (T1036.005), process injection (T1055), PowerShell execution (T1059.001), anti-debug evasion (T1622), persistence mechanisms (T1547.001)

### 1.4 📡 IOC Scanner
- **API:** `POST /api/security/ioc/check`
- **Input:** value + type (ip | domain | url | hash)
- **Logic:** Checks against known malicious IPs, domains, hashes. Categorizes as Malware C2, Phishing, Botnet, or Safe/Unknown.
- **Output:** confidenceScore, classification, category, sourceReferences (AlienVault OTX, VirusTotal, AbuseIPDB, MISP)

---

## 🆕 Phase 2 — Intelligence & Real Data Integration

### 2.1 🛰 Real Threat Intelligence Feed System
- **API:** `GET /api/threat-intel/live` + `POST /api/threat-intel/live/filtered`
- Simulated live feed from 5 sources (AlienVault OTX, MISP, VirusTotal, Aegis HoneyNet, Dark Web Monitor)
- Generates realistic threat entries with APT actors, malware families, CVE references
- **Features:** Filter by severity/category, summary stats (total threats, by severity, by category, top indicators, recent campaigns)

### 2.2 🌍 Dark Web Exposure / Breach Checker
- **API:** `POST /api/security/breach/check`
- **Input:** email
- Deterministic breach simulation based on email hash
- Returns breach name, year, exposed fields, severity, password change recommendation

---

## 🆕 Phase 3 — SOC-Level Dashboard Upgrade

### 3.1 📊 SOC Dashboard (`/soc-dashboard`)
- **A. Alert Queue** — groups by severity, filterable (Critical/High/Medium/Low), shows score, status, description, timestamp
- **B. MITRE ATT&CK Mapping** — 10 mapped techniques across 11 tactics (T1566 Phishing, T1055 Process Injection, T1059 Command Scripting, T1003 Credential Dumping, etc.) with detection counts and severity
- **C. Incident Timeline** — chronological security events with expandable details (description + affected assets), status tracking (detected → analyzing → contained → resolved)
- **D. Threat Heatmap** — 7×24 bar chart showing attack frequency by hour, color-coded by severity
- **Summary cards:** Critical/High/Medium/Low counts, Active Incidents, Resolved Today, Avg Response Time
- **API:** `GET /api/soc/dashboard` — aggregates real ScanRecord data + simulated incidents

### 3.2 📈 Security Score Engine (`/security-score`)
- **API:** `GET /api/security/score`
- **5 weighted categories:** Browsing Safety (30%), File Safety (30%), Exposure Level (20%), Threat Response (10%), Security Hygiene (10%)
- Outputs: overallScore, letter grade (A–F), 7-day score history chart, recommendations
- Based on actual scan history from MongoDB

---

## 🆕 Phase 4 — Advanced Product Features

### 4.1 🧩 Browser Extension (`extension/`)
- Chrome Manifest V3 extension "AegisCore Security Guard"
- Real-time URL checking via `POST /api/security/ioc/check` before page loads
- Security warning overlay injected into malicious pages
- Popup with current page risk assessment + quick actions
- Background service worker with notification alerts

### 4.2 🎓 Security Awareness Training (`/security-training`)
- 6 phishing simulation emails (real vs. phishing identification)
- 10-question security knowledge quiz (categories: phishing, malware, password, social engineering, general)
- Interactive flow: identify → learn → explain (AI explains each answer)
- Session scoring with category breakdown
- Realistic phishing examples (typosquatting, urgency, invoice scams, prize lures, MFA bypass)

### 4.3 🔁 CLI Tool (`cli/`)
- `aegis scan <file>` — Scan file for malware
- `aegis scan-url <url>` — Scan website for vulnerabilities
- `aegis ioc <type> <value>` — Check IOC (ip, domain, url, hash)
- `aegis breach <email>` — Check email for data breaches
- `aegis score` — Get security score
- Config: `AEGISCORE_API` (default localhost:9002), `AEGISCORE_TOKEN`

---

## Architecture
```
User Inputs (Web / Extension / CLI)
   ↓
Frontend (Next.js Pages) / Browser Extension / CLI
   ↓
Security APIs (Next.js API Routes)
   ↓
Detection Engines (Rules + Heuristics)
   ├── Email Analyzer (SPF/DKIM/DMARC, keywords, typosquatting, URLs)
   ├── Web Scanner (SSL, headers, open redirect, mixed content)
   ├── Malware Analysis (entropy, strings, APIs, PowerShell, base64)
   ├── IOC Checker (threat intel against known malicious indicators)
   └── Breach Checker (simulated breach database)
   ↓
AI Layer (Genkit + Gemini 2.5 Flash)
   ↓
MongoDB (History + Analytics)
```

## New API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/security/email/analyze` | Email phishing analysis |
| POST | `/api/security/web/scan` | Website security scan |
| POST | `/api/security/ioc/check` | IOC reputation check |
| POST | `/api/security/breach/check` | Breach exposure check |
| GET | `/api/security/score` | User security score |
| GET | `/api/soc/dashboard` | SOC dashboard data |
| GET | `/api/threat-intel/live` | Live threat intel feed |
| POST | `/api/threat-intel/live/filtered` | Filtered threat feed |

## New AI Flows
| Flow | Purpose |
|------|---------|
| `aiEmailPhishingAnalysisFlow` | Email phishing/social engineering analysis |

## New Pages
| Route | Description |
|-------|-------------|
| `/soc-dashboard` | SOC operations dashboard |
| `/security-score` | Personal cyber hygiene score |
| `/security-training` | Security awareness training |
