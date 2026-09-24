import { InnovationItem, InnovationNature, InnovationLocus, InnovationType } from '../types/innovation';
import {
  INNOVATION_TYPES,
  INNOVATION_NATURES,
  INNOVATION_LOCI,
  NATURE_COLORS,
  TYPE_COLORS,
} from '../constants/innovationTaxonomy';

/**
 * Escapes strings for CSV formatting according to RFC 4180
 */
function escapeCSVField(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '""';
  const str = String(field);
  // If field contains comma, newlines, or double quotes, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports current innovation data to CSV format and triggers a browser download
 */
export function exportToCSV(innovations: InnovationItem[], filenamePrefix = 'innovation-matrix'): void {
  const headers = [
    'ID',
    'Company / Organization',
    'Innovation Title',
    'Type of Innovation',
    'Nature of Innovation',
    'Locus of Innovation',
    'Year',
    'Created Date (ISO)',
    'Description',
  ];

  const rows = innovations.map((item) => [
    escapeCSVField(item.id),
    escapeCSVField(item.companyName),
    escapeCSVField(item.innovationName),
    escapeCSVField(item.type),
    escapeCSVField(item.nature),
    escapeCSVField(item.locus),
    escapeCSVField(item.year || ''),
    escapeCSVField(new Date(item.createdAt).toISOString()),
    escapeCSVField(item.description || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Include UTF-8 BOM (\uFEFF) so Excel and spreadsheet tools correctly parse UTF-8 characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}-${dateStr}.csv`;

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports current innovation matrix data as a standalone, styled, interactive HTML report
 */
export function exportToHTML(innovations: InnovationItem[], filenamePrefix = 'innovation-matrix-report'): void {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateISO = new Date().toISOString().split('T')[0];

  // Calculate statistics
  const totalCount = innovations.length;
  const uniqueCubes = new Set(innovations.map((i) => `${i.type}|${i.nature}|${i.locus}`)).size;

  // Nature distribution
  const natureCounts: Record<InnovationNature, number> = {
    Sustaining: 0,
    Efficiency: 0,
    Disruptive: 0,
  };
  innovations.forEach((i) => {
    if (natureCounts[i.nature] !== undefined) {
      natureCounts[i.nature]++;
    }
  });

  // Locus distribution
  const locusCounts: Record<InnovationLocus, number> = {
    'Small Teams': 0,
    Projects: 0,
    Organisations: 0,
    'Business Ecosystem': 0,
  };
  innovations.forEach((i) => {
    if (locusCounts[i.locus] !== undefined) {
      locusCounts[i.locus]++;
    }
  });

  // Type distribution
  const typeCounts: Record<string, number> = {};
  INNOVATION_TYPES.forEach((t) => {
    typeCounts[t] = 0;
  });
  innovations.forEach((i) => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
  });

  // Build JSON data embedded for filtering in HTML
  const safeDataJson = JSON.stringify(innovations).replace(/</g, '\\u003c');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Innovation Matrix 3D — Portfolio Backup & Report (${dateStr})</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #0f172a;
      --border: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --sky: #38bdf8;
      --emerald: #34d399;
      --amber: #f59e0b;
      --rose: #f43f5e;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-family);
      line-height: 1.6;
      padding: 32px 24px;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 32px;
    }
    .header-title h1 {
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cube-dot {
      width: 14px;
      height: 14px;
      background: var(--sky);
      border-radius: 3px;
      display: inline-block;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
    }
    .header-title p {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--text);
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }
    .btn:hover {
      background: #1e293b;
      border-color: #334155;
    }
    .btn-primary {
      background: var(--sky);
      color: #090d16;
      border-color: var(--sky);
    }
    .btn-primary:hover {
      background: #7dd3fc;
    }
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .stat-val {
      font-size: 32px;
      font-weight: 800;
      color: #fff;
    }
    .stat-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    /* Breakdown Sections */
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .distribution-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 36px;
    }
    .dist-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .dist-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13px;
    }
    .dist-row:last-child { border-bottom: none; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-sustaining { background: rgba(56, 189, 248, 0.15); color: var(--sky); border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge-efficiency { background: rgba(52, 211, 153, 0.15); color: var(--emerald); border: 1px solid rgba(52, 211, 153, 0.3); }
    .badge-disruptive { background: rgba(245, 158, 11, 0.15); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-locus { background: rgba(148, 163, 184, 0.12); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.2); }
    .badge-type { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }

    /* Search & Filter Bar */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 18px;
      align-items: center;
    }
    .search-input {
      flex: 1;
      min-width: 220px;
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .search-input:focus { border-color: var(--sky); }
    select.filter-select {
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      font-size: 13px;
      outline: none;
      cursor: pointer;
    }

    /* Innovations Table */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    th {
      background: #090d16;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }
    .company-cell { font-weight: 700; color: #fff; font-size: 14px; }
    .title-cell { font-weight: 600; color: var(--sky); margin-top: 2px; }
    .desc-cell { color: var(--text-muted); font-size: 12px; margin-top: 4px; max-width: 480px; }
    .stars { color: #f59e0b; letter-spacing: 2px; }

    footer {
      text-align: center;
      padding: 24px;
      color: var(--text-muted);
      font-size: 12px;
      border-top: 1px solid var(--border);
    }

    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0 !important; }
      .btn, .filter-bar, footer { display: none !important; }
      .stat-card, .dist-card, .table-container { border: 1px solid #ccc !important; background: #fff !important; }
      .stat-val, .company-cell, h1 { color: #000 !important; }
      th { background: #f0f0f0 !important; color: #333 !important; }
      td { border-bottom: 1px solid #ddd !important; }
      .desc-cell { color: #555 !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-title">
        <h1><span class="cube-dot"></span> Innovation Matrix 3D — Portfolio Backup</h1>
        <p>108-Cell Taxonomy Model: 9 Types × 3 Natures × 4 Loci · Exported on ${dateStr}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" onclick="window.print()">Print / Save PDF</button>
      </div>
    </header>

    <!-- Stats Summary Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Innovations</div>
        <div class="stat-val">${totalCount}</div>
        <div class="stat-sub">${uniqueCubes} of 108 matrix cells occupied (${((uniqueCubes / 108) * 100).toFixed(1)}%)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Cells Coverage</div>
        <div class="stat-val">${uniqueCubes} <span style="font-size: 18px; color: var(--sky);">/ 108</span></div>
        <div class="stat-sub">${((uniqueCubes / 108) * 100).toFixed(1)}% matrix space occupied</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Nature Breakdown</div>
        <div style="margin-top: 8px; font-size: 13px;">
          <div><span style="color: var(--sky); font-weight: bold;">${natureCounts.Sustaining}</span> Sustaining</div>
          <div><span style="color: var(--emerald); font-weight: bold;">${natureCounts.Efficiency}</span> Efficiency</div>
          <div><span style="color: var(--amber); font-weight: bold;">${natureCounts.Disruptive}</span> Disruptive</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Matrix Taxonomy Shape</div>
        <div class="stat-val" style="font-size: 24px;">9 × 3 × 4</div>
        <div class="stat-sub">108 Discrete 3D Spatial Positions</div>
      </div>
    </div>

    <!-- Distribution Breakdowns -->
    <div class="distribution-grid">
      <div class="dist-card">
        <div class="section-title">Distribution by Nature (Z-Axis)</div>
        <div class="dist-row">
          <span><span class="badge badge-sustaining">Sustaining</span></span>
          <span style="font-weight: 700;">${natureCounts.Sustaining} (${totalCount ? ((natureCounts.Sustaining / totalCount) * 100).toFixed(0) : 0}%)</span>
        </div>
        <div class="dist-row">
          <span><span class="badge badge-efficiency">Efficiency</span></span>
          <span style="font-weight: 700;">${natureCounts.Efficiency} (${totalCount ? ((natureCounts.Efficiency / totalCount) * 100).toFixed(0) : 0}%)</span>
        </div>
        <div class="dist-row">
          <span><span class="badge badge-disruptive">Disruptive</span></span>
          <span style="font-weight: 700;">${natureCounts.Disruptive} (${totalCount ? ((natureCounts.Disruptive / totalCount) * 100).toFixed(0) : 0}%)</span>
        </div>
      </div>

      <div class="dist-card">
        <div class="section-title">Distribution by Locus (X-Axis)</div>
        ${INNOVATION_LOCI.map(
          (loc) => `
        <div class="dist-row">
          <span><span class="badge badge-locus">${loc}</span></span>
          <span style="font-weight: 700;">${locusCounts[loc]} (${totalCount ? ((locusCounts[loc] / totalCount) * 100).toFixed(0) : 0}%)</span>
        </div>`
        ).join('')}
      </div>
    </div>

    <!-- Interactive Search / Filter Bar -->
    <div class="section-title">
      <span>Innovations Catalog (${totalCount} Records)</span>
      <span style="font-size: 13px; color: var(--text-muted); font-weight: normal;">Filter or search offline</span>
    </div>

    <div class="filter-bar">
      <input type="text" id="searchInput" class="search-input" placeholder="Search by company, title, keyword..." oninput="filterTable()">
      <select id="natureSelect" class="filter-select" onchange="filterTable()">
        <option value="">All Natures</option>
        <option value="Sustaining">Sustaining</option>
        <option value="Efficiency">Efficiency</option>
        <option value="Disruptive">Disruptive</option>
      </select>
      <select id="locusSelect" class="filter-select" onchange="filterTable()">
        <option value="">All Loci</option>
        ${INNOVATION_LOCI.map((l) => `<option value="${l}">${l}</option>`).join('')}
      </select>
      <select id="typeSelect" class="filter-select" onchange="filterTable()">
        <option value="">All 9 Types</option>
        ${INNOVATION_TYPES.map((t) => `<option value="${t}">${t}</option>`).join('')}
      </select>
      <button class="btn" onclick="resetFilters()">Reset Filters</button>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <table id="innovationsTable">
        <thead>
          <tr>
            <th style="width: 38%;">Company & Innovation</th>
            <th style="width: 20%;">Nature (Z)</th>
            <th style="width: 20%;">Locus (X)</th>
            <th style="width: 22%;">Type (Y)</th>
          </tr>
        </thead>
        <tbody id="tableBody">
          ${innovations
            .map((item) => {
              const natureClass =
                item.nature === 'Sustaining'
                  ? 'badge-sustaining'
                  : item.nature === 'Efficiency'
                  ? 'badge-efficiency'
                  : 'badge-disruptive';
              return `<tr class="data-row" data-company="${item.companyName.toLowerCase()}" data-title="${item.innovationName.toLowerCase()}" data-desc="${(
                item.description || ''
              ).toLowerCase()}" data-nature="${item.nature}" data-locus="${item.locus}" data-type="${item.type}">
              <td>
                <div class="company-cell">${escapeHtml(item.companyName)} ${
                item.year ? `<span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">(${item.year})</span>` : ''
              }</div>
                <div class="title-cell">${escapeHtml(item.innovationName)}</div>
                ${item.description ? `<div class="desc-cell">${escapeHtml(item.description)}</div>` : ''}
              </td>
              <td><span class="badge ${natureClass}">${item.nature}</span></td>
              <td><span class="badge badge-locus">${item.locus}</span></td>
              <td><span class="badge badge-type">${item.type}</span></td>
            </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>

    <footer>
      Generated by Innovation Matrix 3D Platform · Full 108-Cube Strategic Taxonomy · Data archived on ${dateISO}
    </footer>
  </div>

  <script>
    const allInnovations = ${safeDataJson};

    function escapeHtml(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function filterTable() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const nature = document.getElementById('natureSelect').value;
      const locus = document.getElementById('locusSelect').value;
      const type = document.getElementById('typeSelect').value;

      const rows = document.querySelectorAll('.data-row');
      rows.forEach(row => {
        const rowCompany = row.getAttribute('data-company') || '';
        const rowTitle = row.getAttribute('data-title') || '';
        const rowDesc = row.getAttribute('data-desc') || '';
        const rowNature = row.getAttribute('data-nature') || '';
        const rowLocus = row.getAttribute('data-locus') || '';
        const rowType = row.getAttribute('data-type') || '';

        const matchesQuery = !q || rowCompany.includes(q) || rowTitle.includes(q) || rowDesc.includes(q);
        const matchesNature = !nature || rowNature === nature;
        const matchesLocus = !locus || rowLocus === locus;
        const matchesType = !type || rowType === type;

        if (matchesQuery && matchesNature && matchesLocus && matchesType) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.getElementById('natureSelect').value = '';
      document.getElementById('locusSelect').value = '';
      document.getElementById('typeSelect').value = '';
      filterTable();
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const filename = `${filenamePrefix}-${dateISO}.html`;

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
