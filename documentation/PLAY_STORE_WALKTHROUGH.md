# Google Play Store Publishing Walkthrough for SBE Stock

This guide provides a step-by-step walkthrough for publishing your `app-release.aab` file to the Google Play Store.

## Prerequisites
- **Google Play Console Account**: You must have a developer account (one-time $25 fee). [Sign up here](https://play.google.com/console).
- **Signed App Bundle**: The file we created at `c:\Projects\sbe\frontend\android\app\build\outputs\bundle\release\app-release.aab`.

---

## Phase 1: Create the App

1.  **Log in** to your [Google Play Console](https://play.google.com/console).
2.  Click **Create app** (top-right corner).
3.  **Fill in App Details**:
    *   **App Name**: `SBE Stock` (or your preferred name).
    *   **Default Language**: English (United States) [or your preference].
    *   **App or Game**: App.
    *   **Free or Paid**: Free.
4.  **Declarations**: Check the boxes for "Developer Program Policies" and "US Export Laws".
5.  Click **Create app**.

---

## Phase 2: App Setup (The Dashboard Tasks)

You will see a "Dashboard" with a list of tasks under "Set up your app". You must complete these in order.

### 1. Privacy Policy
*   **Action**: Provide a URL to your privacy policy.
*   *Tip*: If you don't have one, you can use a free generator like "App Privacy Policy Generator" or host a simple markdown file on GitHub Pages. You must have a URL.

### 2. App Access
*   **Question**: Does your app require login?
*   **Selection**: **All or some functionality is restricted**.
*   **Action**: Click "Add new instructions". Provide a test username/password (e.g., a dummy "Admin" account) so Google reviewers can log in and check the "Admin" features if necessary.
    *   *Name*: Test Admin
    *   *Username/Email*: (Provide a valid login for your app)
    *   *Password*: (Provide the password)
    *   *Instructions*: "Login to access the catalog generation features."

### 3. Ads
*   **Selection**: **No, my app does not contain ads** (unless you added AdMob, but based on our code, you haven't).

### 4. Content Rating
*   Click **Start Questionnaire**.
*   **Category**: "Utility, Productivity, Communication, or other".
*   **Questions**: Answer honestly (usually "No" to violence, sexuality, offensive language, etc.).
*   **Result**: It should give you a rating (likely "Everyone" or "Teen"). Click **Save**.

### 5. Target Audience
*   **Selection**: **18 and over**. (Selecting children requires stricter policies).
*   **Appeal to Children**: "No".

### 6. News App
*   **Selection**: **No**.

### 7. COVID-19 Contact Tracing
*   **Selection**: **My app is not a publicly available COVID-19 contact tracing or status app**.

### 8. Data Safety (Crucial)
*   **Selection**: You need to declare what data you collect.
*   **Does your app collect/share data?**: Yes (if you use Firebase/Supabase/Cloudinary).
*   **Is data encrypted in transit?**: Yes (HTTPS).
*   **Can users request deletion?**: Yes/No (depend on your policy).
*   **Data Types**:
    *   *Photos/Videos*: Yes (Products have images).
    *   *Files/Docs*: Yes (PDFs generation).
    *   *App Activity*: Yes (Page views, tap actions if analytics are present).
    *   *Crash Logs*: Yes (if Play Services collects them).

### 9. Government Apps
*   **Selection**: **No**.

### 10. Financial Features
*   **Selection**: **My app doesn't provide any financial features**.

---

## Phase 3: Store Listing (Marketing)

Go to **Store presence** > **Main store listing**.

1.  **App Name**: `SBE Stock`
2.  **Short Description**: (Max 80 chars) e.g., "Manage stock, view brands, and generate fast PDF catalogs."
3.  **Full Description**: Detailed explanation of features (Brands, PDF Export, Image sharing, etc.).
4.  **Graphics**:
    *   **App Icon**: 512x512 px PNG (Up to 1MB).
    *   **Feature Graphic**: 1024x500 px JPEG/PNG.
    *   **Phone Screenshots**: Upload 2-8 screenshots (16:9 or 9:16 aspect ratio recommended).
    *   *Tip*: Take screenshots from the emulator or your testing device.

---

## Phase 4: Release to Production (Publishing)

1.  In the left menu, go to **Release** > **Production**.
2.  Click **Create new release** (top right).
3.  **App Integrity**: click "Choose signing key" -> "Use Google-generated key". (This means Google manages the key for you, which is safer. The key we generated is the "Upload Key").
4.  **App Bundles**:
    *   Drag and drop the file: `c:\Projects\sbe\frontend\android\app\build\outputs\bundle\release\app-release.aab`.
    *   Wait for it to process. It should show specific details (Target SDK 36, Version 1).
5.  **Release Name**: It will auto-fill (e.g., "1.0").
6.  **Release Notes**: Enter a note for users, e.g., "Initial release with PDF Catalog generation and WhatsApp sharing."
7.  Click **Next**.
8.  **Review**: You might see warnings (usually minor). If no errors (red), click **Save**.
9.  **Rollout**: Click **Start rollout to Production**.

## What Happens Next?
*   Your app status will change to **"In Review"**.
*   Google review takes **1-5 days** (sometimes longer for new accounts).
*   Once approved, it will be live on the Play Store!

---

## Important File Locations (Keep Safely!)
*   **Keystore**: `c:\Projects\sbe\frontend\android\app\release-key.keystore`
*   **Key Alias**: `sbe_alias`
*   **Password**: `password` (as set during our build)

**WARNING**: **NEVER lose the `release-key.keystore` file**. Backup it to a secure cloud location (Google Drive/Dropbox). If you lose it, you cannot update this app ever again.
