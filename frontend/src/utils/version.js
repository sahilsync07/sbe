export const APP_VERSION = {
  code: 'sbe_018',
  version: '1.4.5',
  updatedAt: '27 Aug 2026, 07:35 PM',
  commitTitle: 'SBE Update #018: Dynamic Non-Zero Aging Buckets, Bill-Wise Aging Table & Enhanced PDF Readability',
  changes: [
    {
      tag: 'sbe_018',
      date: '27 Aug 2026',
      title: 'Dynamic Non-Zero Aging & Enhanced PDF Readability',
      details: 'Enhanced the PDF aging annexure to dynamically display only active non-zero aging buckets (omitting zero-balance categories), added crystal-clear bill-wise aging breakdown (bill number, date, amount, overdue days, aging bucket), and increased typography font sizes for effortless readability.'
    },
    {
      tag: 'sbe_017',
      date: '27 Aug 2026',
      title: 'Executive Aging Analysis & Partnership Annexure in PDF',
      details: 'Added a dedicated final summary page to the Ledger Statement PDF featuring account metrics, 5-bucket aging breakdown, full pending bill breakdown table, and an encouraging partnership & business growth letter from Sri Brundabana Enterprises, Rayagada.'
    },
    {
      tag: 'sbe_016',
      date: '27 Aug 2026',
      title: 'Removed White Header Background Overlay',
      details: 'Completely removed the pale/white gradient background overlay and backdrop filter from SBE Hub hero header, allowing the natural warm ambient background to flow 100% seamlessly without any visible strips or bands.'
    },
    {
      tag: 'sbe_015',
      date: '27 Aug 2026',
      title: 'WhatsApp 1024-Char Caption Limit Protection',
      details: 'Formatted pending bills into high-impact single lines with intelligent safety bounds to ensure WhatsApp never trims document captions, highlighting critical overdue bills first.'
    }
  ]
};
