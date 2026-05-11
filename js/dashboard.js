function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  try {
    const text = await file.text();
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
        <div class="activity-name">${escapeHtml(a.name)}</div>
        <div class="activity-meta">${escapeHtml(formatDate(a.date))} · ${(a.distance / 1000).toFixed(2)} km · ${escapeHtml(formatPace(a.avgPace))}</div>
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
  renderDashboard().catch(err => showToast(`Fehler beim Laden: ${err.message}`));
});
