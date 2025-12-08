/**
 * Google Apps Script for Evacuation Status Information
 * Fetches incident data from a Google Sheet and returns formatted HTML
 * 
 * ENDPOINTS:
 * - ?incident=Name     → Returns incident support resources
 * - ?type=past         → Returns past incidents table HTML
 * 
 * DESIGN: Matches ReadyLaPlata site design system
 */

// ========== CONFIGURATION ==========
const CONFIG = {
  CACHE_SECONDS: 15,
  CACHE_SECONDS_PAST: 300, // 5 minutes for past incidents
  SHEET_NAME: 'IncidentStatus',
  SHEET_PAST: 'PastIncidents',
  COL: {
    INCIDENT: 0,
    STATUS_LINK: 1,
    CHECKIN: 2,
    CHECKIN_ADDR: 3,
    SHELTERS: 4,
    SHELTERS_ADDR: 5,
    ROAD: 6,
    SMALL: 7,
    SMALL_ADDR: 8,
    LARGE: 9,
    LARGE_ADDR: 10
  },
  COL_PAST: {
    NAME: 0,
    START_DATE: 1,
    LIFTED_DATE: 2
  }
};

// ========== DESIGN SYSTEM - MATCHED TO SITE ==========
const BRAND = {
  blue: '#0b4da2',
  blueLight: '#e6f0ff',
  red: '#b3261e',
  redLight: '#ffd6d6',
  green: '#0a7c25',
  greenLight: '#41f56e',
  amber: '#a68f00',
  purple: '#7c3aed',
  gray: '#64748b',
  grayLight: '#fafafa',
  text: '#000',
  textHeading: '#0f172a',
  textMuted: '#6e6e6e',
  border: 'rgba(0,0,0,0.15)',
  borderLight: 'rgba(0,0,0,0.08)'
};

const FONTS = {
  base: 'Arial, sans-serif'
};

// ========== MAIN ENTRY POINT ==========
function doGet(e) {
  const incident = (e.parameter.incident || '').trim();
  const type = (e.parameter.type || '').trim().toLowerCase();
  
  // Handle past incidents request
  if (type === 'past') {
    return getPastIncidents();
  }
  
  // Handle incident request
  if (!incident) return htmlResponse('<div></div>');

  const cache = CacheService.getScriptCache();
  const key = 'inc_' + incident.toLowerCase().replace(/\W+/g, '_');
  const cached = cache.get(key);
  if (cached) return htmlResponse(cached);

  try {
    const html = generateIncidentHtml(incident);
    cache.put(key, html, CONFIG.CACHE_SECONDS);
    return htmlResponse(html);
  } catch (err) {
    Logger.log(err);
    return htmlResponse(errorCard('An error occurred while loading incident data.'));
  }
}

function htmlResponse(content) {
  return ContentService.createTextOutput(content)
    .setMimeType(ContentService.MimeType.HTML);
}

// ========== PAST INCIDENTS ==========
function getPastIncidents() {
  const cache = CacheService.getScriptCache();
  const key = 'past_incidents';
  const cached = cache.get(key);
  if (cached) return htmlResponse(cached);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_PAST);
    if (!sheet) return htmlResponse('<div>No past incidents data available.</div>');

    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return htmlResponse('<div>No past incidents recorded.</div>');

    const C = CONFIG.COL_PAST;
    const incidents = rows.slice(1)
      .filter(r => str(r[C.NAME]))
      .map(r => ({
        name: str(r[C.NAME]),
        startDate: formatDate(r[C.START_DATE]),
        liftedDate: formatDate(r[C.LIFTED_DATE])
      }))
      .sort((a, b) => {
        // Sort by most recent first (by lifted date if available, else start date)
        const dateA = parseDate(b.liftedDate) || parseDate(b.startDate) || 0;
        const dateB = parseDate(a.liftedDate) || parseDate(a.startDate) || 0;
        return dateA - dateB;
      });

    if (!incidents.length) return htmlResponse('<div>No past incidents recorded.</div>');

    const html = buildPastIncidentsHtml(incidents);
    cache.put(key, html, CONFIG.CACHE_SECONDS_PAST);
    return htmlResponse(html);
  } catch (err) {
    Logger.log(err);
    return htmlResponse('<div>Error loading past incidents.</div>');
  }
}

function buildPastIncidentsHtml(incidents) {
  const rows = incidents.map(inc => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.borderLight};font-weight:600;color:${BRAND.textHeading};">
        ${esc(inc.name)}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.borderLight};color:${BRAND.gray};text-align:center;">
        ${esc(inc.startDate) || '—'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.borderLight};color:${BRAND.gray};text-align:center;">
        ${esc(inc.liftedDate) || '—'}
      </td>
    </tr>
  `).join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-family:${FONTS.base};font-size:14px;">
      <thead>
        <tr style="background:${BRAND.grayLight};">
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.textMuted};border-bottom:2px solid ${BRAND.border};">
            Incident Name
          </th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.textMuted};border-bottom:2px solid ${BRAND.border};">
            Start Date
          </th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.textMuted};border-bottom:2px solid ${BRAND.border};">
            Evacuations Lifted
          </th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return str(val);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getTime();
}

// ========== DATA FETCH ==========
function generateIncidentHtml(incident) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return errorCard(`Configuration error: sheet "${CONFIG.SHEET_NAME}" not found.`);

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return errorCard('No data available.');

  const match = rows.slice(1).find(r =>
    String(r[CONFIG.COL.INCIDENT] || '').trim().toLowerCase() === incident.toLowerCase()
  );

  if (!match) return errorCard(`No data found for incident: ${esc(incident)}`);

  return buildHtml(match);
}

// ========== ERROR CARD ==========
function errorCard(msg) {
  return `
    <div style="font-family:${FONTS.base};">
      <div style="
        background:#fffbeb;
        border:1px solid #f59e0b;
        color:#92400e;
        border-radius:12px;
        padding:12px 16px;
        box-shadow:0 1px 3px rgba(0,0,0,0.12);
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:20px;height:20px;">${svgWarningIcon()}</div>
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">
            Notice
          </div>
        </div>
        <div style="font-size:14px;line-height:1.6;">${esc(msg)}</div>
      </div>
    </div>
  `;
}

// ========== HTML OUTPUT ==========
function buildHtml(r) {
  const C = CONFIG.COL;

  return `
  <style>
    .status-btn:hover,
    .dir-btn:hover {
      background: ${BRAND.blue} !important;
      color: #fff !important;
      box-shadow: 0 0 0 2px rgba(11,77,162,0.25) !important;
    }
  </style>
  <div style="font-family:${FONTS.base};">
    <div style="
      background:#ffffff;
      border-radius:14px;
      border:1px solid ${BRAND.border};
      box-shadow:0 2px 10px rgba(0,0,0,0.25);
      overflow:hidden;
    ">
      ${headerBlock(str(r[C.STATUS_LINK]))}

      <div style="padding:16px 18px 18px 18px;">
        ${sectionCard(svgLocationIcon(), 'Check-in Location',
          formatSection(r[C.CHECKIN]) + addressBlock(r[C.CHECKIN_ADDR])
        )}

        ${sectionCard(svgShelterIcon(), 'Evacuation Shelters',
          formatSection(r[C.SHELTERS]) + addressBlock(r[C.SHELTERS_ADDR])
        )}

        ${sectionCard(svgRoadIcon(), 'Road Closures',
          roadContent(r[C.ROAD])
        )}

        ${animalSectionCard(
          r[C.SMALL], r[C.SMALL_ADDR],
          r[C.LARGE], r[C.LARGE_ADDR]
        )}
      </div>
    </div>
  </div>
  `;
}

// ========== HEADER BLOCK ==========
function headerBlock(statusLink) {
  const normalizedLink = normalizeUrl(statusLink);
  return `
  <div style="
    padding:14px 18px;
    background:#ffffff;
    border-bottom:1px solid ${BRAND.borderLight};
  ">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <div style="
          width:36px;height:36px;
          border-radius:50%;
          background:#f8fafc;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        ">
          ${svgInfoIcon()}
        </div>
        <div style="
          font-size:17px;
          font-weight:700;
          line-height:1.3;
          color:${BRAND.text};
        ">Incident Support Resources</div>
      </div>
      ${normalizedLink ? `
      <a href="${normalizedLink}" target="_blank" rel="noopener noreferrer" class="status-btn" style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:8px 16px;
        border:2px solid ${BRAND.blue};
        border-radius:8px;
        background:#fff;
        color:${BRAND.blue};
        font-size:14px;
        font-weight:600;
        text-decoration:none;
        white-space:nowrap;
        transition:background 0.2s, color 0.2s, box-shadow 0.2s;
        flex-shrink:0;
      ">View Status Update</a>
      ` : ''}
    </div>
  </div>
  `;
}

// ========== SECTION CARDS ==========
function sectionCard(icon, title, body) {
  return `
  <div style="
    background:${BRAND.grayLight};
    border:1px solid ${BRAND.border};
    border-radius:12px;
    padding:14px 16px;
    margin-bottom:12px;
  ">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div style="
        width:32px;height:32px;
        display:flex;align-items:center;justify-content:center;
        color:#000;
        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        flex-shrink:0;
      ">
        ${icon}
      </div>
      <h3 style="
        margin:0;
        font-size:14px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:0.08em;
        color:${BRAND.text};
      ">${esc(title)}</h3>
    </div>

    <div style="
      margin-left:42px;
      font-size:14px;
      line-height:1.6;
      color:#334155;
    ">
      ${body}
    </div>
  </div>
  `;
}

// ========== ANIMAL CARD ==========
function animalSectionCard(small, smallAddr, large, largeAddr) {
  return `
  <div style="
    background:${BRAND.grayLight};
    border:1px solid ${BRAND.border};
    border-radius:12px;
    padding:14px 16px;
  ">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      <div style="
        width:32px;height:32px;
        display:flex;align-items:center;justify-content:center;
        color:#000;
        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        flex-shrink:0;
      ">${svgPawIcon()}</div>

      <h3 style="
        margin:0;
        font-size:14px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:0.08em;
        color:${BRAND.text};
      ">Animal Evacuation</h3>
    </div>

    <div style="margin-left:42px;display:grid;gap:10px;">
      ${animalSubCard('Small Animals', small, smallAddr)}
      ${animalSubCard('Large Animals', large, largeAddr)}
    </div>
  </div>
  `;
}

function animalSubCard(label, value, addr) {
  return `
  <div style="
    background:#ffffff;
    border:1px solid ${BRAND.border};
    border-radius:8px;
    padding:10px 12px;
  ">
    <div style="
      font-size:11px;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:0.08em;
      color:${BRAND.textMuted};
      margin-bottom:4px;
    ">${esc(label)}</div>

    <div style="font-size:14px;line-height:1.6;color:#334155;">
      ${formatSection(value)}
      ${addressBlock(addr)}
    </div>
  </div>
  `;
}

// ========== CONTENT HELPERS ==========
function roadContent(val) {
  val = str(val);
  if (!val) return `<span style="color:#64748b;font-style:italic;">No road closures reported.</span>`;

  const list = val.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (list.length === 1) return `<div>${esc(list[0])}</div>`;

  return `<ul style="margin:0;padding-left:20px;list-style:disc;">
    ${list.map(l => `<li style="margin-bottom:4px;">${esc(l)}</li>`).join('')}
  </ul>`;
}

function formatSection(raw) {
  raw = str(raw);
  if (!raw) return `<span style="color:#64748b;font-style:italic;">No information available.</span>`;

  const lines = raw.split(/\n+/);
  const name = lines.shift().trim();
  const rest = lines.join('\n').trim();

  return `
    ${name ? `<div style="font-weight:700;color:${BRAND.textHeading};">${esc(name)}</div>` : ''}
    ${rest ? `<div style="margin-top:4px;color:#334155;">${esc(rest).replace(/\n/g,'<br>')}</div>` : ''}
  `;
}

function addressBlock(list) {
  list = directionsList(list);
  if (!list) return '';

  return `
  <div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(0,0,0,0.1);">
    <div style="
      font-size:11px;
      font-weight:600;
      color:#64748b;
      text-transform:uppercase;
      letter-spacing:0.05em;
      margin-bottom:6px;
    ">Directions</div>
    ${list}
  </div>
  `;
}

function directionsList(addr) {
  addr = str(addr);
  if (!addr) return '';

  const items = addr.split(/[\n;]+/).map(a => a.trim()).filter(Boolean);

  return `<div style="display:flex;flex-wrap:wrap;gap:4px;">
    ${items.map(a => `
      <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}"
        target="_blank" rel="noopener noreferrer" class="dir-btn" style="
          display:inline-flex;
          align-items:center;
          padding:6px 10px;
          border:2px solid ${BRAND.blue};
          border-radius:8px;
          background:#fff;
          color:${BRAND.blue};
          font-size:13px;
          font-weight:600;
          text-decoration:none;
          box-shadow:0 1px 2px rgba(0,0,0,0.05);
          transition:background 0.2s, color 0.2s, box-shadow 0.2s;
        ">
        ${esc(a)}
      </a>
    `).join('')}
  </div>`;
}

// ========== SVG ICON HELPERS ==========
function svgInfoIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#000" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>`;
}

function svgLocationIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#000" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>`;
}

function svgShelterIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#000" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </svg>`;
}

function svgRoadIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#000" />
    <rect x="6" y="11" width="12" height="2" fill="#ffffff" rx="1" />
  </svg>`;
}

function svgPawIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#000">
    <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
  </svg>`;
}

function svgWarningIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z"/>
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4"/>
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 17h.01"/>
  </svg>`;
}

// ========== UTILITIES ==========
function normalizeUrl(url) {
  url = str(url);
  if (!url) return '';
  // Already has a protocol
  if (/^https?:\/\//i.test(url)) return url;
  // Has protocol without slashes (e.g., "https:example.com")
  if (/^https?:/i.test(url)) return url.replace(/^(https?:)/i, '$1//');
  // No protocol - add https://
  return 'https://' + url;
}

function str(v) { return String(v || '').trim(); }
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
