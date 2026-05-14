# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Open `index.html` directly in a browser — no build step, no server, no npm. All libraries load from CDN.

## Running Tests

Open `test.html` in a browser. Tests run automatically on load and display pass/fail in the page. There are 15 tests covering the GPX parser, haversine formula, pace segment calculation, and IndexedDB CRUD.

No test runner CLI exists — tests are browser-only because they rely on `DOMParser` and `indexedDB`.

## Architecture

**No modules, no build tools.** Every JS file is a plain `<script>` tag, so all functions are global. Script load order matters:

- `index.html` loads: `db.js` → `gpx-parser.js` → `dashboard.js`
- `activity.html` loads: Leaflet JS → Chart.js → `db.js` → `activity.js`

**Two pages:**
- `index.html` — dashboard: upload zone, activity list, aggregate stats
- `activity.html?id=<n>` — detail view: satellite map + stat cards + charts

**Data flow:**
1. User drops a `.gpx` file → `parseGPX()` in `gpx-parser.js` parses it into an activity object
2. `saveActivity()` in `db.js` stores it in IndexedDB (`sporttracker-db` / `activities` store, autoIncrement `id`)
3. Dashboard reads all activities via `getAllActivities()` and renders them
4. Detail page reads one activity via `getActivity(id)` (id from URL query string)

**Activity object shape** (what `parseGPX` returns and IndexedDB stores):
```js
{
  name, date,           // string (ISO)
  distance,             // integer metres
  duration,             // integer seconds
  avgPace, avgHR, maxHR, calories, elevationGain, elevationLoss, steps,  // integer | null
  trackpoints: [{ lat, lon, ele, time, hr, cad, distFromStart }],
  paceSegments: [{ km, pace }]   // one entry per completed km
}
```

**Key implementation notes:**

- HR is extracted via `getElementsByTagName('*')` + `el.localName` to handle GPX namespace prefix variations (Garmin, Zepp, etc.)
- `distFromStart` on each trackpoint is cumulative metres (integer, rounded). Charts use this directly — no recalculation needed in `activity.js`.
- `calculatePaceSegments` re-runs `haversine()` on raw coordinates (not on `distFromStart` deltas) to avoid integer rounding drift.
- `db.js` caches the IndexedDB connection in `_dbPromise`. Write operations resolve on `tx.oncomplete`, not `req.onsuccess`.
- User-controlled strings from GPX (name, date) are HTML-escaped with `escapeHtml()` before going into `innerHTML` in `dashboard.js`. In `activity.js`, all user data uses `textContent`.
- Optional stat cards (HR, elevation, calories, steps) are removed from the DOM with `el.remove()` when the data is absent — they are not just hidden.

## CSS

All colours use CSS custom properties defined in `:root` in `app.css`. Add new colours there rather than hardcoding hex values.
