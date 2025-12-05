/**
 * Google Apps Script for Evacuation Status Information
 * Fetches incident data from a Google Sheet and returns formatted HTML
 * 
 * DESIGN: Option 1 (Clean card layout with branded header + icon badges)
 * - Header: White background, La Plata blue text, subtle text shadow
 * - Icons: Pure SVG (no emojis)
 * - Road closure: Red circular "No Entry" icon
 * - Animal cards: No small/large animal icons
 */

// ========== CONFIGURATION ==========
const CONFIG = {
  CACHE_SECONDS: 15,
  SHEET_NAME: 'IncidentStatus',
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
  }
};

// ========== DESIGN SYSTEM ==========
const COLORS = {
  card: { bg: '#ffffff', border: '#e2e8f0', text: '#334155', accent: '#64748b' },
  link: '#2563eb',
  heading: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' }
};

// Brand palette from your preview
const BRAND = {
  blue: '#0b4da2',
  blueLight: '#e8f0fe',
  red: '#b3261e',
  green: '#0a7c25',
  greenLight: '#e6f7ea',
  amber: '#a68f00',
  gray: '#64748b',
  grayLight: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0'
};

const FONTS = {
  base: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
};

// ========== MAIN ENTRY POINT ==========
function doGet(e) {
  const incident = (e.parameter.incident || '').trim();
  
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
        background:${COLORS.warning.bg};
        border:1px solid ${COLORS.warning.border};
        color:${COLORS.warning.text};
        border-radius:12px;
        padding:12px 14px;
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:20px;height:20px;">${svgWarningIcon()}</div>
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">
            Notice
          </div>
        </div>
        <div style="font-size:14px;line-height:1.5;">${esc(msg)}</div>
      </div>
    </div>
  `;
}

// ========== HTML OUTPUT ==========
function buildHtml(r) {
  const C = CONFIG.COL;

  return `
  <div style="font-family:${FONTS.base};">
    <div style="
      background:#ffffff;
      border-radius:16px;
      border:1px solid rgba(0,0,0,.15);
      box-shadow:0 2px 10px rgba(0,0,0,.12);
      overflow:hidden;
    ">
      ${headerBlock()}

      <div style="padding:16px 18px 18px 18px;">
        ${sectionCard(svgLocationIcon(), BRAND.green, 'Check-in Location',
          formatSection(r[C.CHECKIN]) + addressBlock(r[C.CHECKIN_ADDR])
        )}

        ${sectionCard(svgShelterIcon(), BRAND.blue, 'Evacuation Shelters',
          formatSection(r[C.SHELTERS]) + addressBlock(r[C.SHELTERS_ADDR])
        )}

        ${sectionCard(svgRoadIcon(), BRAND.red, 'Road Closures',
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
function headerBlock() {
  return `
  <div style="
    padding:10px 18px 12px 18px;
    background:#ffffff;
    border-bottom:1px solid ${BRAND.border};
  ">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="
        width:36px;height:36px;
        border-radius:999px;
        background:${BRAND.blueLight};
        display:flex;align-items:center;justify-content:center;
        color:${BRAND.blue};
      ">
        ${svgInfoIcon()}
      </div>
      <div>
        <div style="
          font-size:11px;
          font-weight:600;
          text-transform:uppercase;
          letter-spacing:.12em;
          color:${BRAND.blue};
          opacity:.9;
          margin-bottom:2px;
        ">La Plata County OEM</div>

        <div style="
          font-size:16px;
          font-weight:700;
          line-height:1.35;
          color:${BRAND.blue};
          text-shadow:0 1px 1px rgba(15,23,42,.18);
        ">Incident Support Resources</div>
      </div>
    </div>
  </div>
  `;
}

// ========== SECTION CARDS ==========
function sectionCard(icon, accent, title, body) {
  return `
  <div style="
    background:${BRAND.grayLight};
    border:1px solid ${BRAND.border};
    border-radius:12px;
    padding:14px 16px;
    margin-bottom:16px;
  ">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="
        width:28px;height:28px;
        border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        background:${accent};
        color:#ffffff;
        flex-shrink:0;
      ">
        ${icon}
      </div>
      <h3 style="
        margin:0;
        font-size:13px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.08em;
        color:${BRAND.text};
      ">${esc(title)}</h3>
    </div>

    <div style="
      margin-left:36px;
      font-size:14px;
      line-height:1.6;
      color:${COLORS.body};
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
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <div style="
        width:28px;height:28px;
        border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        background:#7c3aed;
        color:#ffffff;
      ">${svgPawIcon()}</div>

      <h3 style="
        margin:0;
        font-size:13px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.08em;
        color:${BRAND.text};
      ">Animal Evacuation</h3>
    </div>

    <div style="margin-left:36px;display:grid;gap:10px;">
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
      letter-spacing:.08em;
      color:${BRAND.textMuted};
      margin-bottom:4px;
    ">${esc(label)}</div>

    <div style="font-size:14px;line-height:1.5;color:${COLORS.body};">
      ${formatSection(value)}
      ${addressBlock(addr)}
    </div>
  </div>
  `;
}

// ========== CONTENT HELPERS ==========
function roadContent(val) {
  val = str(val);
  if (!val) return `<span style="color:${COLORS.muted};font-style:italic;">No road closures reported.</span>`;

  const list = val.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (list.length === 1) return `<div>${esc(list[0])}</div>`;

  return `<ul style="margin:0;padding-left:20px;list-style:disc;">
    ${list.map(l => `<li style="margin-bottom:4px;">${esc(l)}</li>`).join('')}
  </ul>`;
}

function formatSection(raw) {
  raw = str(raw);
  if (!raw) return `<span style="color:${COLORS.muted};font-style:italic;">No information available.</span>`;

  const lines = raw.split(/\n+/);
  const name = lines.shift().trim();
  const rest = lines.join('\n').trim();

  return `
    ${name ? `<div style="font-weight:600;color:${COLORS.heading};">${esc(name)}</div>` : ''}
    ${rest ? `<div style="margin-top:4px;color:${COLORS.body};">${esc(rest).replace(/\n/g,'<br>')}</div>` : ''}
  `;
}

function addressBlock(list) {
  list = directionsList(list);
  if (!list) return '';

  return `
  <div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(0,0,0,.1);">
    <div style="
      font-size:11px;
      font-weight:600;
      color:${COLORS.muted};
      text-transform:uppercase;
      letter-spacing:.05em;
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

  return `<div style="display:flex;flex-wrap:wrap;">
    ${items.map(a => `
      <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}"
        target="_blank" rel="noopener noreferrer" style="
          display:inline-flex;
          align-items:center;
          padding:8px 12px;
          margin:4px 4px 4px 0;
          border:1px solid ${COLORS.link};
          border-radius:6px;
          color:${COLORS.link};
          font-size:13px;
          font-weight:500;
          text-decoration:none;
          box-shadow:0 1px 2px rgba(0,0,0,.05);
        ">
        ${esc(a)}
      </a>
    `).join('')}
  </div>`;
}

// ========== SVG ICON HELPERS ==========
function svgInfoIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>`;
}

function svgLocationIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>`;
}

function svgShelterIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </svg>`;
}

// NEW Road icon: Red "No Entry" sign
function svgRoadIcon() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="${BRAND.red}" />
    <rect x="6" y="11" width="12" height="2" fill="#ffffff" rx="1" />
  </svg>
  `;
}

function svgPawIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
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
function str(v) { return String(v || '').trim(); }
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
