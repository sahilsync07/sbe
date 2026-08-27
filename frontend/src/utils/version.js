export const APP_VERSION = {
  code: 'sbe_020',
  version: '1.4.7',
  updatedAt: '27 Aug 2026, 10:20 PM',
  commitTitle: 'SBE Update #020: 100% Transparent Hero Header (Removed Background Gradient Overlay Strip)',
  changes: [
    {
      tag: 'sbe_020',
      date: '27 Aug 2026',
      title: 'Complete Removal of Header Gradient Overlay Strip',
      details: 'Completely set .hub-hero background to 100% transparent and removed all linear-gradient overlays, backdrop filters, and negative margins, restoring the pure ambient background across the entire Home screen.'
    },
    {
      tag: 'sbe_019',
      date: '27 Aug 2026',
      title: 'Customer-Centric Account & Invoice Summary Layout',
      details: 'Completely redesigned the PDF annexure with customer-centric, respectful business language (replacing aging/critical/overdue with Statement of Account, Invoice Age, and Tenure), resolved rupee character and emoji rendering glitches, fixed text overlaps, and polished layout.'
    },
    {
      tag: 'sbe_018',
      date: '27 Aug 2026',
      title: 'Dynamic Non-Zero Aging & Enhanced PDF Readability',
      details: 'Enhanced the PDF aging annexure to dynamically display only active non-zero aging buckets (omitting zero-balance categories), added crystal-clear bill-wise aging breakdown, and increased typography font sizes for effortless readability.'
    }
  ]
};
