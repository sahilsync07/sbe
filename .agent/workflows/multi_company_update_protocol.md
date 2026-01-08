---
description: Protocol for updating multiple company repositories from a single source
---

# Multi-Company Update Protocol

You have 3 separate repositories (Companies) that share the same code logic but have different branding/data. Now that the code is **Modular**, you can follow this protocol to update them easily.

## 1. The Strategy: "Master & Clones"

Treat your **SBE** repository as the **"Master Template"**.
- All **Code Changes** (features, bug fixes) happen in `SBE`.
- The other 2 repositories are **"Consumers"** that strictly pull code updates.
- **Unique Data** lives in separate config files, so it never gets overwritten by code updates.

---

## 2. One-Time Setup (Do this once for each other company)

Before you can sync smoothly, you need to set up the configuration files in the other repositories.

**For "Company B" (Example):**
1.  **Create Config File**:
    - Go to `frontend/public/config/`.
    - Create a file named `company-b.json` (copy `sbe.json` as a starting point).
    - Edit `company-b.json` to change the `companyName`, `brands`, `logos`, and `tallyGroups`.
2.  **Update Environment**:
    - Open `frontend/.env`.
    - Change `VITE_CONFIG_FILE` to `company-b.json`.
    - Change `VITE_CLOUDINARY_CLOUD_NAME` and `PRESET` to Company B's values.
3.  **Secure your Config**:
    - Ensure `.env` is added to your `.gitignore` file so unique keys aren't overwritten if you merge files blindly (though with the Protocol below, we handle this).

---

## 3. Routine Update Protocol

When you have made a code improvement in **SBE** (e.g., fixed a bug in `StockTable.vue`), follow one of these two methods to update the others.

### Method A: The Git "Upstream" Way (Recommended, Professional)
*Best if you are comfortable with Git.*

1.  **In your Company B and Company C folders**, run this command once to link them to SBE:
    ```bash
    git remote add upstream https://github.com/sahilsync07/sbe.git
    ```
2.  **To Update:**
    - Open Company B/C folder.
    - Run: `git pull upstream main`
    - Should conflicts arise? **Rarely**, because:
        - Logic is in `src/` (which you want to overwrite).
        - Config is in `sbe.json` (which Company B doesn't use).
        - Company B uses `company-b.json` (which SBE doesn't touch).
    - **CAUTION**: If `.env` is tracked in git, you might get a conflict. **Recommended**: Add `.env` to `.gitignore`.

### Method B: The "Safe Copy-Paste" Way (Simple, Foolproof)
*Best if you prefer manual control.*

Since the code is modular, you can safely copy the core folders.

1.  **Copy Source Code**:
    - Copy the **entire** `frontend/src` folder from SBE.
    - Paste and **Overwrite** the `frontend/src` folder in Company B/C.
2.  **Copy Backend Logic**:
    - Copy `backend/src/server.js`.
    - Paste and **Overwrite** in Company B/C.
3.  **Dependencies**:
    - If you added new libraries (like `dotenv`), copy `package.json` (be careful not to overwrite project name if that matters to you, otherwise just merge the `dependencies` section).

**What NOT to Copy (The "Unique" Parts):**
- ❌ **DO NOT COPY** `frontend/.env` (Contains Company keys).
- ❌ **DO NOT COPY** `frontend/public/config/*.json` (Unless you added a new setting structure to `sbe.json` that you need to manually apply to `company-b.json`).

---

## Summary Checklist
- [ ] Code changed in **SBE**?
- [ ] Copy `frontend/src` -> Others.
- [ ] Copy `backend/src` -> Others.
- [ ] Test Others (Verify they still load *their* Config).
- [ ] Deploy!
