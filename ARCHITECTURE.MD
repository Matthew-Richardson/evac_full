# ReadyLaPlata Architecture

**Technical System Design Documentation**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  info.html    │    overview.html    │    evac.html                      │
│  (Home)       │    (Overview Map)   │    (Evacuation Details)           │
└───────┬───────┴──────────┬──────────┴───────────┬───────────────────────┘
        │                  │                      │
        ▼                  ▼                      ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────────┐
│ ArcGIS REST   │  │ ArcGIS REST   │  │        Google Apps Script         │
│ (Query API)   │  │ + WebMap      │  │         (code.gs)                 │
└───────┬───────┘  └───────┬───────┘  └───────────────┬───────────────────┘
        │                  │                          │
        ▼                  ▼                          ▼
┌───────────────────────────────────┐  ┌──────────────────────────────────┐
│     ArcGIS Online                 │  │       Google Sheets              │
│  ┌─────────────────────────────┐  │  │  ┌────────────────────────────┐  │
│  │ Feature Service             │  │  │  │ IncidentStatus (tab)       │  │
│  │ - Evacuation Zones          │  │  │  │ - Support resources        │  │
│  │ - Incident field            │  │  │  └────────────────────────────┘  │
│  │ - STATUS field (Set/Go)     │  │  │  ┌────────────────────────────┐  │
│  │ - zonename field            │  │  │  │ PastIncidents (tab)        │  │
│  └─────────────────────────────┘  │  │  │ - Historical records       │  │
│  ┌─────────────────────────────┐  │  │  └────────────────────────────┘  │
│  │ WebMap                      │  │  └──────────────────────────────────┘
│  │ - Configured symbology      │  │
│  │ - Additional layers         │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
```

---

## Component Architecture

### Frontend (Static HTML/CSS/JS)

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTML Pages                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  info.html   │  │overview.html │  │  evac.html   │          │
│  │              │  │              │  │              │          │
│  │ • RSG Info   │  │ • All pins   │  │ • Zone map   │          │
│  │ • Incidents  │  │ • Past table │  │ • SET/GO     │          │
│  │ • Timeline   │  │ • Navigation │  │ • Resources  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │   shared-styles.css    │                         │
│              │                        │                         │
│              │ • Layout & typography  │                         │
│              │ • Component styles     │                         │
│              │ • Responsive design    │                         │
│              │ • Animation keyframes  │                         │
│              └────────────────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### JavaScript Module Structure

Each HTML page contains an IIFE (Immediately Invoked Function Expression) with consistent structure:

```javascript
(function() {
  'use strict';

  // ========== CONFIGURATION ==========
  const CONFIG = { /* URLs, field names, constants */ };

  // ========== DOM CACHE ==========
  const DOM = {};
  const $ = id => document.getElementById(id);

  // ========== UTILITIES ==========
  // Shared helper functions

  // ========== DATA FETCHING ==========
  // Async functions for API calls

  // ========== MAP INITIALIZATION ==========
  // ArcGIS SDK setup (where applicable)

  // ========== EVENT HANDLERS ==========
  // UI interaction logic

  // ========== INIT ==========
  function init() {
    // Cache DOM, setup handlers, load data
  }

  // DOMContentLoaded or immediate execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

---

## Data Flow

### Incident Data Flow

```
┌─────────────┐    Query     ┌─────────────┐    REST API    ┌─────────────┐
│   Browser   │ ──────────▶  │   ArcGIS    │ ◀────────────▶ │  Feature    │
│  (evac.html)│              │   SDK       │                │  Service    │
└──────┬──────┘              └─────────────┘                └─────────────┘
       │
       │  Fetch
       ▼
┌─────────────┐   HTTP GET   ┌─────────────┐    Read       ┌─────────────┐
│   Browser   │ ──────────▶  │ Apps Script │ ◀──────────▶  │   Google    │
│  (evac.html)│              │  (code.gs)  │               │   Sheets    │
└─────────────┘              └──────┬──────┘               └─────────────┘
                                    │
                                    │ HTML Response
                                    ▼
                             ┌─────────────┐
                             │  innerHTML  │
                             │  injection  │
                             └─────────────┘
```

### Past Incidents Flow

```
┌─────────────┐   ?type=past   ┌─────────────┐    Cache     ┌─────────────┐
│   Browser   │ ────────────▶  │ Apps Script │ ◀──────────▶ │  Script     │
│(overview.html)               │             │   Check      │  Cache      │
└─────────────┘                └──────┬──────┘              └─────────────┘
                                      │
                                      │ Cache miss
                                      ▼
                               ┌─────────────┐
                               │   Google    │
                               │   Sheets    │
                               │ (PastIncidents)
                               └─────────────┘
```

---

## ArcGIS Integration

### SDK Loading Strategy

```html
<!-- Deferred loading - non-blocking -->
<script src="https://js.arcgis.com/4.31/" defer></script>
```

```javascript
// Polling pattern for AMD loader availability
function initMap() {
  if (typeof require === 'undefined') {
    setTimeout(initMap, 100);  // Retry until loaded
    return;
  }
  
  require(['esri/Map', 'esri/views/MapView', ...], (Map, MapView, ...) => {
    // Initialize map
  });
}
```

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MapView                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  WebMap (evac.html only)                               │ │
│  │  - Pre-configured symbology                            │ │
│  │  - Road closures, info points, warnings                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GraphicsLayer (overview.html)                         │ │
│  │  - Dynamic incident pins                               │ │
│  │  - Text labels                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  FeatureLayer (hidden, for queries)                    │ │
│  │  - Evacuation zones                                    │ │
│  │  - Incident names                                      │ │
│  │  - Zone extents                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Basemap                                               │ │
│  │  - topo-vector (overview.html)                         │ │
│  │  - From WebMap (evac.html)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

### Browser Caching

| Resource | Strategy | Duration |
|----------|----------|----------|
| ArcGIS SDK | HTTP Cache | Long (versioned URL) |
| shared-styles.css | HTTP Cache | Based on server config |
| Map tiles | ArcGIS CDN | Automatic |

### Apps Script Caching

```javascript
const cache = CacheService.getScriptCache();

// Incident data - short cache (data changes during emergencies)
cache.put(key, html, 15);  // 15 seconds

// Past incidents - longer cache (historical, rarely changes)
cache.put(key, html, 300);  // 5 minutes
```

### Cache Key Generation

```javascript
// Normalize incident name for consistent cache keys
const key = 'inc_' + incident.toLowerCase().replace(/\W+/g, '_');
// "East Canyon Fire" → "inc_east_canyon_fire"
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Target | Changes |
|------------|--------|---------|
| `> 700px` | Desktop | Full labels, scroll zoom enabled |
| `520-700px` | Tablet | Shortened nav labels |
| `420-520px` | Mobile | Compact spacing, smaller fonts |
| `< 420px` | Small mobile | Icon-only navigation |
| `< 360px` | Very small | Minimal UI |

### Mobile Optimizations

```javascript
// Disable scroll zoom on mobile (prevents accidental zooms)
if (window.innerWidth < 700 && view.navigation) {
  view.navigation.mouseWheelZoomEnabled = false;
  view.navigation.browserTouchPanEnabled = false;
}
```

---

## Performance Optimizations

### Critical Rendering Path

```html
<head>
  <!-- 1. Critical CSS inlined for immediate render -->
  <style>
    *,*::before,*::after{box-sizing:border-box}
    html,body{margin:0;padding:0;...}
    /* Minimal layout styles */
  </style>

  <!-- 2. Non-critical CSS loaded async -->
  <link rel="stylesheet" href="shared-styles.css" 
        media="print" onload="this.media='all'">
  
  <!-- 3. DNS prefetch for external resources -->
  <link rel="dns-prefetch" href="//js.arcgis.com">
  <link rel="preconnect" href="https://js.arcgis.com" crossorigin>
</head>

<body>
  <!-- Content -->
  
  <!-- 4. Scripts deferred to end -->
  <script src="https://js.arcgis.com/4.31/" defer></script>
</body>
```

### DOM Performance

```javascript
// Cache DOM references at init (avoid repeated lookups)
const DOM = {};
function init() {
  DOM.countBadge = document.getElementById('incidentCountBadge');
  DOM.chipsEl = document.getElementById('incidentChips');
  // ...
}

// Batch DOM insertions with DocumentFragment
const frag = document.createDocumentFragment();
for (const name of names) {
  frag.appendChild(createChip(name, onClick));
}
DOM.chipsEl.appendChild(frag);  // Single reflow
```

---

## Security Model

### Content Security

```javascript
// HTML escaping for all dynamic content
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ESC_MAP[c]);
}

// URL sanitization
function normalizeUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return 'https://' + url;
}
```

### External Links

```html
<!-- All external links use security attributes -->
<a href="..." target="_blank" rel="noopener noreferrer">
```

### SQL Injection Prevention (ArcGIS Queries)

```javascript
// Escape single quotes in query strings
const escapeQuery = s => s.replace(/'/g, "''");
const where = `incident='${escapeQuery(name)}'`;
```

---

## Error Handling

### Frontend Errors

```javascript
// Graceful degradation with user feedback
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // Process data
} catch (err) {
  console.error('Error loading data:', err);
  DOM.element.innerHTML = '<div>Error loading data.</div>';
}
```

### Backend Errors (Apps Script)

```javascript
try {
  const html = generateIncidentHtml(incident);
  return htmlResponse(html);
} catch (err) {
  Logger.log(err);  // Server-side logging
  return htmlResponse(errorCard('An error occurred.'));
}
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Environment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  Web Server     │  Static files (HTML, CSS)                  │
│  │  (readylaplata  │  ───────────────────────────▶ Users        │
│  │   .org)         │                                            │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  Google Apps    │  API responses                             │
│  │  Script         │  ───────────────────────────▶ Users        │
│  │  (script.google │                                            │
│  │   .com)         │                                            │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  ArcGIS Online  │  Map tiles, feature queries                │
│  │  (arcgis.com)   │  ───────────────────────────▶ Users        │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Logging

### Client-Side

- `console.error()` for caught exceptions
- Browser DevTools Network tab for request debugging

### Server-Side (Apps Script)

- `Logger.log()` for error logging
- View logs: Apps Script Editor → Executions

### ArcGIS

- ArcGIS Online dashboard for service usage
- Feature Service request logs

---

## Future Considerations

### Potential Improvements

1. **Service Worker** — Offline support for critical information
2. **Push Notifications** — Real-time zone status updates
3. **PWA Manifest** — Install as mobile app
4. **Edge Functions** — Replace Apps Script with faster serverless
5. **Static Pre-rendering** — Generate incident pages at build time

### Scalability

Current architecture handles typical emergency traffic. For major incidents:

- ArcGIS Online auto-scales
- Apps Script has Google infrastructure
- Static files can be CDN-distributed
