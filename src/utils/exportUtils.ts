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
 * with embedded interactive 3D WebGL Innovation Matrix graph, live session 3D snapshot, and multi-angle projections.
 */
export function exportToHTML(
  innovations: InnovationItem[],
  filenamePrefix = 'innovation-matrix-report',
  canvasSnapshot?: string | null,
  companyName = 'Company'
): void {
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

  // Cell aggregation map for 3D Graph
  const cellMap: Record<string, InnovationItem[]> = {};
  innovations.forEach((item) => {
    const key = `${item.type}|${item.nature}|${item.locus}`;
    if (!cellMap[key]) cellMap[key] = [];
    cellMap[key].push(item);
  });

  // Build JSON data embedded for filtering & 3D WebGL renderer in HTML
  const safeDataJson = JSON.stringify(innovations).replace(/</g, '\\u003c');
  const safeCellMapJson = JSON.stringify(cellMap).replace(/</g, '\\u003c');
  const safeCompanyName = escapeHtml(companyName);
  const safeCanvasSnapshot = canvasSnapshot || '';

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
      --border-accent: rgba(56, 189, 248, 0.35);
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
    .container { max-width: 1240px; margin: 0 auto; }
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
    .btn-secondary {
      background: #1e293b;
      color: #fff;
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

    /* 3D Graphs Generated Section (at the end of HTML file) */
    .graphs-3d-section {
      margin-top: 48px;
      margin-bottom: 40px;
      padding-top: 36px;
      border-top: 2px solid var(--border);
    }
    .graphs-header {
      margin-bottom: 24px;
    }
    .graphs-header h2 {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .graphs-header p {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 6px;
    }
    .badge-3d {
      background: rgba(56, 189, 248, 0.2);
      color: var(--sky);
      border: 1px solid var(--sky);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .webgl-wrapper {
      position: relative;
      background: radial-gradient(circle at center, #0f172a 0%, #060913 100%);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
      margin-bottom: 28px;
    }
    .webgl-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 18px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      z-index: 10;
      position: relative;
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .toolbar-btn {
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .toolbar-btn:hover {
      background: #334155;
      color: #fff;
      border-color: #475569;
    }
    .toolbar-btn.active {
      background: rgba(56, 189, 248, 0.2);
      border-color: var(--sky);
      color: var(--sky);
    }
    .slider-container {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
      background: #090d16;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    .slider-container input[type="range"] {
      width: 90px;
      accent-color: var(--sky);
      cursor: pointer;
    }
    #three-viewport {
      width: 100%;
      height: 600px;
      display: block;
      cursor: grab;
      position: relative;
    }
    #three-viewport:active {
      cursor: grabbing;
    }
    /* 3D Tooltip & Inspector Panel */
    #cubeTooltip3D {
      position: absolute;
      display: none;
      pointer-events: none;
      z-index: 25;
      background: rgba(15, 23, 42, 0.94);
      border: 1px solid var(--sky);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-size: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(56, 189, 248, 0.3);
      max-width: 280px;
      backdrop-filter: blur(4px);
    }
    #cubeDetailPanel3D {
      position: absolute;
      top: 60px;
      right: 16px;
      bottom: 16px;
      width: 320px;
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid var(--border-accent);
      border-radius: 12px;
      padding: 18px;
      z-index: 30;
      display: none;
      flex-direction: column;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
      overflow-y: auto;
    }
    .detail-close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
    }
    .detail-close-btn:hover { color: #fff; }
    
    /* 3D Legend Bar */
    .axes-legend-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-around;
      gap: 16px;
      padding: 12px 18px;
      background: rgba(9, 13, 22, 0.85);
      border-top: 1px solid var(--border);
      font-size: 12px;
    }
    .legend-axis-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-line {
      width: 16px;
      height: 3px;
      border-radius: 2px;
    }
    .line-y { background: #38bdf8; }
    .line-x { background: #f59e0b; }
    .line-z { background: #34d399; }

    /* Snapshot & Projections Grid */
    .projections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }
    .projection-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .snapshot-img-container {
      position: relative;
      background: #060913;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin: 14px 0;
      min-height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .snapshot-img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: contain;
    }
    .slice-heatmap {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 12px;
    }
    .slice-cell {
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 4px;
      text-align: center;
      font-size: 11px;
    }
    .slice-cell.active-sustaining {
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.4);
      color: var(--sky);
      font-weight: 700;
    }
    .slice-cell.active-efficiency {
      background: rgba(52, 211, 153, 0.15);
      border-color: rgba(52, 211, 153, 0.4);
      color: var(--emerald);
      font-weight: 700;
    }
    .slice-cell.active-disruptive {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.4);
      color: var(--amber);
      font-weight: 700;
    }

    footer {
      text-align: center;
      padding: 28px 0;
      color: var(--text-muted);
      font-size: 12px;
      border-top: 1px solid var(--border);
      margin-top: 40px;
    }

    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0 !important; }
      .btn, .filter-bar, .webgl-toolbar, footer { display: none !important; }
      .stat-card, .dist-card, .table-container, .projection-card { border: 1px solid #ccc !important; background: #fff !important; }
      .stat-val, .company-cell, h1, h2 { color: #000 !important; }
      th { background: #f0f0f0 !important; color: #333 !important; }
      td { border-bottom: 1px solid #ddd !important; }
      .desc-cell { color: #555 !important; }
      #three-viewport { display: none !important; }
      .webgl-wrapper { border: none !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-title">
        <h1><span class="cube-dot"></span> Innovation Matrix 3D — ${safeCompanyName} Portfolio</h1>
        <p>108-Cell Strategic Taxonomy: 9 Types × 3 Natures × 4 Loci · Exported on ${dateStr}</p>
      </div>
      <div class="header-actions">
        <a href="#graphs-3d" class="btn btn-secondary">↓ View 3D Graphs</a>
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

    <!-- 3D GRAPHS GENERATED SECTION (ADDED AT THE END OF THE HTML FILE) -->
    <section id="graphs-3d" class="graphs-3d-section">
      <div class="graphs-header">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <h2>
            <span class="badge-3d">3D WebGL</span>
            Innovation Matrix 3D Graphs & Visualizations
          </h2>
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="font-size: 12px; color: var(--text-muted);">${uniqueCubes} Populated / 108 Matrix Cells</span>
          </div>
        </div>
        <p>Interactive 3D model with OrbitControls (drag to rotate, scroll to zoom, right-click to pan), rotated taxonomy axes, exploded view mode, and high-resolution session snapshot.</p>
      </div>

      <!-- Interactive 3D WebGL Matrix Viewport -->
      <div class="webgl-wrapper" id="webglContainer">
        <!-- 3D Toolbar Controls -->
        <div class="webgl-toolbar">
          <div class="toolbar-group">
            <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 4px;">Camera:</span>
            <button class="toolbar-btn active" id="btnPresetIso" onclick="setCameraPreset('iso')">3D Isometric</button>
            <button class="toolbar-btn" id="btnPresetFront" onclick="setCameraPreset('front')">Front (X/Y)</button>
            <button class="toolbar-btn" id="btnPresetSide" onclick="setCameraPreset('side')">Side (Z/Y)</button>
            <button class="toolbar-btn" id="btnPresetTop" onclick="setCameraPreset('top')">Top (X/Z)</button>
          </div>

          <div class="toolbar-group">
            <div class="slider-container" title="Spread matrix cells apart for inner inspection">
              <span>Explode:</span>
              <input type="range" id="explodeRange" min="0" max="100" value="0" oninput="updateExplode(this.value)">
              <span id="explodeValueLabel" style="min-width: 28px; font-weight: bold; color: var(--sky);">0%</span>
            </div>

            <button class="toolbar-btn" id="btnToggleColor" onclick="toggleColorMode()">Color: Nature</button>
            <button class="toolbar-btn" id="btnTogglePopulated" onclick="togglePopulatedOnly()">Mode: All 108</button>
            <button class="toolbar-btn" id="btnToggleRotate" onclick="toggleAutoRotate()">Auto-Rotate: Off</button>
            <button class="toolbar-btn" onclick="reset3DCamera()">Reset</button>
            <button class="toolbar-btn" onclick="save3DCanvasSnapshot()">Save PNG</button>
          </div>
        </div>

        <!-- 3D Canvas Element -->
        <canvas id="three-viewport"></canvas>

        <!-- Raycast Hover Tooltip in 3D -->
        <div id="cubeTooltip3D"></div>

        <!-- Click Inspector Panel in 3D -->
        <div id="cubeDetailPanel3D">
          <button class="detail-close-btn" onclick="closeCubeDetail()">✕</button>
          <div id="cubeDetailContent"></div>
        </div>

        <!-- 3D Taxonomy Legend Bar -->
        <div class="axes-legend-bar">
          <div class="legend-axis-item">
            <div class="legend-line line-y"></div>
            <span><strong>Vertical Y-Axis:</strong> Type of Innovation (9 Categories)</span>
          </div>
          <div class="legend-axis-item">
            <div class="legend-line line-x"></div>
            <span><strong>Horizontal X-Axis:</strong> Focus of Innovation (4 Loci, Rotated 90°)</span>
          </div>
          <div class="legend-axis-item">
            <div class="legend-line line-z"></div>
            <span><strong>Depth Z-Axis:</strong> Nature of Innovation (3 Natures, Rotated 90°)</span>
          </div>
        </div>
      </div>

      <!-- Additional 3D Graph Projections & Live Session Snapshot -->
      <div class="projections-grid">
        <!-- Live Captured 3D Graph Snapshot Card -->
        <div class="projection-card">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h3 style="font-size: 15px; font-weight: 700; color: #fff;">Live Session 3D Snapshot</h3>
              <p style="font-size: 12px; color: var(--text-muted);">Exact 3D camera angle & state captured upon export</p>
            </div>
            ${
              safeCanvasSnapshot
                ? `<button class="btn" style="padding: 4px 10px; font-size: 12px;" onclick="downloadSessionSnapshot()">Download PNG</button>`
                : ''
            }
          </div>
          <div class="snapshot-img-container">
            ${
              safeCanvasSnapshot
                ? `<img id="sessionSnapshotImg" src="${safeCanvasSnapshot}" alt="Innovation Matrix 3D Snapshot" class="snapshot-img" />`
                : `<div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;">Snapshot captured via WebGL canvas below</div>`
            }
          </div>
          <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>Source: Active WebGL Canvas Render</span>
            <span>Archived: ${dateISO}</span>
          </div>
        </div>

        <!-- 3D Dimensional Slice Breakdown Card -->
        <div class="projection-card">
          <div>
            <h3 style="font-size: 15px; font-weight: 700; color: #fff;">3D Nature Layers Spatial Density</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Cell occupancy across the 3 parallel depth slices (Z-Axis)</p>
          </div>

          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span style="color: var(--sky); font-weight: 700;">Z = 0: Sustaining (Front Depth Layer)</span>
                <span>${natureCounts.Sustaining} innovations</span>
              </div>
              <div class="slice-heatmap">
                ${INNOVATION_LOCI.map((loc) => {
                  const count = innovations.filter((i) => i.nature === 'Sustaining' && i.locus === loc).length;
                  return `<div class="slice-cell ${count > 0 ? 'active-sustaining' : ''}">
                    <div style="font-size: 10px; color: #94a3b8;">${loc.split(' ')[0]}</div>
                    <div style="font-weight: 700; font-size: 13px;">${count}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span style="color: var(--emerald); font-weight: 700;">Z = 1: Efficiency (Middle Depth Layer)</span>
                <span>${natureCounts.Efficiency} innovations</span>
              </div>
              <div class="slice-heatmap">
                ${INNOVATION_LOCI.map((loc) => {
                  const count = innovations.filter((i) => i.nature === 'Efficiency' && i.locus === loc).length;
                  return `<div class="slice-cell ${count > 0 ? 'active-efficiency' : ''}">
                    <div style="font-size: 10px; color: #94a3b8;">${loc.split(' ')[0]}</div>
                    <div style="font-weight: 700; font-size: 13px;">${count}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span style="color: var(--amber); font-weight: 700;">Z = 2: Disruptive (Back Depth Layer)</span>
                <span>${natureCounts.Disruptive} innovations</span>
              </div>
              <div class="slice-heatmap">
                ${INNOVATION_LOCI.map((loc) => {
                  const count = innovations.filter((i) => i.nature === 'Disruptive' && i.locus === loc).length;
                  return `<div class="slice-cell ${count > 0 ? 'active-disruptive' : ''}">
                    <div style="font-size: 10px; color: #94a3b8;">${loc.split(' ')[0]}</div>
                    <div style="font-weight: 700; font-size: 13px;">${count}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer>
      Generated by Innovation Matrix 3D Platform · Full 108-Cube Strategic Taxonomy · Data archived on ${dateISO}
    </footer>
  </div>

  <!-- CDN scripts for embedded 3D WebGL renderer -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

  <script>
    const allInnovations = ${safeDataJson};
    const cellMapData = ${safeCellMapJson};
    const companyNameGlobal = "${safeCompanyName}";

    function escapeHtml(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* Table Search & Filter Logic */
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

    function downloadSessionSnapshot() {
      const img = document.getElementById('sessionSnapshotImg');
      if (img && img.src) {
        const a = document.createElement('a');
        a.href = img.src;
        a.download = '${filenamePrefix}-session-3d-snapshot.png';
        a.click();
      }
    }

    /* ====================================================================
       INTERACTIVE 3D WEBGL GRAPH ENGINE (THREE.JS)
       ==================================================================== */
    const TAXONOMY_TYPES = [
      'Design & Marketing',
      'Product',
      'Service',
      'Market & Customer Channel',
      'Technology',
      'Process',
      'Management',
      'Business Model',
      'Industry'
    ];
    const TAXONOMY_NATURES = ['Sustaining', 'Efficiency', 'Disruptive'];
    const TAXONOMY_LOCI = ['Small Teams', 'Projects', 'Organisations', 'Business Ecosystem'];

    const NATURE_COLOR_MAP = {
      Sustaining: 0x38bdf8,
      Efficiency: 0x34d399,
      Disruptive: 0xf59e0b
    };

    const TYPE_COLOR_MAP = {
      'Design & Marketing': 0xf43f5e,
      'Product': 0xec4899,
      'Service': 0xd946ef,
      'Market & Customer Channel': 0x8b5cf6,
      'Technology': 0x3b82f6,
      'Process': 0x06b6d4,
      'Management': 0x10b981,
      'Business Model': 0x84cc16,
      'Industry': 0xeab308
    };

    let scene, camera, renderer, controls;
    let cubeMeshes = [];
    let axisGroup = null;
    let colorMode = 'nature'; // 'nature' | 'type'
    let populatedOnly = false;
    let explodeFactor = 0;
    let autoRotate = false;
    let hoveredMesh = null;

    function init3DGraph() {
      const container = document.getElementById('webglContainer');
      const canvas = document.getElementById('three-viewport');
      if (!canvas || typeof THREE === 'undefined') {
        console.warn('Three.js library not available or canvas missing');
        return;
      }

      const width = container.clientWidth;
      const height = 600;

      // 1. Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0f1d);

      // Subtle fog for depth
      scene.fog = new THREE.FogExp2(0x0a0f1d, 0.016);

      // 2. Camera
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(16, 12, 17);

      // 3. Renderer
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // 4. Controls
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxDistance = 60;
      controls.minDistance = 3;
      controls.target.set(0, 0, 0);

      // 5. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xfff6ec, 1.8);
      dirLight1.position.set(20, 30, 20);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
      dirLight2.position.set(-20, -10, -20);
      scene.add(dirLight2);

      // 6. Build Grid & Axes
      build3DMatrixCubes();
      build3DMatrixAxes();

      // 7. Raycasting & Events
      setup3DInteractions(canvas);

      // 8. Animation Loop
      animate3D();

      // 9. Resize Observer
      window.addEventListener('resize', onWindowResize3D);
    }

    function createHtmlTextSprite(text, options) {
      options = options || {};
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = options.width || 480;
      const height = options.height || 90;
      const fontSize = options.fontSize || 38;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      if (options.bgColor) {
        ctx.fillStyle = options.bgColor;
        const r = 16;
        ctx.beginPath();
        ctx.moveTo(r, 4);
        ctx.lineTo(width - r, 4);
        ctx.quadraticCurveTo(width - 4, 4, width - 4, r);
        ctx.lineTo(width - 4, height - r);
        ctx.quadraticCurveTo(width - 4, height - 4, width - r, height - 4);
        ctx.lineTo(r, height - 4);
        ctx.quadraticCurveTo(4, height - 4, 4, height - r);
        ctx.lineTo(4, r);
        ctx.quadraticCurveTo(4, 4, r, 4);
        ctx.closePath();
        ctx.fill();

        if (options.borderColor) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = options.borderColor;
          ctx.stroke();
        }
      }

      if (options.accentDotColor) {
        ctx.fillStyle = options.accentDotColor;
        ctx.beginPath();
        ctx.arc(32, height / 2, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = options.accentDotColor ? 'left' : 'center';
      ctx.textBaseline = 'middle';
      ctx.font = (options.fontWeight || '700') + ' ' + fontSize + 'px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = options.textColor || '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 6;

      const startX = options.accentDotColor ? 54 : width / 2;
      ctx.fillText(text, startX, height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        rotation: options.rotation || 0
      });

      const sprite = new THREE.Sprite(material);
      const scaleX = options.scaleX || 2.5;
      const scaleY = options.scaleY || (scaleX * height) / width;
      sprite.scale.set(scaleX, scaleY, 1);
      return sprite;
    }

    function build3DMatrixCubes() {
      // Remove existing cubes
      cubeMeshes.forEach(mesh => scene.remove(mesh));
      cubeMeshes = [];

      const baseSpacing = 1.35;
      const effectiveSpacing = baseSpacing * (1 + explodeFactor * 1.4);
      const cubeGeometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);

      for (let t = 0; t < TAXONOMY_TYPES.length; t++) {
        for (let n = 0; n < TAXONOMY_NATURES.length; n++) {
          for (let l = 0; l < TAXONOMY_LOCI.length; l++) {
            const typeName = TAXONOMY_TYPES[t];
            const natureName = TAXONOMY_NATURES[n];
            const locusName = TAXONOMY_LOCI[l];

            const key = typeName + '|' + natureName + '|' + locusName;
            const items = cellMapData[key] || [];
            const count = items.length;

            const isPopulated = count > 0;
            if (populatedOnly && !isPopulated) continue;

            const x = (l - 1.5) * effectiveSpacing;
            const y = (t - 4) * effectiveSpacing;
            const z = (n - 1) * effectiveSpacing;

            let colorHex = NATURE_COLOR_MAP[natureName];
            if (colorMode === 'type') {
              colorHex = TYPE_COLOR_MAP[typeName] || 0x38bdf8;
            }

            let mat;
            if (isPopulated) {
              mat = new THREE.MeshStandardMaterial({
                color: colorHex,
                metalness: 0.15,
                roughness: 0.25,
                transparent: true,
                opacity: 0.92,
                emissive: colorHex,
                emissiveIntensity: 0.25
              });
            } else {
              mat = new THREE.MeshStandardMaterial({
                color: 0x475569,
                metalness: 0.8,
                roughness: 0.5,
                transparent: true,
                opacity: 0.12,
                wireframe: false
              });
            }

            const mesh = new THREE.Mesh(cubeGeometry, mat);
            mesh.position.set(x, y, z);
            mesh.userData = {
              type: typeName,
              nature: natureName,
              locus: locusName,
              typeIndex: t,
              natureIndex: n,
              locusIndex: l,
              items: items,
              count: count,
              isPopulated: isPopulated,
              baseColor: colorHex
            };

            // Subtle wireframe edge outline for populated cubes
            if (isPopulated) {
              const edgesGeo = new THREE.EdgesGeometry(cubeGeometry);
              const edgesMat = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4
              });
              const edgeWire = new THREE.LineSegments(edgesGeo, edgesMat);
              mesh.add(edgeWire);
            }

            scene.add(mesh);
            cubeMeshes.push(mesh);
          }
        }
      }
    }

    function build3DMatrixAxes() {
      if (axisGroup) scene.remove(axisGroup);
      axisGroup = new THREE.Group();

      const currentSpacing = 1.35 * (1 + explodeFactor * 1.4);
      const ROTATION_90 = (270 * Math.PI) / 180; // 90° clockwise in Three.js Sprite space

      const axisLineMat = new THREE.LineBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.85
      });
      const arrowConeGeo = new THREE.ConeGeometry(0.18, 0.45, 16);

      const xMin = -1.5 * currentSpacing;
      const xMax = 1.5 * currentSpacing;
      const yMin = -4 * currentSpacing;
      const yMax = 4 * currentSpacing;
      const zMin = -1 * currentSpacing;
      const zMax = 1 * currentSpacing;

      // 1. VERTICAL AXIS (Y): Type of Innovation
      const vRailX = xMin - 1.15;
      const vRailZ = zMin - 0.25;

      const vRailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(vRailX, yMin - 0.4, vRailZ),
        new THREE.Vector3(vRailX, yMax + 0.6, vRailZ)
      ]);
      axisGroup.add(new THREE.Line(vRailGeo, axisLineMat));

      const vArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      vArrow.position.set(vRailX, yMax + 0.8, vRailZ);
      axisGroup.add(vArrow);

      for (let t = 0; t < TAXONOMY_TYPES.length; t++) {
        const y = (t - 4) * currentSpacing;
        const typeName = TAXONOMY_TYPES[t];
        const hex = TYPE_COLOR_MAP[typeName] || 0x38bdf8;
        const hexStr = '#' + hex.toString(16).padStart(6, '0');

        const labelSprite = createHtmlTextSprite(typeName, {
          fontSize: 38,
          textColor: '#f8fafc',
          bgColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: hexStr,
          accentDotColor: hexStr,
          width: 460,
          height: 90,
          scaleX: 2.3,
          scaleY: 0.45
        });
        labelSprite.position.set(vRailX - 1.35, y, vRailZ);
        axisGroup.add(labelSprite);

        const tickGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(vRailX - 0.15, y, vRailZ),
          new THREE.Vector3(xMin - 0.2, y, vRailZ)
        ]);
        axisGroup.add(new THREE.Line(tickGeo, axisLineMat));
      }

      // Title in middle of Y axis
      const vTitleSprite = createHtmlTextSprite('Type of Innovation', {
        fontSize: 44,
        fontWeight: '800',
        textColor: '#38bdf8',
        bgColor: 'rgba(15, 23, 42, 0.98)',
        borderColor: '#38bdf8',
        accentDotColor: '#38bdf8',
        width: 520,
        height: 100,
        scaleX: 2.8,
        scaleY: 0.54
      });
      vTitleSprite.position.set(vRailX - 3.2, 0, vRailZ);
      axisGroup.add(vTitleSprite);

      // 2. HORIZONTAL FRONT AXIS (X): Focus of Innovation - Rotated 90 degrees
      const hRailY = yMin - 0.85;
      const hRailZ = zMax + 1.1;

      const hRailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xMin - 0.5, hRailY, hRailZ),
        new THREE.Vector3(xMax + 0.6, hRailY, hRailZ)
      ]);
      axisGroup.add(new THREE.Line(hRailGeo, axisLineMat));

      const hArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
      hArrow.rotation.z = -Math.PI / 2;
      hArrow.position.set(xMax + 0.8, hRailY, hRailZ);
      axisGroup.add(hArrow);

      for (let l = 0; l < TAXONOMY_LOCI.length; l++) {
        const x = (l - 1.5) * currentSpacing;
        const locusName = TAXONOMY_LOCI[l];

        const locusSprite = createHtmlTextSprite(locusName, {
          fontSize: 40,
          textColor: '#fef08a',
          bgColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(245, 158, 11, 0.7)',
          accentDotColor: '#f59e0b',
          width: 420,
          height: 90,
          scaleX: 2.1,
          scaleY: 0.45,
          rotation: ROTATION_90
        });
        locusSprite.position.set(x, hRailY - 1.25, hRailZ);
        axisGroup.add(locusSprite);

        const tickGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, hRailY, hRailZ),
          new THREE.Vector3(x, yMin - 0.15, zMax + 0.2)
        ]);
        axisGroup.add(new THREE.Line(tickGeo, axisLineMat));
      }

      // Title in middle of X axis - rotated 90 degrees
      const focusTitleSprite = createHtmlTextSprite('Focus of Innovation', {
        fontSize: 44,
        fontWeight: '800',
        textColor: '#fbbf24',
        bgColor: 'rgba(15, 23, 42, 0.98)',
        borderColor: '#f59e0b',
        accentDotColor: '#f59e0b',
        width: 540,
        height: 100,
        scaleX: 2.9,
        scaleY: 0.54,
        rotation: ROTATION_90
      });
      focusTitleSprite.position.set(0, hRailY - 1.75, hRailZ + 0.65);
      axisGroup.add(focusTitleSprite);

      // 3. DEPTH RIGHT AXIS (Z): Nature of Innovation - Rotated 90 degrees
      const dRailY = yMin - 0.85;
      const dRailX = xMax + 1.1;

      const dRailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(dRailX, dRailY, zMin - 0.5),
        new THREE.Vector3(dRailX, dRailY, zMax + 0.6)
      ]);
      axisGroup.add(new THREE.Line(dRailGeo, axisLineMat));

      const dArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
      dArrow.rotation.x = Math.PI / 2;
      dArrow.position.set(dRailX, dRailY, zMax + 0.8);
      axisGroup.add(dArrow);

      for (let n = 0; n < TAXONOMY_NATURES.length; n++) {
        const z = (n - 1) * currentSpacing;
        const natureName = TAXONOMY_NATURES[n];
        const hex = NATURE_COLOR_MAP[natureName] || 0x34d399;
        const hexStr = '#' + hex.toString(16).padStart(6, '0');

        const natureSprite = createHtmlTextSprite(natureName, {
          fontSize: 40,
          textColor: hexStr,
          bgColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: hexStr,
          accentDotColor: hexStr,
          width: 440,
          height: 90,
          scaleX: 2.2,
          scaleY: 0.45,
          rotation: ROTATION_90
        });
        natureSprite.position.set(dRailX + 1.25, dRailY - 1.25, z);
        axisGroup.add(natureSprite);

        const tickGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(dRailX, dRailY, z),
          new THREE.Vector3(xMax + 0.2, yMin - 0.15, z)
        ]);
        axisGroup.add(new THREE.Line(tickGeo, axisLineMat));
      }

      // Title in middle of Z axis - rotated 90 degrees
      const natureTitleSprite = createHtmlTextSprite('Nature of Innovation', {
        fontSize: 44,
        fontWeight: '800',
        textColor: '#34d399',
        bgColor: 'rgba(15, 23, 42, 0.98)',
        borderColor: '#34d399',
        accentDotColor: '#34d399',
        width: 540,
        height: 100,
        scaleX: 2.9,
        scaleY: 0.54,
        rotation: ROTATION_90
      });
      natureTitleSprite.position.set(dRailX + 1.75, dRailY - 1.75, 0);
      axisGroup.add(natureTitleSprite);

      scene.add(axisGroup);
    }

    function setup3DInteractions(canvas) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const tooltip = document.getElementById('cubeTooltip3D');

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cubeMeshes);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          hoveredMesh = hit;

          const data = hit.userData;
          tooltip.style.display = 'block';
          tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
          tooltip.style.top = (e.clientY - rect.top + 15) + 'px';

          tooltip.innerHTML = \`
            <div style="font-weight: 700; color: #fff; margin-bottom: 2px;">\${data.type}</div>
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
              <span>Focus: \${data.locus}</span> · <span>Nature: \${data.nature}</span>
            </div>
            <div style="font-weight: 600; color: \${data.count > 0 ? '#38bdf8' : '#64748b'};">
              \${data.count > 0 ? '★ ' + data.count + ' innovation(s) recorded' : 'Empty Taxonomy Cell'}
            </div>
            \${data.count > 0 ? '<div style="font-size: 10px; color: #cbd5e1; margin-top: 4px;">Click to inspect details →</div>' : ''}
          \`;
        } else {
          hoveredMesh = null;
          tooltip.style.display = 'none';
        }
      });

      canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cubeMeshes);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          showCubeDetail(hit.userData);
        }
      });
    }

    function showCubeDetail(data) {
      const panel = document.getElementById('cubeDetailPanel3D');
      const content = document.getElementById('cubeDetailContent');
      if (!panel || !content) return;

      let html = \`
        <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
          <div style="font-size: 11px; font-weight: 700; color: var(--sky); text-transform: uppercase;">Cell Inspector</div>
          <h4 style="font-size: 16px; font-weight: 800; color: #fff; margin-top: 2px;">\${data.type}</h4>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
            <div><strong>Focus:</strong> \${data.locus}</div>
            <div><strong>Nature:</strong> \${data.nature}</div>
            <div><strong>Innovations in Cell:</strong> \${data.count}</div>
          </div>
        </div>
      \`;

      if (data.items && data.items.length > 0) {
        html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
        data.items.forEach(item => {
          html += \`
            <div style="background: rgba(9, 13, 22, 0.8); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">
              <div style="font-weight: 700; color: #fff; font-size: 13px;">\${escapeHtml(item.innovationName)}</div>
              <div style="font-size: 11px; color: #38bdf8; margin-top: 2px;">\${escapeHtml(item.companyName)} \${item.year ? '(' + item.year + ')' : ''}</div>
              \${item.description ? '<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">' + escapeHtml(item.description) + '</div>' : ''}
            </div>
          \`;
        });
        html += '</div>';
      } else {
        html += \`
          <div style="padding: 20px 0; text-align: center; color: #64748b; font-size: 12px;">
            This taxonomy cell currently has 0 innovations recorded.
          </div>
        \`;
      }

      content.innerHTML = html;
      panel.style.display = 'flex';
    }

    function closeCubeDetail() {
      const panel = document.getElementById('cubeDetailPanel3D');
      if (panel) panel.style.display = 'none';
    }

    function updateExplode(val) {
      explodeFactor = parseInt(val, 10) / 100;
      document.getElementById('explodeValueLabel').innerText = val + '%';
      build3DMatrixCubes();
      build3DMatrixAxes();
    }

    function toggleColorMode() {
      colorMode = colorMode === 'nature' ? 'type' : 'nature';
      const btn = document.getElementById('btnToggleColor');
      btn.innerText = colorMode === 'nature' ? 'Color: Nature' : 'Color: Type';
      build3DMatrixCubes();
    }

    function togglePopulatedOnly() {
      populatedOnly = !populatedOnly;
      const btn = document.getElementById('btnTogglePopulated');
      btn.innerText = populatedOnly ? 'Mode: Populated' : 'Mode: All 108';
      build3DMatrixCubes();
    }

    function toggleAutoRotate() {
      autoRotate = !autoRotate;
      const btn = document.getElementById('btnToggleRotate');
      btn.innerText = autoRotate ? 'Auto-Rotate: On' : 'Auto-Rotate: Off';
      btn.classList.toggle('active', autoRotate);
    }

    function setCameraPreset(preset) {
      ['btnPresetIso', 'btnPresetFront', 'btnPresetSide', 'btnPresetTop'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.classList.remove('active');
      });

      if (preset === 'iso') {
        document.getElementById('btnPresetIso').classList.add('active');
        camera.position.set(16, 12, 17);
        controls.target.set(0, 0, 0);
      } else if (preset === 'front') {
        document.getElementById('btnPresetFront').classList.add('active');
        camera.position.set(0, 0, 24);
        controls.target.set(0, 0, 0);
      } else if (preset === 'side') {
        document.getElementById('btnPresetSide').classList.add('active');
        camera.position.set(24, 0, 0);
        controls.target.set(0, 0, 0);
      } else if (preset === 'top') {
        document.getElementById('btnPresetTop').classList.add('active');
        camera.position.set(0, 26, 0.01);
        controls.target.set(0, 0, 0);
      }
      controls.update();
    }

    function reset3DCamera() {
      setCameraPreset('iso');
    }

    function save3DCanvasSnapshot() {
      const canvas = document.getElementById('three-viewport');
      if (canvas && renderer) {
        renderer.render(scene, camera);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = '${filenamePrefix}-3d-matrix-viewport.png';
        a.click();
      }
    }

    function onWindowResize3D() {
      const container = document.getElementById('webglContainer');
      const canvas = document.getElementById('three-viewport');
      if (!container || !renderer || !camera) return;

      const width = container.clientWidth;
      const height = 600;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    function animate3D() {
      requestAnimationFrame(animate3D);

      if (autoRotate && controls) {
        scene.rotation.y += 0.003;
      } else if (scene) {
        scene.rotation.y = 0;
      }

      if (controls) controls.update();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    }

    // Initialize 3D Graph on load
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(init3DGraph, 100);
    });
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
