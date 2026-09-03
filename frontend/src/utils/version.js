export const APP_VERSION = {
  code: 'sbe_029',
  version: '1.5.6',
  updatedAt: '03 Sep 2026, 10:56 PM',
  commitTitle: 'SBE Update #029: Dynamic Active Columns Month-Based Aging Table for Debtors & Creditors',
  changes: [
    {
      tag: 'sbe_029',
      date: '03 Sep 2026',
      title: 'Dynamic Month-Based Aging in Debtors & Creditors',
      details: 'Upgraded aging tenure to Month brackets (<1M, 2M, 3M, 3-6M, 6-9M, 1Y+). Applied dynamic 2-row rounded table to BOTH Debtors and Creditors that ONLY shows active columns with balance > 0, eliminating empty columns completely.'
    },
    {
      tag: 'sbe_028',
      date: '03 Sep 2026',
      title: 'Aesthetic 2-Row Rounded Aging Table',
      details: 'Replaced multi-colored progress bar with a high-contrast, rounded 2-row table (Headers + Tinted Value Cells).'
    },
    {
      tag: 'sbe_027',
      date: '03 Sep 2026',
      title: 'Consolidated Multi-Branch Paragon Creditor',
      details: 'Clubbed all 9 Paragon state branch accounts (Bangalore, Kerala, Central, Medak, Tamil Nadu, Haryana, Delhi, WB, Hyderabad) into 1 Master Consolidated Creditor (Rs. 87.85L net payable).'
    },
    {
      tag: 'sbe_026',
      date: '03 Sep 2026',
      title: 'Mobile-Optimized Executive Creditor Dashboard',
      details: 'Built an executive landing spotlight featuring 90+ Days Overdue (Urgent) and 31-90 Days Due cards with live sums and counts. Default sorted by Overdue & Priority first. Tailored for phone view with smooth horizontal scrolling and touch-friendly actions.'
    },
    {
      tag: 'sbe_025',
      date: '03 Sep 2026',
      title: 'Hidden Workzones Password Gate & Crash Fixes',
      details: 'Workzone cards remain hidden until unlocked with sahil123 or slnp123. Fixed formatINR undefined error in Creditor Analytics, fixed nested PWA icon path, unified login flow to route directly with zero double-asking.'
    },
    {
      tag: 'sbe_024',
      date: '02 Sep 2026',
      title: 'Sahil & SLNP Workzones with Creditor Analytics',
      details: 'Built dedicated password-protected executive workspaces for Sahil (sahil123) and SLNP (slnp123) on SBE Hub. Features full Creditor Analytics (5-bucket supplier payables aging: 0-30d, 31-60d, 61-90d, 90-180d, 180+d, Party View, Group View, bill-wise pending purchases, search, sorting, and WhatsApp statement sharing).'
    },
    {
      tag: 'sbe_023',
      date: '28 Aug 2026',
      title: 'Verified 22 Cloudinary URLs (16 Paragon Core + 6 Hawai)',
      details: 'Fetched exact Cloudinary resource URLs with security hashes via Admin API for all 16 Paragon Core articles and 6 Hawai/Walkaholic articles.'
    }
  ]
};
