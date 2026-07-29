/* ═══════════════════════════════════════════════════════════
   Machine Vision Calculator – main.js
   All CRUD operations and page interactions go here.
═══════════════════════════════════════════════════════════ */

// ── Utilities ──────────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.detail || `HTTP ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.map(e => e.msg).join('\n') : msg);
  }
  return data;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;min-width:280px;';
  document.body.appendChild(c);
  return c;
}

function collectForm(formId) {
  const fd = new FormData(document.getElementById(formId));
  const data = {};
  fd.forEach((v, k) => {
    if (v === '' || v === null) return;
    const num = Number(v);
    if (k === 'trigger_support' || k === 'is_telecentric') {
      data[k] = v === 'true';
    } else if (!isNaN(num) && v.trim() !== '') {
      data[k] = num;
    } else {
      data[k] = v;
    }
  });
  return data;
}

// ── Camera CRUD ────────────────────────────────────────────────────────────

async function saveCamera(cameraId) {
  const data = collectForm('camera-form');
  try {
    if (cameraId) {
      await apiFetch(`/api/cameras/${cameraId}`, { method: 'PUT', body: JSON.stringify(data) });
      showToast('Camera đã được cập nhật.');
    } else {
      await apiFetch('/api/cameras', { method: 'POST', body: JSON.stringify(data) });
      showToast('Camera đã được tạo.');
    }
    setTimeout(() => window.location.href = '/cameras', 800);
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

async function deleteCamera(id, name) {
  if (!confirm(`Xoá camera "${name}"?`)) return;
  try {
    await apiFetch(`/api/cameras/${id}`, { method: 'DELETE' });
    showToast('Đã xoá camera.');
    document.getElementById(`row-${id}`)?.remove();
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

// ── Lens CRUD ──────────────────────────────────────────────────────────────

async function saveLens(lensId) {
  const data = collectForm('lens-form');
  try {
    if (lensId) {
      await apiFetch(`/api/lenses/${lensId}`, { method: 'PUT', body: JSON.stringify(data) });
      showToast('Lens đã được cập nhật.');
    } else {
      await apiFetch('/api/lenses', { method: 'POST', body: JSON.stringify(data) });
      showToast('Lens đã được tạo.');
    }
    setTimeout(() => window.location.href = '/lenses', 800);
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

async function deleteLens(id, name) {
  if (!confirm(`Xoá lens "${name}"?`)) return;
  try {
    await apiFetch(`/api/lenses/${id}`, { method: 'DELETE' });
    showToast('Đã xoá lens.');
    document.getElementById(`row-${id}`)?.remove();
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

// ── Object CRUD ────────────────────────────────────────────────────────────

async function saveObject(objectId) {
  const data = collectForm('object-form');
  try {
    if (objectId) {
      await apiFetch(`/api/objects/${objectId}`, { method: 'PUT', body: JSON.stringify(data) });
      showToast('Object đã được cập nhật.');
    } else {
      await apiFetch('/api/objects', { method: 'POST', body: JSON.stringify(data) });
      showToast('Object đã được tạo.');
    }
    setTimeout(() => window.location.href = '/objects', 800);
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

async function deleteObject(id, name) {
  if (!confirm(`Xoá object "${name}"?`)) return;
  try {
    await apiFetch(`/api/objects/${id}`, { method: 'DELETE' });
    showToast('Đã xoá object.');
    document.getElementById(`row-${id}`)?.remove();
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

// ── Vision Setup CRUD ──────────────────────────────────────────────────────

async function saveSetup(setupId) {
  const data = collectForm('setup-form');
  try {
    if (setupId) {
      await apiFetch(`/api/vision-setups/${setupId}`, { method: 'PUT', body: JSON.stringify(data) });
      showToast('Vision Setup đã được cập nhật.');
      setTimeout(() => window.location.href = `/vision-setups/${setupId}`, 800);
    } else {
      const created = await apiFetch('/api/vision-setups', { method: 'POST', body: JSON.stringify(data) });
      showToast('Vision Setup đã được tạo.');
      setTimeout(() => window.location.href = `/vision-setups/${created.id}`, 800);
    }
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

async function deleteSetup(id, name) {
  if (!confirm(`Xoá vision setup "${name}"?`)) return;
  try {
    await apiFetch(`/api/vision-setups/${id}`, { method: 'DELETE' });
    showToast('Đã xoá vision setup.');
    document.getElementById(`row-${id}`)?.remove();
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

// ── Calculate ──────────────────────────────────────────────────────────────

async function runCalculation(setupId) {
  const btn = document.getElementById('btn-calculate');
  const panel = document.getElementById('results-panel');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang tính...'; }
  try {
    const results = await apiFetch(`/api/vision-setups/${setupId}/calculate`, { method: 'POST' });
    renderResults(results);
    panel?.scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    showToast(e.message, 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-calculator me-1"></i>Calculate'; }
  }
}

function renderResults(results) {
  const panel = document.getElementById('results-panel');
  if (!panel) return;
  panel.innerHTML = buildResultsHTML(results);
  panel.style.display = 'block';
}

function buildResultsHTML(r) {
  const sections = [
    { key: 'fov',           label: 'Field of View',     icon: 'bi-crop',           group: 'geometry' },
    { key: 'resolution',    label: 'Resolution',        icon: 'bi-grid-3x3',       group: 'geometry' },
    { key: 'pixel_density', label: 'Pixel Density',     icon: 'bi-dot',            group: 'geometry' },
    { key: 'dof',           label: 'Depth of Field',    icon: 'bi-layers',         group: 'optics'   },
    { key: 'diffraction',   label: 'Diffraction',       icon: 'bi-circle',         group: 'optics'   },
    { key: 'nyquist',       label: 'Nyquist Limit',     icon: 'bi-soundwave',      group: 'sampling' },
    { key: 'motion_blur',   label: 'Motion Blur',       icon: 'bi-lightning',      group: 'motion'   },
    { key: 'sensor',        label: 'Sensor Performance',icon: 'bi-cpu',            group: 'sensor'   },
    { key: 'brightness',    label: 'Brightness',        icon: 'bi-sun',            group: 'sensor'   },
    { key: 'lens_matching', label: 'Lens Matching',     icon: 'bi-camera-lens',    group: 'score'    },
  ];

  const groups = {
    geometry: { label: 'Hình học', icon: 'bi-aspect-ratio', color: 'primary'  },
    optics:   { label: 'Quang học', icon: 'bi-eye',          color: 'info'     },
    sampling: { label: 'Lấy mẫu',  icon: 'bi-bar-chart',    color: 'warning'  },
    motion:   { label: 'Chuyển động', icon: 'bi-speedometer', color: 'danger'  },
    sensor:   { label: 'Cảm biến',  icon: 'bi-cpu',          color: 'secondary'},
    score:    { label: 'Đánh giá',  icon: 'bi-star',         color: 'success'  },
  };

  let html = '<div class="row g-3">';

  // Score card first
  const scores = r.scores || {};
  html += `
  <div class="col-12">
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-success text-white"><i class="bi bi-star-fill me-2"></i>Điểm Đánh Giá Tổng Hợp</div>
      <div class="card-body">
        <div class="row text-center">
          ${scoreCircle('Lens', scores.lens_suitability)}
          ${scoreCircle('Camera', scores.camera_suitability)}
          ${scoreCircle('Overall', scores.overall, true)}
        </div>
      </div>
    </div>
  </div>`;

  // Group sections
  const byGroup = {};
  sections.forEach(s => {
    if (!byGroup[s.group]) byGroup[s.group] = [];
    byGroup[s.group].push(s);
  });

  for (const [gKey, gCfg] of Object.entries(groups)) {
    const items = byGroup[gKey] || [];
    if (!items.length) continue;

    html += `<div class="col-12"><h6 class="text-muted fw-semibold mt-2"><i class="bi ${gCfg.icon} me-1"></i>${gCfg.label}</h6><div class="row g-2">`;

    for (const s of items) {
      const res = r[s.key];
      if (!res) continue;
      html += `<div class="col-md-6 col-lg-4">${buildResultCard(s, res)}</div>`;
    }

    html += '</div></div>';
  }

  html += '</div>';
  return html;
}

function scoreCircle(label, value, big = false) {
  const v = value ?? '?';
  const cls = v >= 80 ? 'high' : v >= 50 ? 'mid' : 'low';
  const size = big ? 100 : 80;
  const fs   = big ? '1.6rem' : '1.3rem';
  return `
  <div class="col-4">
    <div class="d-flex flex-column align-items-center gap-2">
      <div class="score-circle ${cls}" style="width:${size}px;height:${size}px;font-size:${fs};">${v}</div>
      <span class="small text-muted">${label}</span>
    </div>
  </div>`;
}

function buildResultCard(section, res) {
  const statusMap = { success: 'ok', insufficient_data: 'warn', error: 'err' };
  const cls = statusMap[res.status] || '';
  const badgeMap = {
    success:          '<span class="badge badge-status-success">OK</span>',
    insufficient_data:'<span class="badge badge-status-insuf">Thiếu dữ liệu</span>',
    error:            '<span class="badge badge-status-error">Lỗi</span>',
  };

  let body = '';
  if (res.status === 'success') {
    body += `<div class="fw-bold fs-5 mb-2">${formatValue(res.value)} <small class="text-muted fs-6">${res.unit || ''}</small></div>`;
    if (res.details && Object.keys(res.details).length) {
      body += '<div class="small">';
      for (const [k, v] of Object.entries(res.details)) {
        if (v === null || v === undefined) continue;
        body += `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${formatValue(v)}</span></div>`;
      }
      body += '</div>';
    }
  } else if (res.status === 'insufficient_data') {
    body += `<div class="text-warning small">Cần nhập thêm: <strong>${res.missing?.join(', ')}</strong></div>`;
  } else {
    body += `<div class="text-danger small">${res.description || 'Lỗi không xác định'}</div>`;
  }

  return `
  <div class="card h-100 border-0 shadow-sm">
    <div class="card-body result-section ${cls}">
      <div class="d-flex align-items-center gap-2 mb-2">
        <i class="bi ${section.icon} text-primary"></i>
        <span class="fw-semibold small">${section.label}</span>
        <div class="ms-auto">${badgeMap[res.status] || ''}</div>
      </div>
      ${body}
    </div>
  </div>`;
}

function formatValue(v) {
  if (v === null || v === undefined) return '–';
  if (typeof v === 'boolean') return v ? '<span class="text-success">✓</span>' : '<span class="text-danger">✗</span>';
  if (typeof v === 'number') return v % 1 === 0 ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

// ── Search ─────────────────────────────────────────────────────────────────

function liveSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Highlight active sidebar link
  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') && path.startsWith(link.getAttribute('href')) && link.getAttribute('href') !== '/') {
      link.classList.add('active');
    }
  });

  liveSearch('search-input', 'main-table');
});
