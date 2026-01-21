# Important Points for AI

## Style Issues
- **Global CSS Side Effects:** Be very careful with global element selectors in `style.css` (e.g., `button { ... }`). They bleed into *every* component, including those that should be transparent or custom-styled (like mobile navigation bars, icon-only buttons, etc.).
- **Mobile Navbar:** The mobile navigation bar in `PdfGenerator.vue` was accidentally inheriting a blue background and rounded corners from a global `button` style. The fix was to explicitly set `bg-transparent`, `rounded-none`, and `shadow-none` on the specific components, or better yet, avoid the global style.
- **User Preference:** The user prefers explicit styling over global rules that might mask intended designs. The global `button` style in `frontend/src/style.css` was deemed unnecessary and removed to prevent "masking" effects.

## Android Build Command
- **Building for Android:** Always use `npm run build:android` when building the APK/AAB. This command sets the correct base path (`./`) for Capacitor, whereas the standard `npm run build` sets the base path for GitHub Pages (`/sbe/`), which will cause a white screen on Android.
