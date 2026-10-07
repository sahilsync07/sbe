# Sri Brundabana Enterprises (SBE) — Master Engineering Journal & Architecture Ledger

> **Production Master Reference & AI Assistant Knowledge Base**  
> Location: Rayagada, Odisha, India  
> Last Updated: October 08, 2026  
> Authoritative System Ledger for `e-SBE` (Client Catalog) & `e-SBE Hub` (Operations)

---

## 1. System Ecosystem Overview

The SBE Footwear Wholesale software suite powers wholesale distribution, real-time inventory management, Tally accounting integration, automated marketing asset synthesis, and customer risk profiling.

```
                           +---------------------------+
                           |   Tally Prime / ERP 9     |
                           |   (Port 9000 XML ODBC)    |
                           +-------------+-------------+
                                         |
                                         v
                           +-------------+-------------+
                           |  Node/Express Backend     |
                           |  (backend/src/server.js)  |
                           +-------------+-------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
        +-----------------------------+     +-----------------------------+
        |  e-SBE Catalog & Mobile App |     |  e-SBE Hub Operations App   |
        |  (frontend/ - com.sbe.app)  |     |  (sbe-hub/ - com.sbe.hub)   |
        +-----------------------------+     +-----------------------------+
                       |                                   |
                       +-----------------+-----------------+
                                         |
                                         v
                           +-------------+-------------+
                           | GitHub REST API / Storage |
                           | Cloudinary Image Clusters |
                           +---------------------------+
```

---

## 2. Dual Application Architecture: `e-SBE` vs `e-SBE Hub`

### 2.1 The Two Applications

1. **`e-SBE` (Primary Client & Mobile App):**
   - **Root:** `frontend/`
   - **Audience:** Wholesale footwear buyers, counter customers, showroom visitors, and field sales agents.
   - **Focus:** Ultra-fast browsing, visual clarity, instant stock levels, WhatsApp photo sharing, and offline shopping carts.
   - **Key Features:**
     - *Triple Mode Toggle:* Clean Mode (in-stock with photos only), All Mode (full inventory), Upload Mode (admin-only missing photo workbench).
     - *One-Touch Mode & Canvas Compositor:* WhatsApp photo generator with natural aspect ratio preservation and black bottom specs banner.
     - *Brand Landing Page:* Swiss luxury typography, superimposed pill-in-pill brand lockups (Paragon Gents/Ladies), authentic manufacturer vector badges.
     - *Offline Image Cache:* Delta caching via LocalStorage/SQLite and Cloudinary `w_400` WebP transformations.

2. **`e-SBE Hub` (Operations & Financial Command Center):**
   - **Root:** `sbe-hub/`
   - **Audience:** Business owners, finance heads, accountants, and warehouse managers.
   - **Focus:** Financial health, party categorization, default risk scoring, physical sample audits, and system broadcasts.
   - **Key Features:**
     - *Party Tagger (`/party-tagger`):* Wholesaler vs Retailer (`partyType`), Credit Risk Flagging (`creditStatus`: Normal, Bad Debt 🔴, Doubtful 🟠), Settled Not Accounted (`settlementStatus` 🟡, `settledAmount`, `settlementNote`), Group View, Ledger View, Criticality Aging Buckets.
     - *Sample Room (`/sample-room`):* Showroom physical sample article tracker with offline-resilient batch staging and single Git push.
     - *Line Debtors Analyzer (`/analyzer`):* 30/60/90/180/365+ days aging breakdown, debt concentration KPIs, bad debt deduction, net recoverable balances, and 1-tap WhatsApp payment reminders.
     - *Notification Sender (`/notification-sender`):* Broadcast push center with live mobile phone preview, pre-configured templates, and Capacitor local notification dispatch.
     - *Smart Dual-Mode Sync:* Live Tally ODBC/HTTP sync on PC; remote GitHub CDN refresh on mobile.
     - *Engineering Journal (`/journal`):* Interactive embedded knowledge base.

### 2.2 The Shared Code Engine (`sbe-hub/vite.config.js`)

To prevent code duplication, `sbe-hub` uses a Vite pre-resolver plugin (`fallbackToFrontend()`):
```javascript
// sbe-hub/vite.config.js
if (source.startsWith('@/')) {
  resolvedPath = path.resolve(__dirname, 'src', source.slice(2));
}
// 1. Checks if file exists in sbe-hub/src/
// 2. If not, transparently redirects to frontend/src/
```
- **Rule of Thumb:** All common business logic (`useLedgerData`, `useStockData`, `useCart`, `usePartyTagger`, `useSampleRoomTagger`, `githubSync`, `notifications.js`) lives in `frontend/src/` and is inherited automatically by `sbe-hub`.

---

## 3. Data Pipeline & In-Memory Metadata Lock

### 3.1 The Overwrite Danger in Tally Sync
When Tally ERP 9 / Prime exports ledger balances to JSON, it has no knowledge of operational tags like Wholesaler/Retailer, Bad Debt, or Settled Not Accounted. Without protection, every Tally sync would wipe out custom metadata!

### 3.2 The Architectural Solution (`syncLedgerToFile` in `backend/src/server.js`)
1. Before writing new Tally ledgers, the backend reads existing `ledger-data.json` into memory.
2. It extracts all custom tags into a case-insensitive lookup map keyed by `ledgerName.toLowerCase().trim()`.
3. Fresh accounting balances are merged with their preserved metadata tags.
4. The file is written to disk simultaneously across both `frontend/public/assets/` and `sbe-hub/public/assets/`.
5. Background Git automation (`gitCommitAndPush`) commits and pushes the updated data.

### 3.3 Client-Side Dual-Path Sync (`githubSync.js`)
If the backend is offline (e.g., manager working on mobile or from home):
1. `syncDataDualPath()` tries `http://localhost:3000/api/...` with a 2500ms timeout.
2. If offline, it falls back to the **direct GitHub REST API** using an authenticated Personal Access Token.
3. Automatically fetches current file SHA, base64 encodes content, and handles 409 conflict retries.

---

## 4. One-Touch Mode & Canvas Architecture

1. **Natural Aspect Ratio Preservation:**
   - Problem: Tall portrait footwear photos were getting squeezed vertically to fit fixed canvas ratios.
   - Solution: `scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)`. The image is centered with black letterboxing, maintaining 100% natural proportions.
2. **Bottom Specs Extension Bar:**
   - Renders a pure black `#000000` banner at the bottom of each shared image.
   - Displays Date, Article Name, Size Run, Colorway, and Available Stock Qty in crisp JetBrains Mono.
3. **Royal Minimalist Brand Summary Cover Page:**
   - Synthesizes an off-white luxury card with geometric gold border, official manufacturer logo, HD e-SBE logo, and large calendar date/day lockup.

---

## 5. Push Notification System

1. **Storage Feed:** Appended to `assets/notifications.json` with payload `{ id, title, body, targetRoute, timestamp, priority }`.
2. **Client Startup Polling (`checkAndNotifyBroadcasts` in `frontend/src/utils/notifications.js`):**
   - Checks unseen notification IDs against `localStorage['sbe_seen_notification_ids']`.
   - Uses `@capacitor/local-notifications` to trigger native Android system status bar alerts.
   - Deep-links to target routes (`/workzone/new-arrivals`, `/rate-chart`, etc.) upon notification click.

---

## 6. Chronological Operations Ledger

| Date / Milestone | Commits / PRs | Problems Encountered | Engineering Resolution |
| :--- | :--- | :--- | :--- |
| **2026-10-08** | Production Deploy | Engineering Journal route missing in SBE Hub & broken sync button; Need customer classification & risk scoring | Added `/journal` route to `sbe-hub`, rebuilt Journal as authoritative AI Master Guide; Built Party Tagger (`partyType`, `creditStatus`, `settlementStatus`); Added Sample Room staging, Notification Broadcaster, and Tally in-memory metadata lock. |
| **2026-10-07** | `2241a4c`, `26660c9`, `705d1e4` | Tall portrait photos squashed in One Touch mode; Eeken 16104 showing wrong MRP 649 card | Fixed canvas letterboxing to preserve natural aspect ratio; Mapped Eeken 16104 to official HD dealer poster; Bulk uploaded photos across Fencer, Cubix, Magnet, Loose. |
| **2026-10-06** | `413cbbf`, `ae72ba4`, `3379a43` | Clean View showing cards with broken images; Canvas memory lag on mobile | Filtered out broken cloud images in Clean View; Refactored One Touch to direct HTML5 Canvas rendering; Bulk uploaded 95+ Swastik & Vertex articles. |
| **2026-10-05** | `b99b31d`, `575a27b`, `e271b47` | Routine photo uploads triggering unnecessary Google Play APK builds; Git flooded with single-photo commits | Implemented negative path patterns in GitHub Actions CI; Added session photo batch staging; Updated HD cropped e-SBE logo across assets. |
| **2026-10-04** | `8d94031`, `d2837c7`, `4d465e4` | Need clean photo-only catalog for customers while keeping upload workflow for admin | Built Triple Toggle (Clean / All / Upload) with admin password protection; Added pure black bottom specs extension bar to WhatsApp share images. |
| **2026-09-24 - 27** | `e4dafc5`, `078db35`, `d30e497` | SBE Hub needed as independent app without duplicating frontend code | Created standalone SBE Hub app with Vite `fallbackToFrontend()` shared plugin; Remade Line Debtors Analyzer with 30/60/90 days aging; Built Google Play release signing pipeline. |
| **2026-09-20 - 23** | `0c61877`, `365633d`, `dieqsg5tr` | AI mockup SVG logos and swapped multi-variant color cards | Purged AI SVGs in favor of authentic vector logos; Designed luxury Swiss typography header; Fixed 62 colorway database records; Added secondary Cloudinary failover & Cloudflare edge proxy. |

---

## 7. Script Execution Library

| Script | Location | Purpose | Execution Command |
| :--- | :--- | :--- | :--- |
| `server.js` | `backend/src/` | Tally XML ODBC sync, in-memory metadata preservation lock, dual-path file writes, background Git commits | `node backend/src/server.js` |
| `githubSync.js` | `frontend/src/utils/` | Client-side dual-path sync engine (local backend first -> direct GitHub REST API fallback) | *Imported in Composables* |
| `process_all_quick_share.py` | `frontend/scripts/` | 4-layer defense filter, OCR brand extraction, semantic renaming, and direct Cloudinary upload | `python frontend/scripts/process_all_quick_share.py` |
| `fix_color_mismatches.py` | `frontend/scripts/` | Forensic colorway audit & desynchronization fixer across catalog databases | `python frontend/scripts/fix_color_mismatches.py` |
| `generate_catalog_card.py` | `frontend/scripts/` | 4-stage promotional card synthesizer (crop, bg removal, HD enhance, wave layout) | `python frontend/scripts/generate_catalog_card.py --help` |
| `cleanse_mismatched_images.py` | `frontend/scripts/` | Brand boundary verification, pseudo-model token purging, and image validation | `python frontend/scripts/cleanse_mismatched_images.py` |
