const API = window.location.origin;
let currentView = 'dashboard';

async function get(url) {
  const res = await fetch(`${API}${url}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n || 0;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function $(sel) { return document.querySelector(sel); }

function loading() { return '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>'; }

function escapeHtml(str) {
  if (!str) return '—';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toast(message, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.textContent = message;
  t.onclick = () => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); };
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  if (type !== 'error') setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000);
}

function setActiveNav(view) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`[data-nav="${view}"]`);
  if (link) link.classList.add('active');
}

function viewDashboard() {
  currentView = 'dashboard';
  setActiveNav('dashboard');
  const app = $('#app');
  app.innerHTML = loading();
  Promise.all([get('/api/profiles/stats'), get('/api/profiles')])
    .then(([stats, list]) => {
      app.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="value">${stats.total}</div><div class="label">Total Profiles</div></div>
          <div class="stat-card"><div class="value">${formatNumber(stats.total_followers)}</div><div class="label">Total Followers</div></div>
          <div class="stat-card"><div class="value">${stats.avg_followers}</div><div class="label">Avg Followers</div></div>
          <div class="stat-card"><div class="value">${stats.avg_repos}</div><div class="label">Avg Repos</div></div>
        </div>
        ${stats.most_followed ? `
        <div class="card">
          <h2>👑 Most Followed</h2>
          <div class="top-user" data-action="view-profile" data-username="${escapeHtml(stats.most_followed.username)}">
            <span class="top-user-name">${escapeHtml(stats.most_followed.username)}</span>
            <span class="top-user-stat">${formatNumber(stats.most_followed.followers)} followers</span>
          </div>
        </div>` : ''}
        ${stats.most_repos ? `
        <div class="card">
          <h2>📦 Most Repos</h2>
          <div class="top-user" data-action="view-profile" data-username="${escapeHtml(stats.most_repos.username)}">
            <span class="top-user-name">${escapeHtml(stats.most_repos.username)}</span>
            <span class="top-user-stat">${stats.most_repos.public_repos} public repos</span>
          </div>
        </div>` : ''}
        <div class="card">
          <h2>Recent Profiles</h2>
          ${list.profiles.length ? list.profiles.slice(0, 5).map(p => `
            <div class="profile-row" data-action="view-profile" data-username="${escapeHtml(p.username)}">
              <img src="${p.avatar_url}" alt="">
              <div class="profile-row-info">
                <strong>${escapeHtml(p.name || p.username)}</strong>
                <span class="profile-row-meta">@${p.username} · ${formatNumber(p.followers)} followers</span>
              </div>
            </div>
          `).join('') : '<p class="empty">No profiles yet. Go to <a href="#" data-nav="profiles">Profiles</a> tab to add one.</p>'}
        </div>
      `;
    })
    .catch(err => { app.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`; });
}

function viewProfiles() {
  currentView = 'profiles';
  setActiveNav('profiles');
  renderProfiles();
}

function renderProfiles(search) {
  const app = $('#app');
  app.innerHTML = `
    <div class="card">
      <div class="analyze-row">
        <input type="text" id="fetch-input" placeholder="Enter GitHub username...">
        <button class="btn btn-primary" data-action="fetch-profile">Analyze</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h2>Stored Profiles</h2>
      </div>
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" id="search-input" placeholder="Search profiles..." value="${escapeHtml(search || '')}">
      </div>
      <div id="profiles-list">${loading()}</div>
    </div>
  `;
  if (search) $('#search-input').focus();
  loadProfiles(search);
}

let searchTimer;
function handleSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadProfiles($('#search-input').value), 300);
}

async function loadProfiles(search) {
  try {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await get(`/api/profiles${q}`);
    const list = $('#profiles-list');
    if (!data || !data.profiles || !data.profiles.length) {
      list.innerHTML = '<p class="empty">🔍 No profiles found</p>';
      return;
    }
    list.innerHTML = `
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Username</th>
            <th>Name</th>
            <th>Followers</th>
            <th>Repos</th>
            <th>Location</th>
            <th>Fetched</th>
          </tr>
        </thead>
        <tbody>
          ${data.profiles.map(p => `
            <tr data-action="view-profile" data-username="${escapeHtml(p.username)}">
              <td><img src="${p.avatar_url}" class="avatar-sm" alt=""></td>
              <td><strong>${escapeHtml(p.username)}</strong></td>
              <td>${escapeHtml(p.name)}</td>
              <td>${formatNumber(p.followers)}</td>
              <td>${p.public_repos}</td>
              <td>${escapeHtml(p.location)}</td>
              <td class="text-muted">${formatDate(p.updated_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    const list = $('#profiles-list');
    if (list) list.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

async function fetchProfile(username) {
  const input = $('#fetch-input');
  const btn = document.querySelector('[data-action="fetch-profile"]');
  const uname = username || input.value.trim();
  if (!uname) { input.focus(); return; }

  input.disabled = true;
  btn.disabled = true;
  btn.innerHTML = '⏳ Fetching...';

  try {
    const res = await fetch(`${API}/api/profiles/${encodeURIComponent(uname)}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    const profile = await res.json();
    input.value = '';
    toast(`✅ ${profile.name || profile.username} stored successfully!`, 'success');
    loadProfiles($('#search-input')?.value || '');
  } catch (err) {
    toast(`❌ ${err.message}`, 'error');
  } finally {
    input.disabled = false;
    btn.disabled = false;
    btn.innerHTML = 'Analyze';
    input.focus();
  }
}

async function viewProfile(username) {
  currentView = 'profile';
  const app = $('#app');
  app.innerHTML = loading();
  try {
    const p = await get(`/api/profiles/${encodeURIComponent(username)}`);
    app.innerHTML = `
      <button class="btn btn-ghost" data-action="back">← Back</button>
      <div class="profile-card">
        <div class="profile-header">
          <img src="${p.avatar_url}" alt="${escapeHtml(p.username)}" class="profile-avatar">
          <div class="profile-info">
            <h1>${escapeHtml(p.name || p.username)}</h1>
            <div class="login">@${escapeHtml(p.username)}</div>
            ${p.bio ? `<div class="bio">${escapeHtml(p.bio)}</div>` : ''}
            ${p.company ? `<div class="bio-detail">🏢 ${escapeHtml(p.company)}</div>` : ''}
            ${p.location ? `<div class="bio-detail">📍 ${escapeHtml(p.location)}</div>` : ''}
          </div>
        </div>
        <div class="profile-meta">
          <div class="meta-item"><div class="m-value">${formatNumber(p.followers)}</div><div class="m-label">Followers</div></div>
          <div class="meta-item"><div class="m-value">${p.following}</div><div class="m-label">Following</div></div>
          <div class="meta-item"><div class="m-value">${p.public_repos}</div><div class="m-label">Public Repos</div></div>
          <div class="meta-item"><div class="m-value">${p.public_gists}</div><div class="m-label">Public Gists</div></div>
        </div>
        <div class="profile-details">
          <div class="detail-row"><span class="detail-label">Blog</span><span class="detail-value">${p.blog ? `<a href="${escapeHtml(p.blog)}" target="_blank">${escapeHtml(p.blog)}</a>` : '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${p.email || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Twitter</span><span class="detail-value">${p.twitter_username ? '@' + escapeHtml(p.twitter_username) : '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Joined GitHub</span><span class="detail-value">${formatDate(p.github_created_at)}</span></div>
          <div class="detail-row"><span class="detail-label">GitHub URL</span><span class="detail-value"><a href="${escapeHtml(p.profile_url)}" target="_blank">${escapeHtml(p.profile_url)}</a></span></div>
          <div class="detail-row"><span class="detail-label">Analyzed On</span><span class="detail-value">${formatDate(p.created_at)}</span></div>
        </div>
        <button class="btn btn-danger" data-action="delete-profile" data-username="${escapeHtml(p.username)}">🗑 Delete Profile</button>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

function goBack() {
  if (currentView === 'profile') {
    viewProfiles();
  } else {
    viewDashboard();
  }
}

async function deleteProfile(username) {
  if (!confirm(`Delete ${username}?`)) return;
  try {
    const res = await fetch(`${API}/api/profiles/${encodeURIComponent(username)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    toast(`🗑 ${username} deleted`, 'info');
    viewProfiles();
  } catch (err) {
    toast(`❌ ${err.message}`, 'error');
  }
}

document.addEventListener('click', e => {
  const target = e.target.closest('[data-nav], [data-action]');
  if (!target) return;

  const action = target.dataset.action || target.dataset.nav;

  if (action === 'dashboard') viewDashboard();
  else if (action === 'profiles') viewProfiles();
  else if (action === 'fetch-profile') fetchProfile();
  else if (action === 'view-profile') viewProfile(target.dataset.username);
  else if (action === 'delete-profile') deleteProfile(target.dataset.username);
  else if (action === 'back') goBack();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement?.id === 'fetch-input') {
    fetchProfile();
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'search-input') {
    handleSearchInput();
  }
});

viewDashboard();
