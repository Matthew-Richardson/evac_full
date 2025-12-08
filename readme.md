# ReadyLaPlata

**La Plata County Emergency Evacuation Information System**

A web application providing real-time evacuation zone information, incident tracking, and emergency resources for La Plata County, Colorado.

![Status](https://img.shields.io/badge/status-production-green)
![Platform](https://img.shields.io/badge/platform-web-blue)
![ArcGIS](https://img.shields.io/badge/ArcGIS-4.31-orange)

---

## Overview

ReadyLaPlata is the official evacuation information viewer for La Plata County Office of Emergency Management (LPCOEM). It displays real-time evacuation zones using the **Ready, Set, Go!** system and integrates with ArcGIS mapping services and CodeRED emergency alerts.

### Key Features

- **Interactive evacuation maps** powered by ArcGIS WebMaps
- **Real-time zone status** (SET/GO evacuation levels)
- **Incident support resources** (shelters, check-in locations, road closures, animal evacuation)
- **Past incidents archive** with searchable history
- **CodeRED integration** for emergency alert signup
- **Mobile-responsive design** optimized for emergency use
- **Offline-friendly** critical CSS inlined for fast first paint

---

## Pages

| Page | File | Description |
|------|------|-------------|
| **Home** | `info.html` | Ready, Set, Go! education and incident list |
| **Overview Map** | `overview.html` | County-wide map with all active incident pins |
| **Evacuation Details** | `evac.html` | Per-incident evacuation zones and support resources |

---

## Quick Start

### Prerequisites

- Web server (Apache, Nginx, or static hosting)
- Google Apps Script deployment (for incident status API)
- ArcGIS Online account with configured WebMap and Feature Services

### Deployment

1. **Upload files** to your web server:
   ```
   info.html
   overview.html
   evac.html
   shared-styles.css
   favicon.svg
   ```

2. **Deploy Apps Script** (`code.gs`) as a web app:
   - Open Google Apps Script
   - Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
   - Copy the deployment URL

3. **Update configuration** in each HTML file:
   ```javascript
   const CONFIG = {
     statusBaseUrl: 'YOUR_APPS_SCRIPT_URL',
     // ...
   };
   ```

4. **Configure Google Sheets** with required tabs:
   - `IncidentStatus` — Active incident support data
   - `PastIncidents` — Historical incident records

---

## Configuration

### ArcGIS Services

| Service | URL | Purpose |
|---------|-----|---------|
| Feature Layer | `services2.arcgis.com/.../LPC_Evac_Zones_View/FeatureServer/0` | Evacuation zone polygons |
| WebMap | Portal Item ID `58a8bb313db64271a55e7960cb839f64` | Pre-configured map with symbology |

### Google Sheets Schema

#### IncidentStatus Sheet

| Column | Index | Description |
|--------|-------|-------------|
| Incident | 0 | Incident name (must match ArcGIS `incident` field) |
| Status Link | 1 | URL to official status update |
| Check-in | 2 | Check-in location name and details |
| Check-in Address | 3 | Address(es) for directions link |
| Shelters | 4 | Shelter name and details |
| Shelters Address | 5 | Shelter address(es) |
| Road Closures | 6 | List of road closures (newline-separated) |
| Small Animals | 7 | Small animal evacuation location |
| Small Animals Address | 8 | Small animal location address |
| Large Animals | 9 | Large animal evacuation location |
| Large Animals Address | 10 | Large animal location address |

#### PastIncidents Sheet

| Column | Index | Description |
|--------|-------|-------------|
| Name | 0 | Incident name |
| Start Date | 1 | Date evacuations began |
| Lifted Date | 2 | Date evacuations were lifted |

---

## URL Parameters

### evac.html

| Parameter | Example | Description |
|-----------|---------|-------------|
| `incident` | `?incident=East%20Canyon` | Filters map and data to specific incident |

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari | iOS 14+ | ✅ Full support |
| Chrome Mobile | Android 10+ | ✅ Full support |

---

## Performance

### Optimization Techniques

- **Critical CSS inlined** — First paint without external CSS blocking
- **Async stylesheet loading** — Non-critical CSS loaded via `media="print"` trick
- **DNS prefetch/preconnect** — Reduced latency for ArcGIS resources
- **DOM caching** — Elements cached at init to avoid repeated lookups
- **DocumentFragment** — Batch DOM insertions for incident chips
- **Apps Script caching** — 15-second cache for incident data, 5-minute for past incidents

### Bundle Sizes

| Resource | Size | Notes |
|----------|------|-------|
| ArcGIS SDK | ~2.5 MB | Loaded with `defer` |
| shared-styles.css | ~12 KB | Loaded async |
| Inline critical CSS | ~1 KB | Embedded in `<head>` |

---

## Accessibility

- Semantic HTML5 structure
- ARIA labels on interactive elements
- Keyboard navigation support (Escape closes modals)
- Color contrast meets WCAG 2.1 AA standards
- Screen reader-friendly incident announcements

---

## Security

- All external links use `rel="noopener noreferrer"`
- No inline event handlers (CSP-friendly)
- HTML escaping for all user-provided content
- HTTPS enforced for all external resources

---

## File Structure

```
readylaplata/
├── info.html           # Home page with Ready, Set, Go! info
├── overview.html       # County-wide incident overview map
├── evac.html           # Per-incident evacuation details
├── shared-styles.css   # Shared stylesheet
├── favicon.svg         # Site favicon
├── code.gs             # Google Apps Script backend
└── docs/
    ├── README.md       # This file
    ├── API.md          # Apps Script API reference
    └── ARCHITECTURE.md # Technical architecture
```

---

## Contributing

This project is maintained by La Plata County Office of Emergency Management. For questions or issues, contact the LPCOEM GIS team.

---

## License

© La Plata County, Colorado. All rights reserved.

---

## Related Links

- [La Plata County OEM](https://www.lpcgov.org/departments/emergency_management/index.php)
- [CodeRED Signup](https://identityservice.onsolve.net/SignIn?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fclient_id%3Dself-registration-user%26redirect_uri%3Dhttps%253A%252F%252Faccountportal.onsolve.net%252Fidentity%252Fsignin%252Fcallback%26response_type%3Dcode%26scope%3Dopenid%2520profile%2520onsolve-selfregistration-api%2520openid%2520profile%26state%3D49411630fb2341248d15e07142c80a35_eyJwb3J0YWxVcmwiOiIvbHBjYWxlcnRzIn0%253D%26code_challenge%3DJ7dvCveZwfzly7cYcG9afqOZqiBpxM4OWUei679ZZnQ%26code_challenge_method%3DS256%26response_mode%3Dquery%26branding_descriptor%3DeyJwb3J0YWxJZCI6NTM1MX0%253D%26organization_uuid%3D9f2d09f5-273c-465d-a5d8-993d5e9d88f4%26division_uuid%3D009d9956-000e-3000-80c0-fceb55463ffe%26ui_lang%3Den-US%26origin%3Dhttps%253A%252F%252Faccountportal.onsolve.net%252Flpcalerts)
- [La Plata County GIS/IT](https://www.lpcgov.org/departments/gis___mapping/index.php)
