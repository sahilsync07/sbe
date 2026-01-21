# Android App Version

This directory contains the Android-specific version of the SBE Stock application. The code here has been optimized for mobile devices and includes features specific to the Android platform.

## Structure

```
android/
├── App.vue                 # Android main app component
├── router.js              # Android routing configuration  
├── store.js               # Android state management
└── components/
    ├── Header.vue         # Android header with mobile optimizations
    ├── ProductCard.vue    # Product cards with +/- quantity controls
    ├── StockTable.vue     # Main stock view with mobile UI
    ├── PdfGenerator.vue   # PDF generation with mobile layout
    └── BottomNavigation.vue # Mobile bottom navigation
```

## Key Features

### Android-Specific Enhancements
1. **Bottom Navigation** - Fixed bottom navigation bar for easy access
2. **Product Quantity Controls** - In-card +/- buttons for quick cart management
3. **History API Integration** - Proper back button handling for overlays
4. **Header Visibility Logic** - Smart header hiding for more screen space
5. **Mobile-First Layout** - Optimized for small screens

### Platform Detection
The app automatically loads this version when running on Android devices via Capacitor. See `src/main.js` for implementation.

## Development

When making changes to the Android version:
1. **Only modify files in this directory**
2. **Do not touch web version files** in `src/components/`
3. **Test on Capacitor** before committing

## Build for Android

```bash
npm run build
npx cap sync android
npx cap open android
```

## Important Notes
- This version shares the same backend API with the web version
- Configuration files (config/) are shared between versions
- Assets (images, fonts) are shared via the public folder
