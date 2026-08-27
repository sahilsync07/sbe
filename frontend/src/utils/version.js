export const APP_VERSION = {
  code: 'sbe_013',
  version: '1.4.0',
  updatedAt: '27 Aug 2026, 04:10 PM',
  commitTitle: 'SBE Update #013: Dynamic Brand Stock Summary Report Cover Page for Photo Sharing & One Touch',
  changes: [
    {
      tag: 'sbe_013',
      date: '27 Aug 2026',
      title: 'Dynamic Brand Stock Summary Report Cover Page',
      details: 'Generates a high-impact dynamic summary report card as Page 1 for photo sharing and One Touch, detailing brand name, sync date, total designs, total stock pairs, min/max quantity spread, and wholesale pricing.'
    },
    {
      tag: 'sbe_012',
      date: '27 Aug 2026',
      title: 'Safe Area & Seamless Blended Sticky Header',
      details: 'Added safe area top padding for status bar/battery indicators and converted sticky SBE Hub header background to a seamless transparent gradient fade with zero rectangular borders or hard straps.'
    },
    {
      tag: 'sbe_011',
      date: '27 Aug 2026',
      title: 'Dual Scrolling Collapsing SBE Hub Header',
      details: 'Implemented dual scrolling on Home page: top bar (date, login, sync) scrolls away on scroll down, pinning the big SBE Hub title & last sync timestamp sticky at the top while all bento cards scroll smoothly beneath it.'
    },
    {
      tag: 'sbe_010',
      date: '27 Aug 2026',
      title: 'Reverted Home Page UI',
      details: 'Reverted Home Page layout, bento cards, and top bar to the original clean UI styling.'
    },
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
    }
  ]
};
