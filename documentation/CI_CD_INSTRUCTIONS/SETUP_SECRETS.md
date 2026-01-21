# CI/CD Setup Instructions

To enable automatic updates to the Play Store, you need to add "Secrets" to your GitHub repository.

## 1. Get the Service Account JSON (Google Play Console)
1.  Go to **Google Cloud Console** (associated with your Play Console account).
2.  Go to **IAM & Admin > Service Accounts**.
3.  Create a new Service Account (e.g., `github-ci`).
4.  Grant it the **"Service Account User"** role.
5.  Click the newly created account -> **Keys** tab -> **Add Key** -> **Create new key** -> **JSON**.
6.  Save this file.
7.  Go to **Google Play Console** -> **Users and Permissions** -> **Invite New Users**.
8.  Invite the email address of the service account you just created.
9.  Grant it **"Admin"** (or at least "Release" permissions) for your app.

## 2. Encode Your Keystore
You need to convert your `release-key.keystore` file into a text string (Base64) to store it in GitHub.
**Run this command in your computer's terminal (Git Bash or PowerShell):**
```bash
base64 -w 0 frontend/android/app/release-key.keystore > keystore_base64.txt
```
(Copy the contents of `keystore_base64.txt`)

## 3. Add Secrets to GitHub
1.  Go to your GitHub Repo -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Click **New repository secret** and add the following:

| Name | Value |
| :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | The long text string you copied from `keystore_base64.txt`. |
| `SERVICE_ACCOUNT_JSON` | Open your JSON file from Step 1, copy the **entire content**, and paste it here. |

## 4. Automatic Updates
*   Every time you push to the `main` branch, GitHub will:
    1.  Build your app.
    2.  **Automatically increment the Version Code** (so Play Store accepts it).
    3.  Upload the new release to the "Production" track on Play Store.

## Note on First Run
Since you haven't uploaded the first version manually via the console yet (or just did), make sure the `packageName` in `android-release.yml` matches exactly (`com.sbe.stock.app`).
