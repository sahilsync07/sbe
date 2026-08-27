export const APP_VERSION = {
  code: 'sbe_008',
  version: '1.3.0',
  updatedAt: '27 Aug 2026, 11:35 AM',
  commitTitle: 'SBE Update #008: Zomato-Inspired Order Maker UI with Story Avatars & Dish Cards',
  changes: [
    {
      tag: 'sbe_008',
      date: '27 Aug 2026',
      title: 'Zomato-Inspired Order Maker UI',
      details: 'Redesigned Order Maker with Zomato design language: location header, search & photo mode toggle, circular story avatars, filter chips, restaurant-style product cards with stock badges, and floating bottom action dock.'
    },
    {
      tag: 'sbe_007',
      date: '27 Aug 2026',
      title: 'WhatsApp Follow-up PDF Attachment & Clean Text Copy',
      details: 'Fixed Follow Up button to share/attach 6-month ledger PDF file, copy clean text message to clipboard without "Ji", and handle zero/nil balance scenarios gracefully.'
    },
    {
      tag: 'sbe_006',
      date: '27 Aug 2026',
      title: 'Sync Timestamp Extraction & Cache Persistence',
      details: 'Extracted live metadata timestamp directly from the first lines of stock-data.json, ensured cache persistence across all storage tiers, and added relative time display (e.g. 19 hrs ago).'
    },
    {
      tag: 'sbe_005',
      date: '27 Aug 2026',
      title: 'Full-Screen One Touch Share Mode & 2-Column Pill Toggles',
      details: 'Transformed One Touch Mode into a dedicated full-screen interface with 2-column pill switches for Low Stock, With Photos, Min Qty Filter, and Select All Groups (Default ON).'
    },
    {
      tag: 'sbe_004',
      date: '27 Aug 2026',
      title: '6-Month Ledger PDF Generator Fix',
      details: 'Fixed ledger payload argument structure in Line Debtors Analyzer for instant 6-month PDF statement generation, downloading, and native WhatsApp sharing.'
    },
    {
      tag: 'sbe_003',
      date: '27 Aug 2026',
      title: 'Line Debtors Analyzer + 180+d Aging + 1-Screen Order Maker',
      details: 'Restricted Analyzer strictly to Line Debtors (including Rayagada Local), added 90-180d & 180+d aging categories, single-screen responsive Order Maker with zero scroll, seamless gradient blending on home page, and polite Sri Brundabana Enterprises WhatsApp reminders.'
    },
    {
      tag: 'sbe_002',
      date: '27 Aug 2026',
      title: 'Discrete Aging Buckets & Toast Auto-Dismiss',
      details: 'Fixed toast dismiss animation freeze and made party aging buckets mutually exclusive with zero duplicate repetition.'
    },
    {
      tag: 'sbe_001',
      date: '26 Aug 2026',
      title: 'Rapid Order Maker & Analyzer Menu',
      details: 'Launched rapid Order Maker with bubble filmstrip, One-Touch WhatsApp order sharing, and Debtors/Creditors Analyzer.'
    }
  ]
};
