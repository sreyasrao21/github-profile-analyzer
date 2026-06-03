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
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function $(sel) { return document.querySelector(sel); }

function viewDashboard() {
  currentView = 'dashboard';
  $('.nav-links a').classList.remove('active');
  $('[data-nav="dashboard"]').classList.add('active');
  const app = $('#app');
  app.innerHTML = '<div class="loading">Loading dashboard...</div>';
  Promise.all([get('/api/profiles/stats'), get('/api/profiles')])
    .then(([stats, list]) => {
      app.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="value">${stats.total}</div><div class="label">Total Profiles</div></div>
          <div class="stat-card"><div class="value">${formatNumber(stats.total_followers)}</div><div class="label">Total Followers</div></div>
          <div class="stat-card"><div class="value">${stats.avg_followers}</div><div class="label">Avg Followers</div></div>
          <div class="stat-card"><div class="value">${stats.avg_repos}</div><div class="label">Avg Repos</div></div>
        </div>
        <div class="card">
          <h2>Most Followed</h2>
          ${stats.most_followed ? `<p style="font-size:18px"><strong>${stats.most_followed.username}</strong> — ${formatNumber(stats.most_followed.followers)} followers</p>` : '<p class="empty">No profiles yet</p>'}
        </div>
        <div class="card">
          <h2>Most Repos</h2>
          ${stats.most_repos ? `<p style="font-size:18px"><strong>${stats.most_repos.username}</strong> — ${stats.most_repos.public_repos} public repos</p>` : '<p class="empty">No profiles yet</p>'}
        </div>
        <div class="card">
          <h2>Recent Profiles</h2>
          ${list.profiles.length ? list.profiles.slice(0, 5).map(p => `
            <div class="profile-row" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #eee;cursor:pointer" onclick="viewProfile('${p.username}')">
              <img src="${p.avatar_url}" style="width:40px;height:40px;border-radius:50%" alt="">
              <div><strong>${p.name || p.username}</strong><br><span style="color:#586069;font-size:13px">@${p.username} · ${formatNumber(p.followers)} followers</span></div>
            </div>
          `).join('') : '<p class="empty">No profiles yet. Go to Profiles tab to add one.</p>'}
        </div>
      `;
    })
    .catch(err => { app.innerHTML = `<div class="error">${err.message}</div>`; });
}

function viewProfiles() {
  currentView = 'profiles';
  $('.nav-links a').classList.remove('active');
  $('[data-nav="profiles"]').classList.add('active');
  renderProfiles();
}

function renderProfiles(search) {
  const app = $('#app');
  app.innerHTML = `
    <div class="card">
      <h2>Analyze a Profile</h2>
      <div class="search-bar">
        <input type="text" id="fetch-input" placeholder="Enter GitHub username..." style="max-width:300px">
        <button class="btn btn-primary" onclick="fetchProfile()">Fetch & Store</button>
      </div>
    </div>
    <div class="card">
      <h2>Stored Profiles</h2>
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="Search by name, username, location..." value="${search || ''}" oninput="debouncedSearch()">
      </div>
      <div id="profiles-list"><div class="loading">Loading...</div></div>
    </div>
  `;
  loadProfiles(search);
}

let searchTimer;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadProfiles($('#search-input').value);
  }, 300);
}

async function loadProfiles(search) {
  try {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await get(`/api/profiles${q}`);
    const list = $('#profiles-list');
    if (!data.profiles.length) {
      list.innerHTML = '<p class="empty">No profiles found</p>';
      return;
    }
    list.innerHTML = `
      <table>
        <thead><tr><th>Avatar</th><th>Username</th><th>Name</th><th>Followers</th><th>Repos</th><th>Location</th><th>Fetched</th></tr></thead>
        <tbody>
          ${data.profiles.map(p => `
            <tr onclick="viewProfile('${p.username}')">
              <td><img src="${p.avatar_url}" style="width:32px;height:32px;border-radius:50%" alt=""></td>
              <td><strong>${p.username}</strong></td>
              <td>${p.name || '—'}</td>
              <td>${formatNumber(p.followers)}</td>
              <td>${p.public_repos}</td>
              <td>${p.location || '—'}</td>
              <td>${formatDate(p.updated_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    $('#profiles-list').innerHTML = `<div class="error">${err.message}</div>`;
  }
}

async function fetchProfile() {
  const input = $('#fetch-input');
  const username = input.value.trim();
  if (!username) return;
  input.disabled = true;
  try {
    const res = await fetch(`${API}/api/profiles/${username}`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
    input.value = '';
    loadProfiles($('#search-input')?.value || '');
  } catch (err) {
    alert(err.message);
  } finally {
    input.disabled = false;
    input.focus();
  }
}

async function viewProfile(username) {
  const app = $('#app');
  app.innerHTML = '<div class="loading">Loading...</div>';
  try {
    const p = await get(`/api/profiles/${username}`);
    app.innerHTML = `
      <button class="btn btn-secondary" onclick="${currentView === 'dashboard' ? 'viewDashboard()' : 'viewProfiles()'}" style="margin-bottom:16px">&larr; Back</button>
      <div class="card">
        <div class="profile-header">
          <img src="${p.avatar_url}" alt="${p.username}">
          <div class="profile-info">
            <h1>${p.name || p.username}</h1>
            <div class="login">@${p.username}</div>
            ${p.bio ? `<div class="bio">${p.bio}</div>` : ''}
            <div class="profile-meta">
              <div class="meta-item"><div class="m-value">${formatNumber(p.followers)}</div><div class="m-label">Followers</div></div>
              <div class="meta-item"><div class="m-value">${p.following}</div><div class="m-label">Following</div></div>
              <div class="meta-item"><div class="m-value">${p.public_repos}</div><div class="m-label">Public Repos</div></div>
              <div class="meta-item"><div class="m-value">${p.public_gists}</div><div class="m-label">Public Gists</div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <h2>Details</h2>
        <table>
          <tr><td style="width:140px;font-weight:600">Company</td><td>${p.company || '—'}</td></tr>
          <tr><td style="font-weight:600">Location</td><td>${p.location || '—'}</td></tr>
          <tr><td style="font-weight:600">Blog</td><td>${p.blog ? `<a href="${p.blog}" target="_blank">${p.blog}</a>` : '—'}</td></tr>
          <tr><td style="font-weight:600">Email</td><td>${p.email || '—'}</td></tr>
          <tr><td style="font-weight:600">Twitter</td><td>${p.twitter_username ? '@' + p.twitter_username : '—'}</td></tr>
          <tr><td style="font-weight:600">Joined GitHub</td><td>${formatDate(p.github_created_at)}</td></tr>
          <tr><td style="font-weight:600">Profile URL</td><td><a href="${p.profile_url}" target="_blank">${p.profile_url}</a></td></tr>
          <tr><td style="font-weight:600">Analyzed On</td><td>${formatDate(p.created_at)}</td></tr>
        </table>
        <button class="btn btn-danger" onclick="deleteProfile('${p.username}')" style="margin-top:16px">Delete Profile</button>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="error">${err.message}</div>`;
  }
}

async function deleteProfile(username) {
  if (!confirm(`Delete ${username}?`)) return;
  try {
    const res = await fetch(`${API}/api/profiles/${username}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    viewProfiles();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    const view = nav.dataset.nav;
    if (view === 'dashboard') viewDashboard();
    else if (view === 'profiles') viewProfiles();
  }
});

viewDashboard();
