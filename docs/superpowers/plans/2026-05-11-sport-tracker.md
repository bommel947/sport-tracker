# Sport Tracker Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local browser-only sport activity tracker that parses GPX files from an Amazfit BIP 3 (via Zepp app), stores them persistently in IndexedDB, and displays routes on a satellite map with full statistics and charts.

**Architecture:** Pure HTML/JS/CSS — no build tools, no server. Two pages: `index.html` (dashboard + upload) and `activity.html` (map + stats + charts). All JS files are plain `<script>` tags so functions are globally accessible across files. GPX parsing and distance calculation live in `gpx-parser.js`; IndexedDB access in `db.js`.

**Tech Stack:** Leaflet.js (map), Esri World Imagery (free satellite tiles), Chart.js (charts), IndexedDB (storage), DOMParser API (GPX)

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Dashboard shell: upload zone, stats kacheln, aktivitätsliste |
| `activity.html` | Detail shell: map container, stat cards, chart containers |
| `app.css` | Global dark-mode styles, shared components |
| `js/db.js` | IndexedDB wrapper: openDB, saveActivity, getAllActivities, getActivity, deleteActivity |
| `js/gpx-parser.js` | parseGPX(), haversine(), calculatePaceSegments() — returns structured activity object |
| `js/dashboard.js` | Upload logic (drag+drop+click), renderDashboard(), renderStats(), renderList() |
| `js/activity.js` | renderMap() via Leaflet, renderStatCards(), renderCharts() via Chart.js |
| `test.html` | Browser-based test runner for db.js and gpx-parser.js |

---

### Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `activity.html`
- Create: `app.css`
- Create: `js/db.js` (empty)
- Create: `js/gpx-parser.js` (empty)
- Create: `js/dashboard.js` (empty)
- Create: `js/activity.js` (empty)
- Create: `test.html`

- [ ] **Step 1: Create `app.css`**

```css
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --border: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent: #38bdf8;
  --accent-green: #34d399;
  --accent-red: #f87171;
  --accent-orange: #f59e0b;
  --accent-purple: #a78bfa;
  --radius: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
}

header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

header h1 { font-size: 1.2rem; color: var(--accent); font-weight: 700; }

.btn {
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius);
  padding: 8px 16px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 12px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-ghost:hover { color: var(--text-primary); border-color: var(--text-secondary); }

.container { max-width: 1100px; margin: 0 auto; padding: 24px; }

/* Stat cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}
.stat-card .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.stat-card .value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}
.stat-card .unit {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Upload zone */
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  margin-bottom: 24px;
  color: var(--text-secondary);
}
.upload-zone:hover, .upload-zone.drag-over {
  border-color: var(--accent);
  background: rgba(56, 189, 248, 0.05);
  color: var(--text-primary);
}
.upload-zone .upload-icon { font-size: 2rem; margin-bottom: 8px; }
.upload-zone p { font-size: 0.9rem; }

/* Activity list */
.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.activity-list { display: flex; flex-direction: column; gap: 8px; }
.activity-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: border-color 0.15s;
}
.activity-item:hover { border-color: var(--accent); }
.activity-name { font-weight: 600; font-size: 0.95rem; margin-bottom: 3px; }
.activity-meta { font-size: 0.8rem; color: var(--text-secondary); }
.activity-pace { font-size: 0.85rem; color: var(--accent); margin-right: 12px; }
.delete-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.delete-btn:hover { color: var(--accent-red); background: rgba(248,113,113,0.1); }
.empty { color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 32px; }

/* Activity detail */
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
  height: calc(100vh - 57px);
}
#map { height: 100%; }
.detail-panel {
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 20px;
}
.detail-header { margin-bottom: 20px; }
.detail-header h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 4px; }
.detail-date { font-size: 0.85rem; color: var(--text-secondary); }
.back-link {
  display: inline-block;
  color: var(--accent);
  font-size: 0.85rem;
  text-decoration: none;
  margin-bottom: 12px;
}
.back-link:hover { text-decoration: underline; }

.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}
.detail-stat {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 12px;
}
.detail-stat .label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.detail-stat .value { font-size: 1.4rem; font-weight: 700; }
.detail-stat .unit { font-size: 0.7rem; color: var(--text-secondary); }
.color-accent { color: var(--accent); }
.color-green { color: var(--accent-green); }
.color-red { color: var(--accent-red); }
.color-orange { color: var(--accent-orange); }
.color-purple { color: var(--accent-purple); }

/* Charts */
.chart-section { margin-bottom: 20px; }
.chart-section h3 {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.chart-wrap {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 12px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--accent-red);
  color: #fff;
  padding: 12px 20px;
  border-radius: var(--radius);
  font-size: 0.875rem;
  z-index: 9999;
  display: none;
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SportTracker</title>
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <header>
    <h1>🏃 SportTracker</h1>
    <button class="btn" onclick="document.getElementById('file-input').click()">+ GPX hochladen</button>
    <input type="file" id="file-input" accept=".gpx" multiple style="display:none">
  </header>

  <div class="container">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Aktivitäten</div>
        <div class="value" id="stat-count">0</div>
      </div>
      <div class="stat-card">
        <div class="label">Gesamtdistanz</div>
        <div class="value" id="stat-distance">0</div>
        <div class="unit">km</div>
      </div>
      <div class="stat-card">
        <div class="label">Gesamtzeit</div>
        <div class="value" id="stat-time">0 h</div>
      </div>
    </div>

    <div class="upload-zone" id="upload-zone">
      <div class="upload-icon">📂</div>
      <p>GPX-Datei hier ablegen oder klicken zum Auswählen</p>
    </div>

    <div class="section-title">Aktivitäten</div>
    <div class="activity-list" id="activity-list">
      <p class="empty">Noch keine Aktivitäten. Lade eine GPX-Datei hoch!</p>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script src="js/db.js"></script>
  <script src="js/gpx-parser.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `activity.html`**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivität — SportTracker</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <header>
    <h1>🏃 SportTracker</h1>
    <a href="index.html" class="btn-ghost">← Dashboard</a>
  </header>

  <div class="detail-layout">
    <div id="map"></div>

    <div class="detail-panel">
      <div class="detail-header">
        <div id="activity-title" style="font-size:1.2rem;font-weight:700;margin-bottom:4px;"></div>
        <div class="detail-date" id="activity-date"></div>
      </div>

      <div class="detail-stats" id="stat-grid">
        <div class="detail-stat" id="stat-distance-card">
          <div class="label">Distanz</div>
          <div id="stat-distance" class="value color-accent"></div>
          <div class="unit">km</div>
        </div>
        <div class="detail-stat" id="stat-duration-card">
          <div class="label">Dauer</div>
          <div id="stat-duration" class="value color-accent"></div>
        </div>
        <div class="detail-stat" id="stat-pace-card">
          <div class="label">Ø Pace</div>
          <div id="stat-pace" class="value color-green"></div>
          <div class="unit">min/km</div>
        </div>
        <div class="detail-stat" id="stat-hr-card">
          <div class="label">Herzfrequenz ø/max</div>
          <div id="stat-hr" class="value color-red"></div>
          <div class="unit">bpm</div>
        </div>
        <div class="detail-stat" id="stat-elevation-card">
          <div class="label">Höhenmeter</div>
          <div id="stat-elevation" class="value color-orange"></div>
          <div class="unit">m auf/ab</div>
        </div>
        <div class="detail-stat" id="stat-calories-card">
          <div class="label">Kalorien</div>
          <div id="stat-calories" class="value color-purple"></div>
          <div class="unit">kcal</div>
        </div>
        <div class="detail-stat" id="stat-steps-card">
          <div class="label">Schritte</div>
          <div id="stat-steps" class="value color-purple"></div>
        </div>
      </div>

      <div class="chart-section" id="chart-elevation-section">
        <h3>Höhenprofil</h3>
        <div class="chart-wrap"><canvas id="chart-elevation"></canvas></div>
      </div>
      <div class="chart-section" id="chart-hr-section">
        <h3>Herzfrequenz</h3>
        <div class="chart-wrap"><canvas id="chart-hr"></canvas></div>
      </div>
      <div class="chart-section" id="chart-pace-section">
        <h3>Pace pro km</h3>
        <div class="chart-wrap"><canvas id="chart-pace"></canvas></div>
      </div>
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="js/db.js"></script>
  <script src="js/activity.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create empty JS stubs**

Create `js/db.js`, `js/gpx-parser.js`, `js/dashboard.js`, `js/activity.js` — each as empty files.

- [ ] **Step 5: Commit**

```bash
git init
git add index.html activity.html app.css js/db.js js/gpx-parser.js js/dashboard.js js/activity.js
git commit -m "feat: project scaffold — HTML shells, CSS, empty JS stubs"
```

---

### Task 2: GPX Parser

**Files:**
- Create: `test.html`
- Modify: `js/gpx-parser.js`

- [ ] **Step 1: Create `test.html` with failing GPX parser tests**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Tests — SportTracker</title>
  <style>
    body { font-family: monospace; background: #0f172a; color: #f1f5f9; padding: 24px; }
    .pass { color: #34d399; } .fail { color: #f87171; }
    h2 { color: #38bdf8; margin-bottom: 16px; }
    .result { margin: 4px 0; font-size: 14px; }
    #summary { margin-top: 16px; font-size: 1.1rem; font-weight: bold; }
  </style>
</head>
<body>
  <h2>SportTracker Tests</h2>
  <div id="results"></div>
  <div id="summary"></div>

  <script src="js/db.js"></script>
  <script src="js/gpx-parser.js"></script>
  <script>
const results = document.getElementById('results');
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      result.then(() => {
        passed++;
        results.innerHTML += `<div class="result pass">✅ ${name}</div>`;
        updateSummary();
      }).catch(e => {
        failed++;
        results.innerHTML += `<div class="result fail">❌ ${name}: ${e.message}</div>`;
        updateSummary();
      });
    } else {
      passed++;
      results.innerHTML += `<div class="result pass">✅ ${name}</div>`;
    }
  } catch(e) {
    failed++;
    results.innerHTML += `<div class="result fail">❌ ${name}: ${e.message}</div>`;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function updateSummary() {
  document.getElementById('summary').textContent = `${passed} passed, ${failed} failed`;
}

// ── Sample GPX (Amazfit/Zepp format) ─────────────────────────────────────────
const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Zepp"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk>
    <name>Testlauf</name>
    <trkseg>
      <trkpt lat="48.1000" lon="11.5000">
        <ele>520.0</ele>
        <time>2026-05-10T07:30:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>140</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="48.1050" lon="11.5060">
        <ele>530.0</ele>
        <time>2026-05-10T07:32:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>155</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="48.1100" lon="11.5120">
        <ele>525.0</ele>
        <time>2026-05-10T07:34:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>160</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

const NO_NAME_GPX = SAMPLE_GPX.replace('<name>Testlauf</name>', '');

// ── GPX Parser Tests ──────────────────────────────────────────────────────────
test('parseGPX: extracts name from <name> tag', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  assert(a.name === 'Testlauf', `Expected 'Testlauf', got '${a.name}'`);
});

test('parseGPX: falls back to filename without extension', () => {
  const a = parseGPX(NO_NAME_GPX, 'meinlauf.gpx');
  assert(a.name === 'meinlauf', `Expected 'meinlauf', got '${a.name}'`);
});

test('parseGPX: extracts 3 trackpoints', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  assert(a.trackpoints.length === 3, `Expected 3, got ${a.trackpoints.length}`);
});

test('parseGPX: trackpoints have lat, lon, distFromStart', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  const p = a.trackpoints[0];
  assert(p.lat === 48.1, `lat mismatch: ${p.lat}`);
  assert(p.lon === 11.5, `lon mismatch: ${p.lon}`);
  assert(p.distFromStart === 0, `first point distFromStart should be 0, got ${p.distFromStart}`);
  assert(a.trackpoints[1].distFromStart > 0, 'second point distFromStart should be > 0');
});

test('parseGPX: total distance > 0', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  assert(a.distance > 0, `Expected > 0, got ${a.distance}`);
});

test('parseGPX: duration is 240 seconds', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  assert(a.duration === 240, `Expected 240, got ${a.duration}`);
});

test('parseGPX: extracts heart rate values', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  assert(a.avgHR !== null, 'avgHR should not be null');
  assert(a.maxHR === 160, `Expected maxHR 160, got ${a.maxHR}`);
  assert(a.trackpoints[0].hr === 140, `Expected hr 140, got ${a.trackpoints[0].hr}`);
});

test('parseGPX: elevation gain = 10, loss = 5', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  assert(a.elevationGain === 10, `Expected gain 10, got ${a.elevationGain}`);
  assert(a.elevationLoss === 5, `Expected loss 5, got ${a.elevationLoss}`);
});

test('parseGPX: returns null for missing fields (no calories)', () => {
  const a = parseGPX(SAMPLE_GPX, 'test.gpx');
  assert(a.calories === null, `Expected null calories, got ${a.calories}`);
});

test('parseGPX: throws on empty trackpoints', () => {
  const empty = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`;
  try { parseGPX(empty, 'empty.gpx'); assert(false, 'Should have thrown'); }
  catch (e) { assert(e.message.includes('Trackpunkt'), `Wrong error: ${e.message}`); }
});

test('haversine: known distance ~789m between two points', () => {
  const d = haversine(48.1000, 11.5000, 48.1050, 11.5060);
  assert(d > 700 && d < 900, `Expected ~789m, got ${Math.round(d)}m`);
});

updateSummary();
  </script>
</body>
</html>
```

- [ ] **Step 2: Open `test.html` in browser — verify tests FAIL (functions not defined)**

Open `test.html` by double-clicking it. Expected: all tests show ❌ with "parseGPX is not defined" or similar.

- [ ] **Step 3: Implement `js/gpx-parser.js`**

```js
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseGPX(gpxText, filename) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxText, 'application/xml');

  const nameEl = doc.querySelector('name');
  const name = (nameEl && nameEl.textContent.trim())
    ? nameEl.textContent.trim()
    : filename.replace(/\.gpx$/i, '');

  const trkpts = Array.from(doc.querySelectorAll('trkpt'));
  if (trkpts.length === 0) throw new Error('Keine Trackpunkte in GPX gefunden');

  const trackpoints = [];
  let cumulativeDist = 0;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat'));
    const lon = parseFloat(pt.getAttribute('lon'));
    const eleEl = pt.querySelector('ele');
    const ele = eleEl ? parseFloat(eleEl.textContent) : null;
    const timeEl = pt.querySelector('time');
    const time = timeEl ? timeEl.textContent.trim() : null;

    // Heart rate: try multiple namespace prefixes browsers may or may not resolve
    const ext = pt.querySelector('extensions');
    let hr = null, cad = null;
    if (ext) {
      const allEls = ext.getElementsByTagName('*');
      for (const el of allEls) {
        const local = el.localName;
        if (local === 'hr' && hr === null) hr = parseInt(el.textContent);
        if (local === 'cad' && cad === null) cad = parseInt(el.textContent);
      }
    }

    if (i > 0) {
      const prev = trackpoints[i - 1];
      cumulativeDist += haversine(prev.lat, prev.lon, lat, lon);
    }

    trackpoints.push({ lat, lon, ele, time, hr, cad, distFromStart: Math.round(cumulativeDist) });
  }

  const startTime = trackpoints[0].time ? new Date(trackpoints[0].time) : null;
  const endTime = trackpoints[trackpoints.length - 1].time ? new Date(trackpoints[trackpoints.length - 1].time) : null;
  const duration = (startTime && endTime) ? Math.round((endTime - startTime) / 1000) : null;
  const distance = Math.round(cumulativeDist);
  const avgPace = (duration && distance > 0) ? Math.round(duration / (distance / 1000)) : null;

  const hrValues = trackpoints.map(p => p.hr).filter(h => h !== null);
  const avgHR = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null;
  const maxHR = hrValues.length > 0 ? Math.max(...hrValues) : null;

  let elevationGain = null, elevationLoss = null;
  const elePoints = trackpoints.filter(p => p.ele !== null);
  if (elePoints.length > 1) {
    elevationGain = 0; elevationLoss = 0;
    for (let i = 1; i < trackpoints.length; i++) {
      if (trackpoints[i].ele !== null && trackpoints[i - 1].ele !== null) {
        const diff = trackpoints[i].ele - trackpoints[i - 1].ele;
        if (diff > 0) elevationGain += diff;
        else elevationLoss += Math.abs(diff);
      }
    }
    elevationGain = Math.round(elevationGain);
    elevationLoss = Math.round(elevationLoss);
  }

  // Amazfit/Zepp may put calories and steps in root-level extensions
  let calories = null, steps = null;
  const allDocEls = doc.getElementsByTagName('*');
  for (const el of allDocEls) {
    const local = el.localName.toLowerCase();
    if (local === 'calories' && calories === null) calories = parseInt(el.textContent) || null;
    if (local === 'steps' && steps === null) steps = parseInt(el.textContent) || null;
  }

  const paceSegments = calculatePaceSegments(trackpoints);

  return {
    name,
    date: startTime ? startTime.toISOString() : new Date().toISOString(),
    distance,
    duration,
    avgPace,
    avgHR,
    maxHR,
    calories,
    elevationGain,
    elevationLoss,
    steps,
    trackpoints,
    paceSegments,
  };
}

function calculatePaceSegments(trackpoints) {
  const segments = [];
  let accumulated = 0;
  let segStartTime = trackpoints[0]?.time ? new Date(trackpoints[0].time) : null;

  for (let i = 1; i < trackpoints.length; i++) {
    const d = trackpoints[i].distFromStart - trackpoints[i - 1].distFromStart;
    accumulated += d;
    if (accumulated >= 1000 && segStartTime && trackpoints[i].time) {
      const segEndTime = new Date(trackpoints[i].time);
      const seconds = (segEndTime - segStartTime) / 1000;
      if (seconds > 0) {
        segments.push({ km: segments.length + 1, pace: Math.round(seconds / (accumulated / 1000)) });
      }
      accumulated = 0;
      segStartTime = segEndTime;
    }
  }
  return segments;
}
```

- [ ] **Step 4: Refresh `test.html` — verify all tests PASS**

Expected: all 11 tests show ✅, summary reads "11 passed, 0 failed".

- [ ] **Step 5: Commit**

```bash
git add js/gpx-parser.js test.html
git commit -m "feat: implement GPX parser with haversine distance, HR, elevation, pace segments"
```

---

### Task 3: IndexedDB Wrapper

**Files:**
- Modify: `js/db.js`
- Modify: `test.html` (add DB tests)

- [ ] **Step 1: Add DB tests to `test.html` — before the closing `</script>` tag**

Append this block before `updateSummary()` at the end of the test script:

```js
// ── IndexedDB Tests ───────────────────────────────────────────────────────────
const TEST_ACTIVITY = {
  name: 'DB-Test Lauf', date: '2026-01-01T10:00:00Z',
  distance: 5000, duration: 1800, avgPace: 360,
  avgHR: 150, maxHR: 170, calories: 300,
  elevationGain: 50, elevationLoss: 50, steps: 5000,
  trackpoints: [{ lat: 48.1, lon: 11.5, ele: 520, time: '2026-01-01T10:00:00Z', hr: 150, cad: null, distFromStart: 0 }],
  paceSegments: [],
};

test('db: saveActivity returns an id', async () => {
  const id = await saveActivity({ ...TEST_ACTIVITY });
  assert(typeof id === 'number' && id > 0, `Expected numeric id, got ${id}`);
});

test('db: getAllActivities returns saved activity', async () => {
  const all = await getAllActivities();
  const found = all.find(a => a.name === 'DB-Test Lauf');
  assert(found !== undefined, 'Saved activity not found in getAllActivities');
});

test('db: getActivity returns correct activity by id', async () => {
  const all = await getAllActivities();
  const saved = all.find(a => a.name === 'DB-Test Lauf');
  const fetched = await getActivity(saved.id);
  assert(fetched.name === 'DB-Test Lauf', `Name mismatch: ${fetched.name}`);
  assert(fetched.distance === 5000, `Distance mismatch: ${fetched.distance}`);
});

test('db: deleteActivity removes the activity', async () => {
  const all = await getAllActivities();
  const saved = all.find(a => a.name === 'DB-Test Lauf');
  await deleteActivity(saved.id);
  const after = await getAllActivities();
  const found = after.find(a => a.name === 'DB-Test Lauf');
  assert(found === undefined, 'Activity should have been deleted');
});
```

- [ ] **Step 2: Refresh `test.html` — verify DB tests FAIL (db functions not defined)**

Expected: the 4 new DB tests fail with "saveActivity is not defined".

- [ ] **Step 3: Implement `js/db.js`**

```js
const DB_NAME = 'sporttracker-db';
const DB_VERSION = 1;
const STORE = 'activities';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function saveActivity(activity) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add(activity);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getAllActivities() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getActivity(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deleteActivity(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}
```

- [ ] **Step 4: Refresh `test.html` — verify all 15 tests PASS**

Expected: "15 passed, 0 failed". (Note: DB tests write to and clean up the real browser IndexedDB.)

- [ ] **Step 5: Commit**

```bash
git add js/db.js test.html
git commit -m "feat: implement IndexedDB wrapper with save, get, getAll, delete"
```

---

### Task 4: Dashboard — Upload & List

**Files:**
- Modify: `js/dashboard.js`

- [ ] **Step 1: Implement `js/dashboard.js`**

```js
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3500);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function formatPace(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s} /km`;
}

function formatDuration(seconds) {
  if (!seconds) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

async function uploadFile(file) {
  const text = await file.text();
  try {
    const activity = parseGPX(text, file.name);
    await saveActivity(activity);
  } catch (err) {
    showToast(`Fehler bei ${file.name}: ${err.message}`);
  }
}

function setupUploadZone() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', async (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.gpx'));
    if (files.length === 0) { showToast('Nur .gpx Dateien werden unterstützt'); return; }
    for (const file of files) await uploadFile(file);
    await renderDashboard();
  });

  input.addEventListener('change', async () => {
    const files = Array.from(input.files);
    for (const file of files) await uploadFile(file);
    input.value = '';
    await renderDashboard();
  });
}

function renderStats(activities) {
  document.getElementById('stat-count').textContent = activities.length;
  const totalDist = activities.reduce((s, a) => s + (a.distance || 0), 0);
  document.getElementById('stat-distance').textContent = (totalDist / 1000).toFixed(1);
  const totalDur = activities.reduce((s, a) => s + (a.duration || 0), 0);
  document.getElementById('stat-time').textContent = formatDuration(totalDur);
}

function renderList(activities) {
  const list = document.getElementById('activity-list');
  if (activities.length === 0) {
    list.innerHTML = '<p class="empty">Noch keine Aktivitäten. Lade eine GPX-Datei hoch!</p>';
    return;
  }
  list.innerHTML = activities.map(a => `
    <div class="activity-item" onclick="window.location.href='activity.html?id=${a.id}'">
      <div class="activity-info">
        <div class="activity-name">${a.name}</div>
        <div class="activity-meta">${formatDate(a.date)} · ${(a.distance / 1000).toFixed(2)} km · ${formatPace(a.avgPace)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="activity-pace">${formatDuration(a.duration)}</span>
        <button class="delete-btn" onclick="event.stopPropagation(); confirmDelete(${a.id})">×</button>
      </div>
    </div>
  `).join('');
}

async function confirmDelete(id) {
  if (!confirm('Aktivität löschen?')) return;
  await deleteActivity(id);
  await renderDashboard();
}

async function renderDashboard() {
  const activities = await getAllActivities();
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderStats(activities);
  renderList(activities);
}

document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  renderDashboard();
});
```

- [ ] **Step 2: Open `index.html` in browser — verify upload works**

1. Open `index.html` by double-clicking it.
2. The page should show 3 stat cards (all 0) and the upload zone.
3. Drag a real GPX file (or use the upload button) onto the upload zone.
4. The activity should appear in the list immediately with name, date, distance, pace.
5. The stat cards should update (count: 1, distance shows km, time shows minutes).
6. Click the × button on the activity — confirm dialog should appear, activity should disappear.

- [ ] **Step 3: Commit**

```bash
git add js/dashboard.js
git commit -m "feat: dashboard upload (drag+drop+click), activity list, global stats"
```

---

### Task 5: Activity Detail — Map & Stat Cards

**Files:**
- Modify: `js/activity.js`

- [ ] **Step 1: Implement `js/activity.js` — map and stat cards**

```js
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

function formatPace(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function hideCard(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function renderStatCards(activity) {
  document.getElementById('activity-title').textContent = activity.name;
  document.getElementById('activity-date').textContent = formatDate(activity.date);

  document.getElementById('stat-distance').textContent = (activity.distance / 1000).toFixed(2);
  document.getElementById('stat-duration').textContent = formatDuration(activity.duration);
  document.getElementById('stat-pace').textContent = formatPace(activity.avgPace);

  if (activity.avgHR) {
    document.getElementById('stat-hr').textContent = `${activity.avgHR} / ${activity.maxHR}`;
  } else {
    hideCard('stat-hr-card');
  }

  if (activity.elevationGain !== null) {
    document.getElementById('stat-elevation').textContent = `+${activity.elevationGain} / -${activity.elevationLoss}`;
  } else {
    hideCard('stat-elevation-card');
  }

  if (activity.calories) {
    document.getElementById('stat-calories').textContent = activity.calories;
  } else {
    hideCard('stat-calories-card');
  }

  if (activity.steps) {
    document.getElementById('stat-steps').textContent = activity.steps.toLocaleString('de-DE');
  } else {
    hideCard('stat-steps-card');
  }
}

function renderMap(activity) {
  const coords = activity.trackpoints.map(p => [p.lat, p.lon]);
  const map = L.map('map');

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
  ).addTo(map);

  const polyline = L.polyline(coords, { color: '#38bdf8', weight: 3, opacity: 0.9 }).addTo(map);
  map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

  const greenIcon = L.circleMarker(coords[0], {
    radius: 8, fillColor: '#34d399', color: '#fff', weight: 2, fillOpacity: 1
  }).bindTooltip('Start', { permanent: false }).addTo(map);

  L.circleMarker(coords[coords.length - 1], {
    radius: 8, fillColor: '#f87171', color: '#fff', weight: 2, fillOpacity: 1
  }).bindTooltip('Ziel', { permanent: false }).addTo(map);
}

function renderCharts(activity) {
  const chartBase = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
    }
  };

  // Elevation chart
  const elePts = activity.trackpoints.filter(p => p.ele !== null);
  if (elePts.length > 1) {
    new Chart(document.getElementById('chart-elevation'), {
      type: 'line',
      data: {
        labels: elePts.map(p => (p.distFromStart / 1000).toFixed(2)),
        datasets: [{
          data: elePts.map(p => p.ele),
          borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
          fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2
        }]
      },
      options: {
        ...chartBase,
        scales: {
          ...chartBase.scales,
          x: { ...chartBase.scales.x, title: { display: true, text: 'Distanz (km)', color: '#94a3b8' } },
          y: { ...chartBase.scales.y, title: { display: true, text: 'Höhe (m)', color: '#94a3b8' } }
        }
      }
    });
  } else {
    const sec = document.getElementById('chart-elevation-section');
    if (sec) sec.remove();
  }

  // HR chart
  const hrPts = activity.trackpoints.filter(p => p.hr !== null);
  if (hrPts.length > 1) {
    new Chart(document.getElementById('chart-hr'), {
      type: 'line',
      data: {
        labels: hrPts.map(p => (p.distFromStart / 1000).toFixed(2)),
        datasets: [{
          data: hrPts.map(p => p.hr),
          borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)',
          fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2
        }]
      },
      options: {
        ...chartBase,
        scales: {
          ...chartBase.scales,
          x: { ...chartBase.scales.x, title: { display: true, text: 'Distanz (km)', color: '#94a3b8' } },
          y: { ...chartBase.scales.y, title: { display: true, text: 'bpm', color: '#94a3b8' } }
        }
      }
    });
  } else {
    const sec = document.getElementById('chart-hr-section');
    if (sec) sec.remove();
  }

  // Pace chart (bar, one bar per km)
  if (activity.paceSegments && activity.paceSegments.length > 0) {
    new Chart(document.getElementById('chart-pace'), {
      type: 'bar',
      data: {
        labels: activity.paceSegments.map(s => `${s.km} km`),
        datasets: [{
          data: activity.paceSegments.map(s => s.pace),
          backgroundColor: '#38bdf8', borderRadius: 4
        }]
      },
      options: {
        ...chartBase,
        scales: {
          ...chartBase.scales,
          x: { ...chartBase.scales.x, title: { display: true, text: 'km-Abschnitt', color: '#94a3b8' } },
          y: {
            ...chartBase.scales.y,
            title: { display: true, text: 'Pace (min/km)', color: '#94a3b8' },
            ticks: {
              color: '#94a3b8',
              callback: (v) => {
                const m = Math.floor(v / 60);
                const s = String(v % 60).padStart(2, '0');
                return `${m}:${s}`;
              }
            }
          }
        }
      }
    });
  } else {
    const sec = document.getElementById('chart-pace-section');
    if (sec) sec.remove();
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) { window.location.href = 'index.html'; return; }

  const activity = await getActivity(id);
  if (!activity) { window.location.href = 'index.html'; return; }

  renderStatCards(activity);
  renderMap(activity);
  renderCharts(activity);
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Open `index.html`, upload a GPX, click on the activity**

Verify:
- `activity.html` opens with the activity name and date in the header
- Satellite map shows with the route drawn as a blue line
- Green circle at start, red circle at end
- Map is zoomed to fit the route
- Stat cards show correct values (distance, duration, pace)
- Cards for missing data (e.g. calories if not in GPX) are hidden automatically
- Elevation, HR, pace charts appear for available data

- [ ] **Step 3: Commit**

```bash
git add js/activity.js
git commit -m "feat: activity detail — satellite map, stat cards, elevation/HR/pace charts"
```

---

### Task 6: Final Polish & Verification

**Files:**
- Modify: `index.html` (minor)
- Modify: `app.css` (minor tweaks if needed)

- [ ] **Step 1: Verify full end-to-end flow**

1. Open `index.html`
2. Upload 2–3 different GPX files
3. Confirm: stat cards update (total distance, time, count)
4. Confirm: list is sorted by date (newest first)
5. Click each activity → detail page loads correctly
6. Use browser back button → returns to dashboard
7. Delete one activity → list updates, stats decrease
8. Reload `index.html` → activities are still there (IndexedDB persistence)

- [ ] **Step 2: Verify edge cases**

1. Upload a non-GPX file → toast error appears, no crash
2. Upload a GPX with no HR data → HR card hidden in detail view, HR chart hidden
3. Upload a short GPX (< 1 km) → pace chart hidden (no full km segments), other stats visible

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: sport tracker complete — GPX upload, satellite map, stats, charts"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Dashboard with drag+drop upload ✓ (Task 4)
  - Activity list sorted by date ✓ (Task 4 `renderList`)
  - Delete activity ✓ (Task 4 `confirmDelete`)
  - Gesamt-Statistiken ✓ (Task 4 `renderStats`)
  - Satellite map with route, start/end markers ✓ (Task 5 `renderMap`)
  - All stat cards (distance, duration, pace, HR, elevation, calories, steps) ✓ (Task 5 `renderStatCards`)
  - Conditional hiding of unavailable fields ✓ (Task 5 `hideCard`)
  - Pace chart ✓ (Task 5 `renderCharts`)
  - HR chart ✓ (Task 5 `renderCharts`)
  - Elevation chart ✓ (Task 5 `renderCharts`)
  - GPX name from `<name>` tag, fallback to filename ✓ (Task 2 `parseGPX`)
  - Haversine distance ✓ (Task 2)
  - HR extraction via `getElementsByTagName('*')` + localName ✓ (Task 2)
  - IndexedDB persistence ✓ (Task 3)

- [x] **Type consistency:**
  - `haversine()` used only in `gpx-parser.js` ✓
  - `trackpoints[i].distFromStart` used in `activity.js` charts ✓ (set in parser)
  - `saveActivity`, `getAllActivities`, `getActivity`, `deleteActivity` — consistent across db.js, dashboard.js, activity.js ✓
  - `paceSegments` array structure `{ km, pace }` — consistent between parser and chart renderer ✓

- [x] **No placeholders:** All steps contain complete code ✓
