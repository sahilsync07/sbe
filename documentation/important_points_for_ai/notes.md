# Authoritative AI Onboarding & Architecture Guide

> [!IMPORTANT]
> **MANDATORY READING FOR ALL AI ASSISTANTS & ENGINEERS**  
> This document is the single source of truth for working within the Sri Brundabana Enterprises (SBE) codebase. Read these rules carefully before editing or generating code.

---

## 1. Dual Application Architecture: `e-SBE` vs `e-SBE Hub`

The repository powers **two distinct applications** that share common business logic:

| Dimension | App 1: `e-SBE` (Client Catalog) | App 2: `e-SBE Hub` (Operations & Analytics) |
| :--- | :--- | :--- |
| **Directory** | `frontend/` | `sbe-hub/` |
| **Target User** | Retail store buyers, counter customers, field sales reps | Management, finance leads, warehouse supervisors |
| **History Mode** | Web History (`/`) on Web; Hash History on Android | **Hash History (`createWebHashHistory()`)** |
| **Capacitor ID** | `com.sbe.app` | `com.sbe.hub` |
| **Key Features** | Stock browsing, Triple Mode (Clean/All/Upload), One-Touch WhatsApp sharing (with natural aspect ratio & specs bottom extension bar), Cart & WhatsApp quotation | Party Tagger (Wholesaler/Retailer, Bad Debt 🔴, Settled 🟡, Aging Criticality), Sample Room, Debtors Analyzer (30/60/90+ days), Notification Broadcaster, Smart Sync |

### The Shared Codebase Resolver (`fallbackToFrontend()`)
- In `sbe-hub/vite.config.js`, a custom Vite plugin intercepts `@/` imports.
- It looks inside `sbe-hub/src/` first. If the file is not found, it **automatically falls back to `frontend/src/`**.
- **Crucial Rule:** All shared composables, utilities, and components belong in `frontend/src/`. Do **not** duplicate code into `sbe-hub/src/` unless creating an app-specific override.

---

## 2. The 8 AI Master Commandments

### Commandment 1: Android Build Base Path
- **Always** use `npm run build:android` when building web assets for Capacitor Android.
- **Never** use standard `npm run build` for Android: it sets `base: '/sbe/'` (for GitHub Pages), which results in a **blank white screen** on physical devices. `npm run build:android` sets `base: './'`.

### Commandment 2: Zero Naked Global CSS Selectors
- **Never** declare naked global element selectors like `button { ... }` or `input { ... }` in `frontend/src/style.css` or component root styles.
- These leak into mobile headers, icon buttons, and navigation bars, causing unwanted blue fills and rounded corners. Always use scoped styles or explicit class names.

### Commandment 3: Tally Sync In-Memory Metadata Lock
- In `backend/src/server.js`, `syncLedgerToFile()` **must preserve custom party metadata**.
- Raw Tally XML exports do not have `partyType`, `creditStatus`, `settlementStatus`, `settlementNote`, `settledAmount`, or `inSampleRoom`.
- When Tally sync runs, it reads existing `ledger-data.json`, extracts tags in memory, updates financial numbers, and merges the tags back before writing to disk. **Never alter this to blindly overwrite `ledger-data.json`**.

### Commandment 4: Multi-Repo Mirroring
- The workspace has a secondary mirror: `C:\Projects\sriyasync_github\sbe`.
- Commits and pushes to `c:\Projects\sbe` must always be mirrored to `C:\Projects\sriyasync_github\sbe` to maintain repository parity.

### Commandment 5: Batch Commit Staging Pattern
- Never commit single photo uploads, single party tags, or single sample room status changes directly to Git.
- Use the staging pattern (`usePartyTagger`, `useSampleRoomTagger`, `usePhotoUploader`):
  1. User makes edits (buffered in memory & `localStorage`).
  2. "Commit Preview (X)" button shows count.
  3. Review modal opens with before/after diffs.
  4. User clicks Commit -> single atomic batch Git commit.

### Commandment 6: Dual-Path Sync (`githubSync.js`)
- All write operations must use `syncDataDualPath()`.
- Tries local backend endpoint (2500ms timeout) first.
- If offline (remote manager or mobile device), commits directly to the GitHub repo via GitHub REST API with SHA retrieval and 409 conflict retries.

### Commandment 7: Canvas Image Aspect Ratio Preservation
- In One-Touch Mode and social card generators, footwear photos come in varying aspect ratios (often tall portrait).
- **Never squish or stretch images** vertically to fit fixed rectangles.
- Calculate proportional scaling: `scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)` and center/letterbox the photo with black bars.

### Commandment 8: Visual Authenticity & Zero AI Mockups
- Absolute purge of AI-designed clip art (shoe-prints, cartoon icons, gradient SVG mockups).
- Use **only authentic manufacturer brand logos** extracted directly from official physical catalogs or high-res vector scans (Paragon, Eeken, Action, Solea, Paralite, Comfy).

---

## 3. Storage Data Models

- **`stock-data.json`**:
  Contains articles, sizes, quantities, and image links (`imageUrl`, `secondaryImageUrl`). Meta block contains `_META_DATA_.lastSync` timestamp used by apps to detect updates.
- **`ledger-data.json`**:
  Tally ledgers and transactions, augmented with:
  - `partyType`: `'wholesaler'` | `'retailer'` | `null`
  - `creditStatus`: `'normal'` | `'bad_debt'` | `'doubtful'`
  - `settlementStatus`: `'unsettled'` | `'settled_not_accounted'`
  - `settlementNote`: string
  - `settledAmount`: number
- **`notifications.json`**:
  Array of broadcast notifications:
  `{ id, title, body, targetRoute, timestamp, priority, icon }`.

---

## 4. Engineering Journal Access

- **Web / Interactive Hub**: Accessible inside both apps via the route `/journal` (or `public/journal/index.html`).
- **Markdown Reference**: See [ENGINEERING_JOURNAL.md](../ENGINEERING_JOURNAL.md) for full commit-by-commit operational logs and script references.
