export const APP_VERSION = {
  code: 'sbe_025',
  version: '1.5.2',
  updatedAt: '03 Sep 2026, 10:18 PM',
  commitTitle: 'SBE Update #025: Workzones Password Gate, Crash Fixes & Seamless Login',
  changes: [
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
