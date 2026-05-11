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
  if (doc.querySelector('parsererror')) throw new Error('Ungültige GPX-Datei (XML-Fehler)');

  const nameEl = doc.querySelector('trk > name') || doc.querySelector('name');
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

    // Heart rate: iterate all descendant elements and match by localName
    // to avoid namespace prefix issues across browsers
    const ext = pt.querySelector('extensions');
    let hr = null, cad = null;
    if (ext) {
      const allEls = ext.getElementsByTagName('*');
      for (const el of allEls) {
        const local = el.localName;
        if (local === 'hr' && hr === null) hr = parseInt(el.textContent, 10);
        if (local === 'cad' && cad === null) cad = parseInt(el.textContent, 10);
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
    if (local === 'calories' && calories === null) calories = parseInt(el.textContent, 10) || null;
    if (local === 'steps' && steps === null) steps = parseInt(el.textContent, 10) || null;
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
    const d = haversine(trackpoints[i-1].lat, trackpoints[i-1].lon, trackpoints[i].lat, trackpoints[i].lon);
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
