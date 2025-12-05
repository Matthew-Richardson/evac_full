## 1. Big-picture overview

Your evacuation viewer is made of four main pieces:

1. **`info.html` – “Evacuation Information Home”** 

   * Shows the logo, call center, and a list of **active incidents** as clickable chips.
   * Below that, it shows **static explanatory cards** (Ready/Set/Go, CodeRED info, etc.).
   * When you click an incident chip, you go to `evac.html?incident=IncidentName`.

2. **`evac.html` – “Live Incident Map + Evac Info”** 

   * Shows the same header and incident strip, but adds:

     * The **ArcGIS web map** (with Search + Fullscreen widgets).
     * A **SET / GO panel** that lists zones under each status.
     * A **status panel** that pulls formatted HTML from your Google Apps Script.

3. **`shared-styles.css` – Shared visual design** 

   * One stylesheet used by both HTML files to keep layout, typography, chips, cards, and status content visually consistent.

4. **Google Apps Script – Sheet-backed status HTML (your script)**

   * Takes `?incident=...`, looks up a row for that incident in the **IncidentStatus** sheet, and returns **formatted HTML** for:

     * Status update link
     * Check-in location
     * Evac shelters
     * Road closures
     * Animal (small / large) evacuation info
   * `evac.html` injects this HTML directly into the page.

---

## 2. `shared-styles.css` – styling and layout

**Goal:** Provide one consistent design system for both pages: layout, typography, cards, chips, and status HTML. 

### 2.1 Global layout & typography

* `html, body`

  * Remove default margins/padding.
  * Fix height/width to 100% so flex layouts can stretch.
  * Set base font (Arial, sans-serif), background grey, base font size, and text color.
  * Disable horizontal scroll with `overflow-x: hidden`.

* `@media (max-width: 600px)`

  * Slightly reduce font size on small screens to fit more comfortably.

* `.page-shell`

  * Main flex container that stacks the header card and the lower content vertically and stretches to full viewport height.

### 2.2 Map wrapper & card

* `.map-wrapper`

  * Centers the map card, constrains it to 900px, and adds padding.

* `.map-card`

  * White rounded card with border and drop shadow.
  * Holds the logo, incident bar, map (in evac.html), and legend.

### 2.3 Brand block (logo + title + call center)

* `.card-brand`

  * Vertically stacked block for the logo, site title, and call center info.

* `.header-logo`

  * Responsive logo with a subtle drop shadow.

* `.site-title`

  * Small grey subtitle: “ReadyLaPlata — La Plata County Evacuation Viewer.”

* `.call-center` and children

  * Boxed call center area with:

    * Label (“Call Center”) in small uppercase font.
    * Phone number link styled as a prominent number (click-to-call on mobile).

* `.card-divider`

  * Thin horizontal line used to separate header, incident strip, and map sections.

### 2.4 Incident strip & chips

This styling is used on both pages (`info.html` and `evac.html`). 

* `.incident-strip`

  * Container for “Active incidents” label, optional info/home button, tip text, and chips.

* `.incident-strip-top`

  * Flex row that holds:

    * Left: “Active incidents” label + count badge
    * Right: the info/home button (map page only)

* `.incident-label` + `.incident-count-badge`

  * Red label and pill showing the **number of active incidents**.

* `.info-link`, `.info-icon-home`, `.info-label`

  * Button that links between pages:

    * On **map page**: takes you to info homepage.
    * Hidden label on mobile (just the house icon) to save space.

* `.incident-chips` & `.incident-chip`

  * Container and chip styling for each incident name:

    * Rounded pill with hover effects.
    * `.incident-chip-dot` adds a small colored dot to the left.
    * `.incident-chip.active` shows which incident is currently selected in `evac.html`.

* `.incident-none`

  * Message when there are no active incidents.

### 2.5 Map container & legend (map page only)

* `#viewDiv`

  * Container where the ArcGIS `MapView` is injected.

* `.map-key-merged` and child classes

  * Creates a simple “Map Key” row under the map:

    * Road closure icon (red circle with white bar).
    * Information icon (blue circle with “i”).
    * Special warning icon (rotated yellow square with “!”).

### 2.6 SET / GO evac row (map page)

* `.evac-row`

  * Flex container for the two main cards:

    * “SET – Pre-Evacuation”
    * “GO – Evacuate Now”

* `.evac-box`, `.evac-box-set`, `.evac-box-go`

  * Shared card styles + special border/glow for SET and GO boxes:

    * SET: yellow border / glow.
    * GO: green border / animated glow (pulses via `@keyframes goPulse`).

* `.evac-title`, `.evac-body`, `.evac-zones`, `.zone-chip`, `.no-zones-chip`, `.evac-note`

  * Title style for the card.
  * Body text layout.
  * Zone chips showing zone names for each status.
  * Italicized note summarizing what SET/GO means.

### 2.7 Incident panel & status HTML

Used primarily in `evac.html` for the status panel and in `info.html` for general content layout. 

* `.incident-panel`

  * Wrapper for whatever status content is currently loaded/displayed.

* `.status-html` and nested styles

  * Resets fonts, sizes, colors inside the HTML returned by Apps Script so it matches your site.
  * Ensures links are blue and bold, with underlines.
  * Styles `.status-header` / `.card-header` classes as pill-shaped blue headings.
  * `.status-card` etc. get rounded white cards with shadows and borders.

* `.status-timestamp` + `.source-label`

  * Small timestamp footer appended after status content:

    * Shows “Last loaded: [datetime] • Source: La Plata County OEM”.

### 2.8 Homepage content (info page)

* `.home-wrapper`, `.home-card`, and variants (`home-card-info`, `home-card-ready`, `home-card-set`, `home-card-go`, `home-card-codered`)

  * Different background colors and border treatments for the explanatory cards on info.html:

    * OEM info, Ready guidance, SET/GO definitions, CodeRED information.

* `.home-card-title`, `.home-small`

  * Title and body text styling for those cards.

### 2.9 Pill buttons (info page)

* `.primary-pill`, `.secondary-pill`

  * Rounded “pill” buttons used for CodeRED signup, text ‘LPCOEM’, etc.
  * Primary = solid blue, secondary = white with blue border.

---

## 3. `info.html` – Evac info homepage

**Role:** Landing page where users see:

* Who is responsible (LPCOEM + call center).
* How the Ready/Set/Go system works.
* A list of **active incidents** as selectable chips. 

### 3.1 Structure

* `<head>`

  * Sets page title and viewport.
  * Includes `shared-styles.css`.

* `<body>`

  * `.page-shell` → `.map-wrapper` → `.map-card`

  * **Header block**:

    * Logo, title, call center (re-using shared CSS).

  * **Incident menu**:

    * “Active incidents” label with count badge.
    * Tip text: “Tap an incident below to view the evacuation map.”
    * `#incidentChips` for dynamically inserted chips.
    * `#noIncidentsMsg` placeholder when there are no active incidents.

  * `<main>` → `.incident-panel` → `.home-wrapper`

    * Several `.home-card` sections:

      * LPCOEM / Ready, Set, Go explanation.
      * Ready advice (apps, alerts, planning).
      * SET & GO quick definitions.
      * CodeRED explanation and mobile signup.

### 3.2 Script logic (bottom `<script>` block)

**Goal:** Build the list of incident chips based on the evacuation zones feature layer.

1. **Config constants**

   * `INCIDENT_MAP_URL` – where to send users when they click a chip (`evac.html`).
   * `incidentLayerUrl` – ArcGIS query endpoint for `LPC_Evac_Zones_View`.
   * `incidentFieldName` – field that stores incident names.

2. **DOM references**

   * `chipsEl` – the container for incident chips.
   * `countBadge` – shows how many incidents exist.
   * `noIncidentsMsg` – fallback message if none.

3. **`getIncidentFromUrl()`**

   * Reads `?incident=` or `?Incident=` from the current URL.
   * Used purely to move that incident near the top of the chip list, so the user sees “their” incident first.

4. **`INCIDENT` constant**

   * Normalized current incident name (or `null`).

5. **`loadIncidentMenu()`**

   * Builds URLSearchParams for the ArcGIS query:

     * `where = 1=1` → all rows.
     * `outFields = incident` → get incident field only.
     * `returnDistinctValues = true` → unique incident names.
   * Calls `fetch` on the layer URL.

   Inside `.then(data)`:

   * Extracts `data.features`.
   * For each feature, grabs `attributes[incidentFieldName]` and:

     * Trims it.
     * De-duplicates via a lowercase `Set`.
   * Optional sorting:

     * If `INCIDENT` is set, that incident is sorted to the top.
     * Everything else sorted alphabetically (case-insensitive).
   * Updates count badge with length.
   * If `incidentNames` is empty → show `noIncidentsMsg`.
   * Otherwise, for each incident name:

     * Creates a `<button class="incident-chip">` with a dot + name text.
     * Sets `onclick` so it builds a URL pointing to `evac.html?incident=<name>` and navigates there.

6. **Error handling**

   * Logs errors to console.
   * Sets badge to “0” and shows `noIncidentsMsg` when the fetch fails.

7. **Initialization**

   * `loadIncidentMenu();` is called once to populate the list on page load.

---

## 4. `evac.html` – incident map + SET/GO + status

**Role:** Incident-specific view that shows:

* The **web map**, focused on the incident.
* **SET and GO zone lists** for the selected incident.
* A **live status panel** generated from your Google Sheet (via Apps Script). 

### 4.1 Structure

* `<head>`

  * Includes `shared-styles.css`.
  * Includes ArcGIS Maps SDK CSS and JS (`https://js.arcgis.com/4.31/`).

* `<body>`

  * Same `.page-shell` / `.map-card` structure and header.

  * Incident strip:

    * Left: Active incidents + count.
    * Right: “Evacuation Information” house button, which links back to `info.html`.

  * `#viewDiv` – where the ArcGIS `MapView` is rendered.

  * Map key (road closure, information, special warning icons).

  * `<main>`

    * `#evacRow` – container for SET/GO cards (“Loading evacuation information…” initially).
    * `.incident-panel` → `#incident-panel` – “Loading incident status…” initially, later replaced by HTML from Apps Script.

### 4.2 Config & Incident name

Top of the script:

* `webmapId` – ArcGIS webmap ID for your incident map.
* `incidentLayerUrl` & `incidentFieldName` – same as homepage, used here for querying.
* `getIncidentFromUrl()` – same logic as in info.html.
* `INCIDENT` – normalized incident name or `null`.

### 4.3 Status label/values and endpoints

* `STATUS_LABELS`, `STATUS_COLORS`, `STATUS_TEXT`

  * Map internal SET/GO codes to human-readable text plus background colors and explanatory sentences.

* `STATUS_VALUES`

  * How SET/GO are stored in the layer’s `STATUS` field (e.g. `"Set"`, `"Go"`).

* `ARCGIS_URL`

  * Query endpoint for the evac zones layer.

* `STATUS_BASE_URL`

  * URL of the deployed Apps Script web app that returns status HTML for a given incident.

### 4.4 Helper functions (non-map)

* `escapeForQuery(str)`

  * Escapes single quotes for safe use in ArcGIS SQL `where` clauses.

* `showHelp()`

  * If no `incident` parameter is provided, this fills:

    * `#evacRow` with a card explaining how to use `?incident=...` in the URL.
    * `#incident-panel` with a similar help message.

* `buildBox(statusCode, features)`

  * Builds one SET or GO card as HTML:

    * Title = from `STATUS_LABELS`.
    * Background color = from `STATUS_COLORS`.
    * Body text = from `STATUS_TEXT`.
    * Zone chips = all zone names from `features[].attributes.zonename`.
    * When no features present, shows “No SET/GO zones.”
    * Adds extra CSS class (`evac-box-set` or `evac-box-go`) for styling.

* `showError(message)`

  * Puts a yellow “Error” card into `#evacRow` when the request fails.

### 4.5 Loading SET / GO zones from ArcGIS

`loadEvacuationZones()`:

1. If there is **no** `INCIDENT`:

   * Calls `showHelp()` and returns.

2. Builds `where` clause like:
   `incident='East Canyon' AND STATUS IN ('Set','Go')`, using `escapeForQuery`.

3. Creates query params:

   * `where`, `outFields=*`, `f=json`, `returnGeometry=false`.

4. `fetch(ARCGIS_URL + "?" + queryParams)` → parse JSON.

5. If no features:

   * Show “No data” card for that incident.

6. Otherwise:

   * Filter to SET rows and GO rows separately.
   * Call `buildBox("SET", setFeatures)` and `buildBox("GO", goFeatures)` and inject both into `#evacRow`.

### 4.6 Loading status HTML from Google Apps Script

`loadIncidentStatus(incidentName)`:

1. If `incidentName` is empty, just return.

2. Builds URL:
   `STATUS_BASE_URL + "?incident=" + encodeURIComponent(incidentName)`.

3. `fetch(url)` → `text()` (this is raw HTML).

4. Inserts that HTML into `#incident-panel` as:
   `<div class="status-html">[returned HTML]</div>`
   (so your CSS can style it).

5. Creates a `.status-timestamp` element with:

   * `Last loaded: [local datetime] • Source: La Plata County OEM`
   * Appends it under the status content.

6. On error, logs to console and shows a generic error message.

### 4.7 Map & incident chips (ArcGIS Maps SDK block)

The `require([...], function (...) { ... })` block:

1. **DOM references & navigation:**

   * Gets the info button and incident chips container.
   * Clicking the info button sends you back to `info.html`.

2. **Create `WebMap` and `MapView`:**

   * `WebMap` uses the `webmapId`.
   * `MapView` attaches to `#viewDiv`.

3. **Mobile scroll behavior:**

   * If viewport is narrow (< 700px), disable:

     * Mouse wheel zoom.
     * Browser touch pan (so page scroll is easier).
   * Keep pinch zoom enabled.

4. **Hidden `FeatureLayer` for queries:**

   * Adds `incidentLayer` (your evac layer) to the map but keeps it invisible and hidden in layer list.
   * Used for:

     * Querying distinct incident names.
     * Getting extents to zoom the map to an incident.

5. **`zoomToIncident(name)` helper:**

   * Builds `where` = `incident = '<name>'`.
   * Calls `incidentLayer.queryExtent`.
   * If extent exists, `view.goTo(extent.expand(1.2))` for nice padding.

6. **`view.when()` chain:**

   * Once view is ready:

     * Adds a **Search widget** to the top-right of the map.
     * Adds a **Fullscreen widget** to the top-right.
     * Waits for `incidentLayer.when()`.

   * Then queries distinct incident names:

     * `where: 1=1`, `outFields: [incidentFieldName]`, `returnDistinctValues: true`.

   * Collects incident names into an array.

   * Updates count badge.

   * Shows “No active incidents” if list is empty.

   * Sorts incidents:

     * If `INCIDENT` is present, push that name to the top.
     * Otherwise alphabetical.

   * For each name:

     * Creates a chip similar to `info.html`.
     * `data-incident` attribute holds the exact name.
     * Clicking the chip:

       * Updates the current page URL with `?incident=<name>` and reloads (so both the map and the status/SET/GO sections update).

   * After chips are built:

     * If `INCIDENT` is set, finds the matching chip, adds `.active`, and calls `zoomToIncident(INCIDENT)`.

---

## 5. Google Apps Script – `IncidentStatus` HTML service

**Role:** Turn a row in your **IncidentStatus** Google Sheet into a block of HTML that `evac.html` can display as the incident status section.

### 5.1 Top-level config

```js
/**
 * Google Apps Script for Evacuation Status Information
 * Fetches incident data from a Google Sheet and returns formatted HTML
 */

// Configuration constants
const CACHE_DURATION_SECONDS = 15;
const SHEET_NAME = 'IncidentStatus';
```

* **Caching:** Responses for each incident are cached for 15 seconds to reduce load time and Sheet reads.
* **SHEET_NAME:** Name of the tab that holds your incident data.

```js
// Column indices (A=0, B=1, C=2, etc.)
const COL = {
  INCIDENT: 0,         // Column A
  STATUS_LINK: 1,      // Column B
  CHECKIN: 2,          // Column C
  CHECKIN_ADDR: 3,     // Column D
  SHELTERS: 4,         // Column E
  SHELTERS_ADDR: 5,    // Column F
  ROAD: 6,             // Column G
  SMALL: 7,            // Column H
  SMALL_ADDR: 8,       // Column I
  LARGE: 9,            // Column J
  LARGE_ADDR: 10       // Column K
};
```

Each constant maps a conceptual field (incident name, check-in details, shelters, etc.) to a 0-based index in the row.

### 5.2 `doGet(e)` – main entry point

```js
function doGet(e) {
  const incident = (e.parameter.incident || '').trim();

  if (!incident) {
    return ContentService
      .createTextOutput('<div></div>')
      .setMimeType(ContentService.MimeType.HTML);
  }

  // Check cache first
  const cachedResponse = getCachedResponse(incident);
  if (cachedResponse) {
    return ContentService
      .createTextOutput(cachedResponse)
      .setMimeType(ContentService.MimeType.HTML);
  }

  // Fetch fresh data
  try {
    const html = generateIncidentHtml(incident);
    
    // Cache the result
    cacheResponse(incident, html);
    
    return ContentService
      .createTextOutput(html)
      .setMimeType(ContentService.MimeType.HTML);
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService
      .createTextOutput('<div>An error occurred while loading incident data.</div>')
      .setMimeType(ContentService.MimeType.HTML);
  }
}
```

What it does:

1. Reads `incident` from the URL query string.
2. If missing → returns an empty `<div>` (your front-end then shows its own help message).
3. Asks `getCachedResponse` if there’s a cached HTML string for this incident.
4. If cached → returns it immediately.
5. Otherwise:

   * Calls `generateIncidentHtml(incident)`.
   * Caches the result with `cacheResponse`.
   * Returns the HTML.
6. On error, logs to Apps Script logs and returns a generic error `<div>`.

### 5.3 Caching helpers

```js
function getCachedResponse(incident) {
  const cache = CacheService.getScriptCache();
  const cacheKey = generateCacheKey(incident);
  return cache.get(cacheKey);
}

function cacheResponse(incident, html) {
  const cache = CacheService.getScriptCache();
  const cacheKey = generateCacheKey(incident);
  cache.put(cacheKey, html, CACHE_DURATION_SECONDS);
}

function generateCacheKey(incident) {
  return 'incident_' + encodeURIComponent(incident.toLowerCase());
}
```

* Uses `CacheService.getScriptCache()` to store HTML keyed by incident name.
* Incident is lowercased and encoded to avoid key collisions and issues with special characters.

### 5.4 Generating HTML from the sheet

```js
function generateIncidentHtml(incident) {
  const sheet = getSheet();
  if (!sheet) {
    return '<div>Config error: sheet "' + SHEET_NAME + '" not found.</div>';
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return '<div>No data available.</div>';
  }

  // Skip header row, start from row 2 (index 1)
  const rows = data.slice(1);
  const matchRow = findIncidentRow(rows, incident);
  
  if (!matchRow) {
    return '<div>No data found for incident: ' + escapeHtml(incident) + '</div>';
  }

  return buildIncidentHtml(matchRow, incident);
}
```

* Gets all values from the `IncidentStatus` sheet.
* Skips header row and searches for a row where the incident column (COL.INCIDENT) matches the requested incident (case-insensitive).
* If found → passes the row to `buildIncidentHtml`.
* If not found → returns a “No data found for incident” message.

### 5.5 Accessing the sheet

```js
function getSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheetByName(SHEET_NAME);
  } catch (error) {
    Logger.log('Error accessing sheet: ' + error.toString());
    return null;
  }
}
```

* Assumes the script is bound to the spreadsheet.
* Gracefully logs and returns `null` if something goes wrong.

### 5.6 Finding the incident row

```js
function findIncidentRow(rows, incident) {
  const incidentLower = incident.toLowerCase();
  
  for (let i = 0; i < rows.length; i++) {
    const rowIncident = String(rows[i][COL.INCIDENT] || '').trim();
    if (rowIncident.toLowerCase() === incidentLower) {
      return rows[i];
    }
  }
  
  return null;
}
```

* Loops through each row (excluding header).
* Returns the first row where “Incident” matches the requested incident (case-insensitive).

### 5.7 Building the incident HTML card(s)

```js
function buildIncidentHtml(row, incident) {
  // Extract data from row using column indices
  const rawStatusLink = String(row[COL.STATUS_LINK] || '').trim();
  const checkin = String(row[COL.CHECKIN] || '');
  const shelters = String(row[COL.SHELTERS] || '');
  const roadClosures = String(row[COL.ROAD] || '');
  const smallAnimals = String(row[COL.SMALL] || '');
  const largeAnimals = String(row[COL.LARGE] || '');
  
  const checkinAddress = String(row[COL.CHECKIN_ADDR] || '');
  const sheltersAddress = String(row[COL.SHELTERS_ADDR] || '');
  const smallAddr = String(row[COL.SMALL_ADDR] || '');
  const largeAddr = String(row[COL.LARGE_ADDR] || '');
```

* Grabs each relevant field from the row, falling back to empty strings.

```js
  // Normalize status link
  const statusLink = normalizeUrl(rawStatusLink);

  const statusUpdateHtml = statusLink
    ? '<strong>Status updates for this incident:</strong> ' +
      '<a href="' + escapeHtml(statusLink) + '" target="_blank" rel="noopener noreferrer">View the latest updates</a>'
    : '<strong>Status updates for this incident:</strong> No link available.';
```

* If there’s a `STATUS_LINK`, ensures it has a protocol and makes it a clickable “View the latest updates” link.
* If not, shows a fallback message.

```js
  // Build sections
  const checkinSection = buildMiniCard(
    'Check-in Location',
    formatSectionText(checkin) + buildAddressSection(checkinAddress)
  );

  const sheltersSection = buildMiniCard(
    'Evacuation Shelters',
    formatSectionText(shelters) + buildAddressSection(sheltersAddress)
  );

  const roadSection = buildMiniCard(
    'Road Closures',
    '<div style="color:#374151;">' +
      escapeHtml(roadClosures).replace(/\n/g, '<br>') +
    '</div>'
  );

  const animalsSection = buildMiniCard(
    'Animal Evacuation Info',
    '<div style="margin-left:4px;">' +
      '<div style="margin-bottom:4px;">' +
        '<span style="font-weight:700;">Small Animals — </span>' +
      '</div>' +
      formatSectionText(smallAnimals) +
      buildAddressSection(smallAddr, 18) +
      '<div style="margin-top:10px; margin-bottom:4px;">' +
        '<span style="font-weight:700;">Large Animals — </span>' +
      '</div>' +
      formatSectionText(largeAnimals) +
      buildAddressSection(largeAddr, 18) +
    '</div>'
  );
```

* Creates four major “mini-cards” for:

  * Check-in location
  * Evac shelters
  * Road closures
  * Animal evacuation (broken into small and large)
* Uses helper functions to format text and addresses.

```js
  // Assemble final HTML
  const cardStyle = buildCardStyle();
  
  return '' +
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; padding: 8px;">' +
      '<div style="' + cardStyle + ' margin-bottom: 12px;">' +
        '<div style="font-size: 15px; line-height: 1.4;">' + statusUpdateHtml + '</div>' +
      '</div>' +
      '<div style="' + cardStyle + '">' +
        '<div style="font-size: 18px; font-weight: 700; color:#000000; text-decoration: underline; margin-bottom: 14px;">Evacuation Information</div>' +
        checkinSection +
        sheltersSection +
        roadSection +
        animalsSection +
      '</div>' +
    '</div>';
}
```

* Wraps everything in a larger outer `<div>` with consistent font.
* First card = status update link.
* Second card = “Evacuation Information” with all four mini cards.

### 5.8 Supporting helpers

* `buildCardStyle()`

  * Returns a common inline style: border, radius, grey background, shadow, padding.

* `buildAddressSection(addresses, leftMargin)`

  * If there are addresses, calls `buildDirectionsList` and wraps it in “Address:” text and small font size; optionally indents via left margin.

* `formatSectionText(raw)`

  * Treats first line as **name/heading** (bold, black).
  * Remaining lines as detailed body (darker grey) with `<br>` for newlines.

* `buildMiniCard(title, contentHtml)`

  * Wraps any section content inside a white mini-card with:

    * Grey “rail” on the left.
    * Uppercase label for the section title.
    * Content body area.

* `buildDirectionsList(addresses)`

  * Splits addresses by newline or semicolon.
  * For each non-empty address:

    * Builds a Google Maps “Get directions” link:
      `https://www.google.com/maps/dir/?api=1&destination=<encoded address>`
  * Returns a `<ul>` list of `<li>` items with clickable links.

* `normalizeUrl(u)`

  * Ensures URLs have `http` or `https`; otherwise prepends `https://`.

* `escapeHtml(str)`

  * Escapes special characters (&, <, >, ", ') to prevent injection/XSS for any dynamic text (note that some fields like addresses/status text are HTML-escaped while some sections deliberately allow formatted HTML).

---

If you want, I can next:

* Turn this into a markdown doc formatted exactly how you’d paste it into a Confluence/Notion page, or
* Add **one-line summary comments** you can paste at the very top of each file (e.g., “This file renders the incident list and static evacuation info homepage”).
