function formatDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

function formatPace(seconds) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
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

  if (activity.elevationGain != null) {
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
  const trackpoints = activity.trackpoints || [];
  if (trackpoints.length === 0) return;
  const coords = trackpoints.map(p => [p.lat, p.lon]);
  const map = L.map('map');

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
  ).addTo(map);

  if (coords.length === 1) {
    map.setView(coords[0], 15);
    L.circleMarker(coords[0], {
      radius: 8, fillColor: '#34d399', color: '#fff', weight: 2, fillOpacity: 1
    }).bindTooltip('Start', { permanent: false }).addTo(map);
    return;
  }

  const polyline = L.polyline(coords, { color: '#38bdf8', weight: 3, opacity: 0.9 }).addTo(map);
  map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

  L.circleMarker(coords[0], {
    radius: 8, fillColor: '#34d399', color: '#fff', weight: 2, fillOpacity: 1
  }).bindTooltip('Start', { permanent: false }).addTo(map);

  L.circleMarker(coords[coords.length - 1], {
    radius: 8, fillColor: '#f87171', color: '#fff', weight: 2, fillOpacity: 1
  }).bindTooltip('Ziel', { permanent: false }).addTo(map);
}

function renderCharts(activity) {
  const trackpoints = activity.trackpoints || [];
  const chartBase = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
    }
  };

  // Elevation chart
  const elePts = trackpoints.filter(p => p.ele !== null);
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
  const hrPts = trackpoints.filter(p => p.hr !== null);
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
                const s = String(Math.floor(v % 60)).padStart(2, '0');
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
  const id = parseInt(params.get('id'), 10);
  if (!id) { window.location.href = 'index.html'; return; }

  const activity = await getActivity(id);
  if (!activity) { window.location.href = 'index.html'; return; }

  renderStatCards(activity);
  renderMap(activity);
  renderCharts(activity);
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch(err => {
    console.error('Activity page error:', err);
    window.location.href = 'index.html';
  });
});
