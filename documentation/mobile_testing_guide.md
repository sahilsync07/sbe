# Testing on Android Emulator

Since you have **Android Studio** installed, you can run the application on a simulated Android device to get the full mobile experience (including plugins like filesystem and sharing).

## Prerequisites
- Android Studio with an **Android Virtual Device (AVD)** created.
- Dependencies installed in the `frontend` folder.

## Steps to Run

1.  **Open Terminal** and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  **Build the Web Assets**:
    Compiles your Vue code into the `dist` folder.
    ```bash
    npm run build:android
    ```
    *(Or simply `npm run build` is usually sufficient, but `build:android` ensures the correct mode if configured)*

3.  **Sync with Capacitor**:
    Copies the `dist` folder to the Android native project.
    ```bash
    npx cap sync android
    ```

4.  **Open in Android Studio**:
    This command launches Android Studio with the correct project context.
    ```bash
    npx cap open android
    ```

5.  **Run on Emulator**:
    - Inside Android Studio, wait for the **Gradle Sync** to finish (watch the bottom status bar).
    - In the top toolbar, select your **Virtual Device** (e.g., "Pixel 5 API 33").
    - Click the **Run** button (Green Play Icon ▶️).

The emulator will launch, and your app will open automatically.

## Quick Tips
- **Re-testing Changes**: If you change your Vue code, you must repeat **Step 2 (Build)** and **Step 3 (Sync)**, then click **Run** (or "Apply Changes") in Android Studio again.
- **Chrome DevTools**: For quick UI/CSS testing without the full emulator, use Chrome/Edge on your PC, press `F12`, and toggle the **Device Toolbar** (`Ctrl+Shift+M`).
