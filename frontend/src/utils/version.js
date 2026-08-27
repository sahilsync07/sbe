export const APP_VERSION = {
  code: 'sbe_021',
  version: '1.4.8',
  updatedAt: '27 Aug 2026, 11:45 PM',
  commitTitle: 'SBE Update #021: Imaginary Line Dissolve Mask (Cards Fade Out Cleanly Below SBE Hub Header on Scroll)',
  changes: [
    {
      tag: 'sbe_021',
      date: '27 Aug 2026',
      title: 'Imaginary Line Dissolve Mask for Scrolling Cards',
      details: 'Isolated the SBE Hub top header in a fixed transparent zone and added a dynamic CSS mask on the scrolling cards container so cards smoothly dissolve and disappear at the imaginary boundary line right below the header without ever passing under or overlapping the title text.'
    },
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
    }
  ]
};
