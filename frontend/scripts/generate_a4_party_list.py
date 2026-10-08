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

def build_two_col_table_rows(parties, group_id, start_sno=1):
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
        r_name_cell = f'<td class="name" data-name="{right_name.lower()}">{right_name}</td>' if right_name else '<td class="name empty"></td>'
        
        row = f'''        <tr class="party-tr" data-group="{group_id}">
          <td class="sno">{left_sno}</td>
          <td class="name" data-name="{left_name.lower()}">{left_name}</td>
          <td class="divider"></td>
          {r_sno_cell}
          {r_name_cell}
        </tr>'''
        rows_html.append(row)
    return "\n".join(rows_html)

malkangiri_rows = build_two_col_table_rows(malkangiri_parties, "malkangiri")
koraput_rows = build_two_col_table_rows(koraput_parties, "koraput")
phulbani_rows = build_two_col_table_rows(phulbani_parties, "phulbani")

total_parties = len(malkangiri_parties) + len(koraput_parties) + len(phulbani_parties)

html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SBE Party Directory - Malkangiri | Koraput | Phulbani</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 8mm 10mm;
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  body {{
    margin: 0;
    padding: 0;
    background-color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }}

  /* Top Action & Search Bar (Sticky for Screen View) */
  .control-bar {{
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #0f172a;
    color: #ffffff;
    padding: 10px 20px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }}
  .control-left {{
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }}
  .brand-badge-pill {{
    background: #f59e0b;
    color: #0f172a;
    font-weight: 800;
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 9999px;
    letter-spacing: 0.5px;
  }}
  .control-title {{
    font-size: 13px;
    font-weight: 600;
    color: #f8fafc;
  }}
  .quick-links {{
    display: flex;
    gap: 6px;
    align-items: center;
  }}
  .quick-link-btn {{
    background: #1e293b;
    color: #cbd5e1;
    text-decoration: none;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #334155;
    transition: all 0.15s ease;
  }}
  .quick-link-btn:hover {{
    background: #334155;
    color: #ffffff;
  }}
  .control-right {{
    display: flex;
    align-items: center;
    gap: 10px;
  }}
  .search-input {{
    background: #1e293b;
    border: 1px solid #334155;
    color: #ffffff;
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 6px;
    outline: none;
    width: 180px;
  }}
  .search-input::placeholder {{
    color: #94a3b8;
  }}
  .search-input:focus {{
    border-color: #f59e0b;
  }}
  .print-btn {{
    background: #f59e0b;
    color: #0f172a;
    border: none;
    padding: 6px 16px;
    border-radius: 6px;
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

  /* Continuous Document Layout */
  .doc-wrapper {{
    max-width: 210mm;
    margin: 20px auto 40px auto;
    background: #ffffff;
    padding: 10mm 12mm 12mm 12mm;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    border-radius: 2px;
  }}

  /* Main Header */
  .main-header {{
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }}
  .brand-h1 {{
    margin: 0;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.5px;
    color: #0f172a;
    text-transform: uppercase;
  }}
  .brand-sub {{
    margin-top: 2px;
    font-size: 9.5px;
    color: #475569;
    font-weight: 600;
    letter-spacing: 0.3px;
  }}
  .header-meta {{
    text-align: right;
    font-size: 9px;
    color: #64748b;
    font-weight: 600;
  }}
  .header-meta strong {{
    color: #0f172a;
  }}

  /* Section Banner - NO PAGE BREAKS */
  .section-container {{
    margin-bottom: 12px;
    /* Do NOT break page after group */
    page-break-after: auto;
    break-after: auto;
  }}
  .section-banner {{
    background: #f8fafc;
    border-left: 4px solid #0284c7;
    border-top: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    padding: 4px 10px;
    margin-top: 10px;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    page-break-after: avoid;
    break-after: avoid;
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
    font-size: 10.5px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }}
  .section-count {{
    font-size: 9px;
    font-weight: 700;
    color: #475569;
  }}

  /* Two Column Table */
  .party-table {{
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 4px;
  }}
  .party-table th {{
    background: #0f172a;
    color: #f8fafc;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 2.5px 5px;
    text-align: left;
    border: none;
  }}
  .party-table th.sno-head {{
    width: 24px;
    text-align: center;
  }}
  .party-table th.div-head {{
    width: 8px;
    background: transparent;
    padding: 0;
  }}
  .party-table tr {{
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  .party-table td {{
    padding: 2px 5px;
    font-size: 8.5px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 0.5px solid #e2e8f0;
  }}
  .party-table tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}
  .party-table td.sno {{
    width: 24px;
    font-weight: 700;
    color: #64748b;
    text-align: center;
    font-size: 8px;
    border-right: 0.5px solid #cbd5e1;
    background-color: #f1f5f9;
  }}
  .party-table td.name {{
    color: #0f172a;
    font-weight: 600;
    padding-left: 6px;
  }}
  .party-table td.divider {{
    width: 8px;
    background: transparent;
    border: none;
    padding: 0;
  }}
  .party-table td.empty {{
    background: transparent !important;
    border-bottom: none;
  }}

  /* Document Footer */
  .main-footer {{
    border-top: 1.5px solid #0f172a;
    margin-top: 14px;
    padding-top: 5px;
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: #64748b;
    font-weight: 600;
  }}

  /* Print Optimization */
  @media print {{
    body {{
      background: #ffffff;
      padding: 0;
    }}
    .control-bar {{
      display: none !important;
    }}
    .doc-wrapper {{
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }}
    .section-container {{
      page-break-after: auto !important;
      break-after: auto !important;
    }}
    .party-table tr {{
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }}
    .section-banner {{
      page-break-after: avoid !important;
      break-after: avoid !important;
    }}
  }}
</style>
</head>
<body>

<!-- TOP CONTROL BAR (SCREEN ONLY) -->
<div class="control-bar">
  <div class="control-left">
    <span class="brand-badge-pill">SBE DIRECTORY</span>
    <span class="control-title">Continuous Route Ledger &bull; {total_parties} Total Parties</span>
    <div class="quick-links">
      <a href="#sec-malkangiri" class="quick-link-btn">Malkangiri ({len(malkangiri_parties)})</a>
      <a href="#sec-koraput" class="quick-link-btn">Koraput ({len(koraput_parties)})</a>
      <a href="#sec-phulbani" class="quick-link-btn">Phulbani ({len(phulbani_parties)})</a>
    </div>
  </div>
  <div class="control-right">
    <input type="text" id="partySearch" class="search-input" placeholder="Search party name..." oninput="filterParties(this.value)">
    <button class="print-btn" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Print / PDF (A4)
    </button>
  </div>
</div>

<!-- CONTINUOUS DOCUMENT CONTAINER -->
<div class="doc-wrapper">

  <!-- MAIN HEADER -->
  <div class="main-header">
    <div>
      <h1 class="brand-h1">SHREE BALAJEE ENTERPRISES</h1>
      <div class="brand-sub">Master Party Route Directory &bull; Malkangiri &bull; Koraput &bull; Phulbani</div>
    </div>
    <div class="header-meta">
      <div>Total Verified Parties: <strong>{total_parties}</strong></div>
      <div>Format: <strong>Continuous 2-Column A4</strong></div>
    </div>
  </div>

  <!-- GROUP 1: MALKANGIRI LINE -->
  <div class="section-container" id="sec-malkangiri">
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

  <!-- GROUP 2: KORAPUT LINE (CONTINUOUS - NO PAGE BREAK) -->
  <div class="section-container" id="sec-koraput">
    <div class="section-banner koraput">
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
  </div>

  <!-- GROUP 3: PHULBANI LINE (CONTINUOUS - NO PAGE BREAK) -->
  <div class="section-container" id="sec-phulbani">
    <div class="section-banner phulbani">
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

  <!-- FOOTER -->
  <div class="main-footer">
    <span>e-SBE Master Ledger Directory &bull; Malkangiri, Koraput, Phulbaani Lines</span>
    <span>Continuous A4 Flow &bull; Shree Balajee Enterprises</span>
  </div>

</div>

<script>
function filterParties(query) {{
  query = query.trim().toLowerCase();
  const rows = document.querySelectorAll('.party-tr');
  rows.forEach(row => {{
    if (!query) {{
      row.style.display = '';
      return;
    }}
    const leftName = row.children[1] ? (row.children[1].getAttribute('data-name') || '') : '';
    const rightName = row.children[4] ? (row.children[4].getAttribute('data-name') || '') : '';
    if (leftName.includes(query) || rightName.includes(query)) {{
      row.style.display = '';
    }} else {{
      row.style.display = 'none';
    }}
  }});
}}
</script>

</body>
</html>
'''

for path in OUT_PATHS:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Wrote continuous A4 HTML to {path}")
