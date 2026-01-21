# SBE Frontend Architecture

## Overview
The Stock Backend/Frontend (SBE) application has been refactored to use a unified, component-based architecture for both Web and Android (Capacitor) deployments.

## Directory Structure
```
src/
├── components/          # Shared Vue Components
│   ├── StockTable.vue   # Main Application Entry Component
│   ├── StockTable/      # Sub-components for StockTable
│   │   ├── DesktopToolbar.vue
│   │   ├── BrandsSidebar.vue
│   │   ├── CartSidebar.vue
│   │   ├── ImageModal.vue (Lazy Loaded)
│   │   └── OrderModal.vue (Lazy Loaded)
│   ├── ProductCard.vue  # Reusable Product Card
│   └── ...
├── composables/         # Shared Composition API Logic
│   ├── useStockData.js  # Data fetching & state
│   ├── useCart.js       # Cart management
│   ├── useProductFilter.js # Search & Filtering
│   ├── useBrandGroups.js # Sidebar Categorization
│   └── ...
├── utils/               # Helper functions
└── android/             # Android-specific entry & config
    ├── router.js        # Maps routes to shared components
    └── App.vue          # Minimal shell for Android
```

## Refactoring Highlights
- **StockTable.vue**: The massive monolithic component was split into modular sub-components and composables.
- **Unified Logic**: Both Web and Android now use the same `StockTable.vue`, ensuring feature parity and reducing maintenance.
- **Performance**: Heavy modals (Image, Order) are now lazy-loaded.
- **Clean Android Layer**: The `src/android` folder serves largely as a configuration wrapper, delegating UI rendering to shared components.

## Testing
- Unit tests for composables and components are located in `tests/`.
- Run tests with `npm test`.

## Android Build
- Run `npm run build:android` to generate the web assets for Capacitor.
