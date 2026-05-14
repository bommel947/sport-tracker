# Sport Tracker Web App — Design Spec
**Datum:** 2026-05-11

## Überblick

Eine lokale Web-App, mit der der Benutzer GPX-Aufzeichnungen seiner Amazfit BIP 3 (exportiert via Zepp App) hochladen, dauerhaft speichern und analysieren kann. Die App läuft vollständig im Browser — kein Server, keine Installation.

---

## Technologie-Stack

| Komponente | Technologie | Zweck |
|---|---|---|
| Karte | Leaflet.js (CDN) | Interaktive Satellitenkarte mit Esri World Imagery |
| Graphen | Chart.js (CDN) | Pace, Herzfrequenz, Höhenprofil |
| Speicher | IndexedDB (Browser) | Persistente lokale Datenhaltung (~50–200 MB) |
| GPX-Parser | Eigener JS-Parser | XML-Parsing von GPX-Dateien |
| Styling | Vanilla CSS | Dark-Mode Design |

Alle Libraries werden per CDN geladen — keine Build-Tools nötig.

---

## Datei-Struktur

```
ExampleWebsite/
├── index.html          # Dashboard / Aktivitätsliste
├── activity.html       # Detailansicht (Karte + Statistiken)
├── app.css             # Globales Stylesheet (Dark Mode)
└── js/
    ├── db.js           # IndexedDB-Wrapper (CRUD für Aktivitäten)
    ├── gpx-parser.js   # GPX-Datei einlesen und strukturieren
    ├── dashboard.js    # Upload-Logik, Aktivitätsliste, Gesamt-Stats
    └── activity.js     # Karte rendern, Graphen, Statistiken anzeigen
```

---

## Ansichten

### 1. Dashboard (`index.html`)

**Zweck:** Einstiegsseite mit Gesamtübersicht und Aktivitätsliste.

**Inhalte:**
- Header mit App-Name und „GPX hochladen"-Button
- Gesamt-Statistik-Kacheln: Anzahl Aktivitäten, Gesamtdistanz (km), Gesamtzeit (h)
- Drag & Drop Upload-Zone für GPX-Dateien (alternativ: Datei-Auswahl per Klick)
- Liste aller gespeicherten Aktivitäten, sortiert nach Datum (neueste zuerst)
  - Pro Eintrag: Datum, Name, Distanz, Pace, Link zur Detailansicht
- Aktivität löschen per Schaltfläche in der Liste

**Upload-Ablauf:**
1. Benutzer zieht GPX-Datei auf die Upload-Zone oder wählt sie per Klick
2. GPX-Parser liest die Datei und extrahiert alle verfügbaren Felder
3. Parsed Activity wird in IndexedDB gespeichert
4. Liste aktualisiert sich sofort

### 2. Detailansicht (`activity.html`)

**Zweck:** Vollständige Analyse einer einzelnen Aktivität.

**Layout:** Zwei-Spalten — Satellitenkarte (links, 60%) | Statistiken & Graphen (rechts, 40%)

**Karte:**
- Leaflet.js mit Esri World Imagery (Satelliten-Tiles, kostenlos)
- Route als farbige Polylinie eingezeichnet
- Start-Marker (grün), Ziel-Marker (rot)
- Karte zoomt automatisch auf die Route

**Statistik-Kacheln (alle verfügbaren Felder aus GPX):**
- Distanz (km)
- Dauer (mm:ss)
- Durchschnitts-Pace (min/km)
- Herzfrequenz: Durchschnitt, Maximum (sofern in GPX vorhanden)
- Höhenmeter: Aufstieg, Abstieg (sofern vorhanden)
- Kalorien (sofern vorhanden)
- Schrittzahl / Kadenz (sofern vorhanden)

**Graphen (Chart.js, Liniengraphen):**
- Pace-Verlauf über Distanz
- Herzfrequenz-Verlauf über Distanz (nur wenn HR-Daten in GPX)
- Höhenprofil über Distanz (nur wenn Elevation in GPX)

Felder, die nicht in der GPX-Datei vorhanden sind, werden nicht angezeigt.

---

## Datenspeicherung (IndexedDB)

**Datenbank:** `sporttracker-db`  
**Object Store:** `activities`

**Gespeichertes Objekt pro Aktivität:**
```json
{
  "id": "auto-generated",
  "name": "Morgenlauf",
  "date": "2026-05-10T07:30:00Z",
  "distance": 5320,
  "duration": 1812,
  "avgPace": 341,
  "avgHR": 156,
  "maxHR": 178,
  "calories": 312,
  "elevationGain": 84,
  "elevationLoss": 78,
  "steps": 6200,
  "trackpoints": [
    { "lat": 48.123, "lon": 11.456, "ele": 520, "time": "...", "hr": 145 }
  ],
  "rawGpx": "<gpx>...</gpx>"
}
```

---

## GPX-Parser

Aktivitätsname: aus GPX-Tag `<name>`, Fallback auf Dateiname ohne `.gpx`-Endung.

Liest folgende GPX-Felder:
- `<trkpt lat lon>` — GPS-Koordinaten
- `<ele>` — Höhe (m)
- `<time>` — Timestamp
- `<gpxtpx:hr>` — Herzfrequenz (Garmin/Amazfit Extension)
- `<gpxtpx:cad>` — Kadenz (falls vorhanden)
- `<extensions>` mit Amazfit-spezifischen Feldern (Kalorien, Schritte)

Berechnungen im Parser:
- Distanz: Haversine-Formel zwischen aufeinanderfolgenden Punkten
- Pace: Zeitdifferenz / Distanz pro Kilometer-Segment
- Höhenmeter: Summe aller positiven / negativen Höhendifferenzen

---

## Start der App

```
index.html im Browser öffnen (Doppelklick)
```

Keine Installation, kein Server, kein Build-Schritt nötig.

---

## Nicht im Scope

- Mehrere Benutzer / Login
- Cloud-Synchronisation
- Vergleich mehrerer Aktivitäten
- Export-Funktion
- Mobiloptimierung (Desktop-First)
