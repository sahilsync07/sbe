# Fast Surgical Execution Protocol for AI Assistants (SBE Workspace)

> [!IMPORTANT]
> **READ BEFORE EXECUTING ANY TASK IN THIS REPOSITORY**  
> This file is loaded automatically into your system context. Follow this protocol strictly to minimize latency, eliminate unnecessary token waste, and prevent "exploration paralysis".

---

## 1. The Core Philosophy: Surgical Direct Action

1. **Target Directly — Do NOT Speculate or Browse:**
   - When the user asks for a specific change (e.g., "revert logo in HomeView", "change color of button in BrandLanding", "tweak padding in CartSidebar"), **DO NOT** search the directory with `dir`, `git grep`, or python scripts.
   - Jump directly to the known file using the [Component Quick Map](#3-component--feature-quick-map).
2. **The 3-Tool Rule for Local Modifications:**
   - **Step 1:** `view_file` (with precise `StartLine` and `EndLine`, max 40-50 lines).
   - **Step 2:** `replace_file_content` (make the surgical edit).
   - **Step 3:** `run_command` (commit and push to Git).
   - Never exceed 3-4 tool calls for straightforward UI, styling, or bugfix requests.
3. **Stop Exploratory Git & Transcript Audits:**
   - Do NOT run `git log -n 50`, grep transcripts, or read historical commit diffs unless the user explicitly asks: *"what changed in commit X"* or *"audit the git history"*.
   - Do NOT inspect image pixel dimensions or run OCR on local images unless specifically asked to analyze or crop an asset.
4. **Conditional Verification (Zero Build Bloat):**
   - **DO NOT** run `npm run build` or spawn background build tasks for:
     - HTML/Vue template edits (text, icon classes, attributes).
     - CSS/Tailwind class tweaks.
     - Image path or asset link adjustments.
   - **ONLY** run `npm run build` when:
     - Modifying `package.json` dependencies.
     - Changing `vite.config.js` or bundler configurations.
     - Refactoring complex multi-file TypeScript/ESM export graphs.

---

## 2. Multi-Repo Parity Rule (Commandment 4)

- The workspace has a secondary mirror at `C:\Projects\sriyasync_github\sbe`.
- Every commit pushed to `c:\Projects\sbe` must be pulled into the mirror:
  ```bash
  git -C "C:\Projects\sriyasync_github\sbe" pull origin main
  ```
- Always ensure both repositories share the exact same HEAD commit.

---

## 3. Component & Feature Quick Map (Instant File Lookup)

Never search for files. Use this index:

| Feature / UI Screen | Primary File | Description |
| :--- | :--- | :--- |
| **e-SBE Main Storefront Header** | `frontend/src/components/StockTable/BrandLanding.vue` | Top bar, logo, Clean/All/Upload toggle, brand tabs |
| **e-SBE Mobile Header** | `frontend/src/components/Header.vue` | Mobile navigation, logo, cart button, sync trigger |
| **e-SBE Core Stock Table** | `frontend/src/components/StockTable.vue` | Root catalog wrapper, image modals, order modals |
| **e-SBE Cart Drawer** | `frontend/src/components/StockTable/CartSidebar.vue` | Slide-out cart, carton incrementer, WhatsApp send |
| **e-SBE Hub Dashboard** | `frontend/src/views/HomeView.vue` | Main dashboard grid, Smart Sync button, KPI cards |
| **e-SBE Hub Router** | `sbe-hub/src/router.js` | Hash-based routes for all Hub views |
| **e-SBE Hub HTML Shell** | `sbe-hub/index.html` | Favicon (`/assets/logo.png`), page title (`SBE Hub`) |
| **e-SBE Client HTML Shell** | `frontend/index.html` | Favicon (`pwa-192x192.png`), title (`e-SBE`) |
| **One-Touch WhatsApp Photo Gen** | `frontend/src/components/PdfGenerator.vue` | HTML5 Canvas photo compositor, black specs bar |
| **Brand Summary First Page** | `frontend/src/utils/generateBrandSummaryImage.js` | White-gold royal cover page synthesis |
| **Party Tagger View & Store** | `frontend/src/views/PartyTaggerView.vue`<br>`frontend/src/composables/usePartyTagger.js` | Wholesaler/Retailer, Bad Debt, Settled tags, Criticality |
| **Sample Room View & Store** | `frontend/src/views/SampleRoomView.vue`<br>`frontend/src/composables/useSampleRoomTagger.js` | Physical sample tracking, staged batch commits |
| **Push Notification Broadcaster** | `frontend/src/views/NotificationSenderView.vue`<br>`frontend/src/utils/notifications.js` | Push notification composer, Capacitor local alerts |
| **Aging Debtors Analyzer** | `frontend/src/views/AnalyzerView.vue`<br>`frontend/src/composables/useAnalyzerData.js` | 30/60/90+ day aging breakdown, risk calculations |
| **Backend & Tally Sync Server** | `backend/src/server.js` | Express server, XML ODBC port 9000, metadata lock |
| **Dual-Path Sync Utility** | `frontend/src/utils/githubSync.js` | Local backend first -> direct GitHub REST API fallback |
| **Engineering Journal Webpage** | `frontend/public/journal/index.html`<br>`sbe-hub/public/journal/index.html` | Architectural ledger & AI guide |

---

## 4. Brand Asset Standards

- **`e-SBE` (Client Catalog App):**
  - Brand Logo: `frontend/public/assets/logos/e-sbe-new-logo.png` (512×133 horizontal gold/black wordmark).
  - Always render with unconstrained natural aspect ratio: `class="h-8 sm:h-10 w-auto max-w-[140px] object-contain"`. Never constrain to a square `w-8 h-8` box!
  - App Icon: `frontend/public/assets/logos/e-sbe-square-logo.png` & `pwa-192x192.png`.
- **`SBE Hub` (Operations App):**
  - Brand Logo & Favicon: `sbe-hub/public/assets/logo.png` (the authentic blue sneaker icon on square gradient).
  - Title: `SBE Hub`. Never replace with e-SBE wordmark!

---

## 5. Typical Execution Workflow

```
User: "Change X in Y component"
  ↓
1. Lookup file path in Section 3 table (NO file searching!)
  ↓
2. Call view_file(TargetFile, StartLine, EndLine) (view only ~30 lines)
  ↓
3. Call replace_file_content(...) (apply surgical change)
  ↓
4. Call run_command("git add <file> && git commit -m ... && git push origin main")
  ↓
5. Call run_command("git -C C:\\Projects\\sriyasync_github\\sbe pull origin main")
  ↓
6. Output 3-line concise summary to user. DONE!
```
