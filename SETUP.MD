# ReadyLaPlata Setup Guide

**Step-by-step deployment and configuration instructions**

---

## Prerequisites

Before starting, ensure you have:

- [ ] Access to a web server or static hosting service
- [ ] Google account with Google Sheets and Apps Script access
- [ ] ArcGIS Online organizational account
- [ ] Access to the La Plata County Feature Services

---

## Step 1: Google Sheets Setup

### Create the Spreadsheet

1. Create a new Google Spreadsheet
2. Rename the first tab to `IncidentStatus`
3. Add a second tab named `PastIncidents`

### IncidentStatus Tab

Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| Incident | Status Link | Check-in | Check-in Address | Shelters | Shelters Address | Road Closures | Small Animals | Small Animals Address | Large Animals | Large Animals Address |

**Example data row:**

| Column | Example Value |
|--------|---------------|
| Incident | `East Canyon Fire` |
| Status Link | `https://lpcoem.org/updates/east-canyon` |
| Check-in | `La Plata County Fairgrounds\nBuilding A` |
| Check-in Address | `2500 Main Ave, Durango, CO` |
| Shelters | `Durango High School\nGym and Cafeteria` |
| Shelters Address | `2390 Main Ave, Durango, CO` |
| Road Closures | `CR 240 at mile marker 5\nCR 250 closed entirely` |
| Small Animals | `La Plata County Humane Society` |
| Small Animals Address | `1111 S Camino del Rio, Durango` |
| Large Animals | `La Plata County Fairgrounds` |
| Large Animals Address | `2500 Main Ave, Durango, CO` |

### PastIncidents Tab

Add these headers in Row 1:

| A | B | C |
|---|---|---|
| Name | Start Date | Lifted Date |

**Example data:**

| Name | Start Date | Lifted Date |
|------|------------|-------------|
| East Canyon Fire | 6/15/2024 | 6/22/2024 |
| West Animas Flood | 5/1/2024 | 5/3/2024 |

---

## Step 2: Google Apps Script Deployment

### Create the Script

1. In your Google Spreadsheet, go to **Extensions → Apps Script**
2. Delete any default code
3. Paste the contents of `code.gs`
4. Save the project (Ctrl+S)
5. Name the project "ReadyLaPlata API"

### Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - **Description:** `ReadyLaPlata Incident API v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. **Copy the Web app URL** — you'll need this for the HTML files

The URL looks like:
```
https://script.google.com/macros/s/AKfycb.../exec
```

### Test the Deployment

Open these URLs in your browser:

```
# Test incident endpoint (replace with your URL and a real incident name)
https://script.google.com/.../exec?incident=East%20Canyon%20Fire

# Test past incidents endpoint
https://script.google.com/.../exec?type=past
```

You should see formatted HTML output.

---

## Step 3: ArcGIS Configuration

### Required Services

Ensure these services exist and are accessible:

1. **Feature Service** with evacuation zones
   - Must have `incident` field (text)
   - Must have `STATUS` field with values `Set` or `Go`
   - Must have `zonename` field
   
2. **WebMap** (for evac.html)
   - Should include the Feature Service
   - Configure symbology for SET (yellow) and GO (green) zones
   - Add any additional layers (road closures, info points, etc.)

### Get Service URLs

1. **Feature Service URL:**
   - Go to ArcGIS Online → Content → Your Feature Service
   - Click on the layer → Copy URL
   - Format: `https://services2.arcgis.com/{org}/ArcGIS/rest/services/{name}/FeatureServer/0`

2. **WebMap ID:**
   - Go to ArcGIS Online → Content → Your WebMap
   - Copy the Item ID from the URL or Details page
   - Format: 32-character alphanumeric string

---

## Step 4: Configure HTML Files

### Update evac.html

Find the CONFIG object and update:

```javascript
const CONFIG = {
  webmapId: 'YOUR_WEBMAP_ID_HERE',
  incidentLayerUrl: 'YOUR_FEATURE_SERVICE_URL_HERE',
  statusBaseUrl: 'YOUR_APPS_SCRIPT_URL_HERE',
  incidentField: 'incident',  // Verify this matches your field name
  statusValues: { SET: 'Set', GO: 'Go' }  // Verify these match your STATUS values
};
```

### Update overview.html

```javascript
const CONFIG = {
  incidentLayerUrl: 'YOUR_FEATURE_SERVICE_URL_HERE',
  statusBaseUrl: 'YOUR_APPS_SCRIPT_URL_HERE',
  incidentField: 'incident',
  mapCenter: [-107.8801, 37.2753],  // Adjust to your county center
  mapScale: 800000  // Adjust zoom level
};
```

### Update info.html

```javascript
const CONFIG = {
  mapUrl: 'evac.html',
  incidentLayerUrl: 'YOUR_FEATURE_SERVICE_URL_HERE/query',
  incidentField: 'incident'
};
```

---

## Step 5: Deploy Static Files

### File Checklist

Ensure you have all files:

```
readylaplata/
├── info.html
├── overview.html
├── evac.html
├── shared-styles.css
└── favicon.svg
```

### Upload to Web Server

**Option A: Traditional Web Server**

```bash
# Upload via FTP/SFTP
scp -r readylaplata/* user@yourserver:/var/www/readylaplata/
```

**Option B: Static Hosting (Netlify, Vercel, GitHub Pages)**

1. Create a repository with the files
2. Connect to your hosting provider
3. Deploy

### Configure Domain (Optional)

1. Point `readylaplata.org` (or your domain) to your server
2. Configure SSL certificate (Let's Encrypt recommended)
3. Set up redirects if needed:
   ```
   / → /info.html (or /overview.html)
   ```

---

## Step 6: Verification

### Test Each Page

1. **info.html**
   - [ ] Page loads without errors
   - [ ] Incident chips appear (if active incidents exist)
   - [ ] CodeRED modal opens/closes
   - [ ] Navigation buttons work

2. **overview.html**
   - [ ] Map loads and displays
   - [ ] Incident pins appear on map
   - [ ] Past incidents table loads
   - [ ] Clicking pins navigates to evac.html

3. **evac.html?incident=YourIncident**
   - [ ] Map zooms to incident
   - [ ] SET/GO zones display correctly
   - [ ] Incident status card loads
   - [ ] Directions links work

### Test Mobile

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify responsive layout at all breakpoints

---

## Troubleshooting

### "No incidents found"

- Verify the `incident` field name matches in ArcGIS and CONFIG
- Check that Feature Service is publicly accessible
- Confirm there are features with the `incident` field populated

### Apps Script returns error

- Check Executions log in Apps Script editor
- Verify sheet names match CONFIG (`IncidentStatus`, `PastIncidents`)
- Ensure sheet has data rows (not just headers)

### Map doesn't load

- Check browser console for errors
- Verify ArcGIS URLs are correct and accessible
- Confirm WebMap is shared publicly (or to your org)

### CORS errors

- Apps Script handles CORS automatically
- ArcGIS services should allow cross-origin requests by default
- Check if your web server needs CORS headers

---

## Updating Content

### Add New Incident

1. Add row to `IncidentStatus` sheet
2. Add corresponding features to ArcGIS Feature Service
3. Data appears automatically (after cache expires, ~15 seconds)

### Close Incident

1. Remove row from `IncidentStatus` sheet (or leave for history)
2. Add row to `PastIncidents` sheet with lifted date
3. Update ArcGIS features (remove or archive)

### Update Apps Script

1. Edit code in Apps Script editor
2. Deploy → Manage deployments → Edit → Update version
3. No changes needed to HTML files (same URL)

---

## Maintenance

### Regular Checks

- [ ] Weekly: Verify all pages load correctly
- [ ] Monthly: Review Apps Script execution logs
- [ ] Annually: Update ArcGIS SDK version (check for breaking changes)

### Backup

- Export Google Sheets periodically
- Keep code.gs in version control
- Document any ArcGIS service changes

---

## Support

For technical issues:
- Check browser console for JavaScript errors
- Review Apps Script execution logs
- Verify ArcGIS service status

For content updates:
- Contact La Plata County OEM
- Update Google Sheets data
- Coordinate with GIS team for map changes
