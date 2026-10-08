import json
import os

LEDGER_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "ledger-data.json")
OUT_PATHS = [
    os.path.join(os.path.dirname(__file__), "..", "public", "party_lines_a4.html"),
    os.path.join(os.path.dirname(__file__), "..", "..", "sbe-hub", "public", "party_lines_a4.html")
]

with open(LEDGER_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract by groupName
groups = {}
for item in data:
    gname = item.get("groupName", "").strip()
    ledgers = [l.get("ledgerName", "").strip() for l in item.get("ledgers", []) if l.get("ledgerName")]
    if gname:
        groups[gname] = ledgers

malkangiri_parties = sorted(groups.get("BALIMELA,CHITROKUNDA,MALKANGIRI", []))
koraput_parties = sorted(groups.get("KORAPUT LINE", []))
phulbani_parties = sorted(groups.get("PHULBAANI LINE", []))

print(f"Malkangiri parties: {len(malkangiri_parties)}")
print(f"Koraput parties: {len(koraput_parties)}")
print(f"Phulbani parties: {len(phulbani_parties)}")

def build_two_col_table_rows(parties, start_sno=1):
    n = len(parties)
    half = (n + 1) // 2
    left_col = parties[:half]
    right_col = parties[half:]
    
    rows_html = []
    for i in range(half):
        left_sno = start_sno + i
        left_name = left_col[i] if i < len(left_col) else ""
        
        right_sno = start_sno + half + i
        right_name = right_col[i] if i < len(right_col) else ""
        
        r_sno_cell = f'<td class="sno">{right_sno}</td>' if right_name else '<td class="sno empty"></td>'
        r_name_cell = f'<td class="name">{right_name}</td>' if right_name else '<td class="name empty"></td>'
        
        row = f'''        <tr>
          <td class="sno">{left_sno}</td>
          <td class="name" title="{left_name}">{left_name}</td>
          <td class="divider"></td>
          {r_sno_cell}
          {r_name_cell}
        </tr>'''
        rows_html.append(row)
    return "\n".join(rows_html)

malkangiri_rows = build_two_col_table_rows(malkangiri_parties)
koraput_rows = build_two_col_table_rows(koraput_parties)
phulbani_rows = build_two_col_table_rows(phulbani_parties)

html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SBE Party Directory - Malkangiri | Koraput | Phulbani</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 0;
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  body {{
    margin: 0;
    padding: 0;
    background-color: #e5e7eb;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #111827;
  }}
  
  /* Screen Presentation */
  @media screen {{
    body {{
      padding: 24px 0 60px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }}
    .print-bar {{
      position: sticky;
      top: 12px;
      z-index: 999;
      background: #1e293b;
      color: #fff;
      padding: 10px 24px;
      border-radius: 9999px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      font-weight: 500;
    }}
    .print-btn {{
      background: #f59e0b;
      color: #111827;
      border: none;
      padding: 6px 16px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }}
    .print-btn:hover {{
      background: #fbbf24;
      transform: translateY(-1px);
    }}
    .a4-page {{
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }}
  }}

  @media print {{
    body {{
      background: #ffffff;
      padding: 0;
    }}
    .print-bar {{
      display: none !important;
    }}
    .a4-page {{
      margin: 0 !important;
      box-shadow: none !important;
      page-break-after: always;
      page-break-inside: avoid;
    }}
  }}

  /* Strict A4 Page Dimensions */
  .a4-page {{
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    padding: 8mm 10mm 7mm 10mm;
    background: #ffffff;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }}

  /* Header Section */
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 3px;
    margin-bottom: 5px;
  }}
  .brand-title {{
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #0f172a;
    text-transform: uppercase;
  }}
  .brand-badge {{
    background: #0f172a;
    color: #f8fafc;
    font-size: 8.5px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .page-indicator {{
    font-size: 8.5px;
    font-weight: 700;
    color: #475569;
  }}

  /* Section Title Bar */
  .section-banner {{
    background: #f1f5f9;
    border-left: 3.5px solid #0284c7;
    padding: 3px 8px;
    margin-bottom: 4px;
    margin-top: 3px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .section-banner.malkangiri {{
    border-left-color: #0284c7;
  }}
  .section-banner.koraput {{
    border-left-color: #10b981;
  }}
  .section-banner.phulbani {{
    border-left-color: #f59e0b;
  }}
  .section-title {{
    font-size: 9.5px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }}
  .section-count {{
    font-size: 8px;
    font-weight: 700;
    color: #475569;
  }}

  /* Table Style - Ultra Compact 2 Column */
  .party-table {{
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }}
  .party-table th {{
    background: #0f172a;
    color: #f8fafc;
    font-size: 7.8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 2px 4px;
    text-align: left;
    border: none;
  }}
  .party-table th.sno-head {{
    width: 22px;
    text-align: center;
  }}
  .party-table th.div-head {{
    width: 6px;
    background: transparent;
    padding: 0;
  }}
  .party-table td {{
    padding: 1.6px 4px;
    font-size: 8px;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 0.5px solid #e2e8f0;
  }}
  .party-table tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}
  .party-table td.sno {{
    width: 22px;
    font-weight: 700;
    color: #64748b;
    text-align: center;
    font-size: 7.5px;
    border-right: 0.5px solid #cbd5e1;
    background-color: #f1f5f9;
  }}
  .party-table td.name {{
    color: #1e293b;
    font-weight: 600;
    padding-left: 5px;
  }}
  .party-table td.divider {{
    width: 6px;
    background: transparent;
    border: none;
    padding: 0;
  }}
  .party-table td.empty {{
    background: transparent !important;
    border-bottom: none;
  }}

  /* Footer */
  .footer {{
    border-top: 1px solid #cbd5e1;
    padding-top: 3px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5px;
    color: #64748b;
    font-weight: 500;
    margin-top: 3px;
  }}
</style>
</head>
<body>

<div class="print-bar">
  <span><strong>SBE Party Directory</strong> &bull; Malkangiri (90) &bull; Koraput (62) &bull; Phulbani (29) &bull; Total: 181 Parties</span>
  <button class="print-btn" onclick="window.print()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
    Print / Save PDF (A4)
  </button>
</div>

<!-- PAGE 1: MALKANGIRI LINE (90 PARTIES -> 2 COLS OF 45) -->
<div class="a4-page">
  <div>
    <div class="header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="brand-title">SHREE BALAJEE ENTERPRISES</span>
        <span class="brand-badge">Official Route Sheet</span>
      </div>
      <div class="page-indicator">PAGE 1 OF 2</div>
    </div>

    <div class="section-banner malkangiri">
      <span class="section-title">Line 1: Balimela, Chitrokunda, Malkangiri Line</span>
      <span class="section-count">Total Parties: {len(malkangiri_parties)} (Cols: 45 + 45)</span>
    </div>

    <table class="party-table">
      <thead>
        <tr>
          <th class="sno-head">#</th>
          <th>Party Name</th>
          <th class="div-head"></th>
          <th class="sno-head">#</th>
          <th>Party Name</th>
        </tr>
      </thead>
      <tbody>
{malkangiri_rows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>e-SBE Route Master Ledger &bull; Balimela, Chitrokunda, Malkangiri Line</span>
    <span>A4 Dimension Strictly (210mm x 297mm) &bull; Sheet 1 of 2</span>
  </div>
</div>

<!-- PAGE 2: KORAPUT LINE (62 PARTIES) + PHULBANI LINE (29 PARTIES) -->
<div class="a4-page">
  <div>
    <div class="header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="brand-title">SHREE BALAJEE ENTERPRISES</span>
        <span class="brand-badge">Official Route Sheet</span>
      </div>
      <div class="page-indicator">PAGE 2 OF 2</div>
    </div>

    <!-- KORAPUT LINE -->
    <div class="section-banner koraput" style="margin-top: 0;">
      <span class="section-title">Line 2: Koraput Line</span>
      <span class="section-count">Total Parties: {len(koraput_parties)} (Cols: 31 + 31)</span>
    </div>

    <table class="party-table">
      <thead>
        <tr>
          <th class="sno-head">#</th>
          <th>Party Name</th>
          <th class="div-head"></th>
          <th class="sno-head">#</th>
          <th>Party Name</th>
        </tr>
      </thead>
      <tbody>
{koraput_rows}
      </tbody>
    </table>

    <!-- PHULBANI LINE -->
    <div class="section-banner phulbani" style="margin-top: 6px;">
      <span class="section-title">Line 3: Phulbaani Line</span>
      <span class="section-count">Total Parties: {len(phulbani_parties)} (Cols: 15 + 14)</span>
    </div>

    <table class="party-table">
      <thead>
        <tr>
          <th class="sno-head">#</th>
          <th>Party Name</th>
          <th class="div-head"></th>
          <th class="sno-head">#</th>
          <th>Party Name</th>
        </tr>
      </thead>
      <tbody>
{phulbani_rows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>e-SBE Route Master Ledger &bull; Koraput Line &amp; Phulbaani Line</span>
    <span>A4 Dimension Strictly (210mm x 297mm) &bull; Sheet 2 of 2</span>
  </div>
</div>

</body>
</html>
'''

for path in OUT_PATHS:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Wrote A4 HTML to {path}")
