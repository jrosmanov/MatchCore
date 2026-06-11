/**
 * MatchCore — app.js
 * Frontend application logic: routing, API calls, UI interactions.
 */

/* ── Config ────────────────────────────────────────────────── */
const API = 'http://localhost:5000/api';

/* ── App State ─────────────────────────────────────────────── */
const State = {
  players:     [],
  playerIndex: 0,
  events:      [],
  allEvents:   [],
  profile:     null,
  isDragging:  false,
  startX:      0,
  currentX:    0,
};

/* ══════════════════════════════════════════════════════════════
   ROUTER
══════════════════════════════════════════════════════════════ */
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(l => l.classList.remove('active'));

  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(l => l.classList.add('active'));

  if (page === 'players') loadPlayers();
  if (page === 'events')  loadEvents();
  if (page === 'profile') loadProfile();

  window.scrollTo(0, 0);
}

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
function showToast(msg, duration = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ══════════════════════════════════════════════════════════════
   CHIP SELECT
══════════════════════════════════════════════════════════════ */
function selectChip(el, groupId, cb) {
  document.querySelectorAll(`#${groupId} .filter-chip`).forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (cb) cb();
}

/* ══════════════════════════════════════════════════════════════
   PLAYERS / MATCHMAKING
══════════════════════════════════════════════════════════════ */
const MOCK_PLAYERS = [
  {
    id: 1, username: 'ZephyrVoid', level: 84, online: true,
    playstyle: 'Competitive', matches_today: 22,
    platforms: ['PC', 'PS5'], games: ['Valorant', 'Apex Legends', 'CS2'], region: 'EUW',
  },
  {
    id: 2, username: 'NovaShard', level: 61, online: true,
    playstyle: 'Casual', matches_today: 8,
    platforms: ['PC'], games: ['Minecraft', 'Stardew Valley'], region: 'NA',
  },
  {
    id: 3, username: 'IronPulse_AZ', level: 99, online: false,
    playstyle: 'Hardcore', matches_today: 41,
    platforms: ['PC', 'Xbox'], games: ['Dark Souls', 'Elden Ring', 'Sekiro'], region: 'EUW',
  },
  {
    id: 4, username: 'GhostFrame', level: 77, online: true,
    playstyle: 'Competitive', matches_today: 17,
    platforms: ['PC'], games: ['League of Legends', 'Dota 2', 'CS2'], region: 'EUW',
  },
  {
    id: 5, username: 'PixelStorm', level: 45, online: true,
    playstyle: 'Casual', matches_today: 5,
    platforms: ['PS5', 'Mobile'], games: ['FIFA 25', 'Fortnite'], region: 'MENA',
  },
  {
    id: 6, username: 'NightCrawler_KR', level: 91, online: false,
    playstyle: 'Competitive', matches_today: 33,
    platforms: ['PC'], games: ['StarCraft 2', 'League of Legends', 'Valorant'], region: 'KR',
  },
];

async function loadPlayers(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API}/players${qs ? '?' + qs : ''}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    State.players = data.players;
  } catch {
    // Fallback to mock data when backend is offline
    State.players = filterMockPlayers(params);
  }
  State.playerIndex = 0;
  renderCard();
}

function filterMockPlayers(params) {
  return MOCK_PLAYERS.filter(p => {
    if (params.region && p.region !== params.region) return false;
    if (params.playstyle && p.playstyle !== params.playstyle) return false;
    if (params.game && !p.games.some(g => g.toLowerCase().includes(params.game.toLowerCase()))) return false;
    if (params.online !== undefined && params.online !== '' && String(p.online) !== params.online) return false;
    return true;
  });
}

function renderCard() {
  const card = document.getElementById('swipe-main');
  if (!State.players.length) {
    document.getElementById('card-labels').innerHTML = '';
    document.getElementById('card-info-overlay').innerHTML = '<div class="swipe-username" style="font-size:16px;opacity:.5">Oyunçu tapılmadı</div>';
    document.getElementById('card-body').innerHTML = '<div style="color:var(--text-muted);font-size:13px">Filterləri sıfırla</div>';
    return;
  }

  const p = State.players[State.playerIndex % State.players.length];

  // Avatar placeholder with initials
  const initials = p.username.slice(0, 2).toUpperCase();
  const hue = p.username.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  document.getElementById('card-img-wrap').innerHTML = `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,hsl(${hue},40%,15%),hsl(${hue},60%,8%));">
      <span style="font-family:'Sora',sans-serif;font-size:72px;font-weight:800;
        color:hsl(${hue},70%,55%);opacity:.4;">${initials}</span>
    </div>
  `;

  // Labels
  document.getElementById('card-labels').innerHTML = `
    <span class="chip ${p.online ? 'chip-success' : 'chip-muted'}">
      ${p.online
        ? '<span style="width:7px;height:7px;border-radius:50%;background:#00ff88;display:inline-block;margin-right:4px;animation:pulse 2s infinite"></span>ONLINE'
        : 'OFFLINE'}
    </span>
    <span class="chip chip-muted">LVL ${p.level}</span>
  `;

  // Info overlay
  document.getElementById('card-info-overlay').innerHTML = `
    <div class="swipe-username">${p.username}
      <span class="material-symbols-outlined" style="color:var(--primary);font-size:18px;font-variation-settings:'FILL' 1">verified</span>
    </div>
    <div class="swipe-sub">${p.playstyle} · ${p.matches_today} match bu gün · ${p.region}</div>
  `;

  // Body
  const gameIcons = p.games.slice(0, 3).map(g =>
    `<div class="game-icon" title="${g}">${g.slice(0,3).toUpperCase()}</div>`
  ).join('');
  const platBadges = p.platforms.map(pl =>
    `<span class="chip chip-muted">${pl}</span>`
  ).join('');

  document.getElementById('card-body').innerHTML = `
    <div>
      <div class="swipe-section-label">Top Oyunlar</div>
      <div class="game-icons">${gameIcons}</div>
    </div>
    <div>
      <div class="swipe-section-label">Platformalar</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${platBadges}</div>
    </div>
  `;
}

function swipeAction(action) {
  if (!State.players.length) return;
  const card = document.getElementById('swipe-main');
  const p    = State.players[State.playerIndex % State.players.length];
  const dir  = action === 'like' ? 1 : -1;

  card.style.transition = 'transform .45s cubic-bezier(.175,.885,.32,1.275), opacity .3s';
  card.style.transform  = `translateX(${dir * 420}px) rotate(${dir * 14}deg)`;
  card.style.opacity    = '0';

  if (action === 'like') {
    showToast(`✅ ${p.username} ilə match oldun!`);
    fetch(`${API}/players/${p.id}/like`, { method: 'POST' }).catch(() => {});
  } else {
    fetch(`${API}/players/${p.id}/skip`, { method: 'POST' }).catch(() => {});
  }

  setTimeout(() => {
    State.playerIndex++;
    card.style.transition = 'none';
    card.style.transform  = 'translateX(0) rotate(0deg)';
    card.style.opacity    = '1';
    renderCard();
    requestAnimationFrame(() => {
      card.style.transition = 'transform .3s, opacity .2s';
    });
  }, 480);
}

/* Drag to swipe — mouse */
const swipeCard = document.getElementById('swipe-main');

swipeCard.addEventListener('mousedown', e => {
  State.isDragging = true;
  State.startX = e.clientX;
  swipeCard.style.transition = 'none';
});
window.addEventListener('mousemove', e => {
  if (!State.isDragging) return;
  State.currentX = e.clientX - State.startX;
  const rot = State.currentX / 22;
  swipeCard.style.transform = `translateX(${State.currentX}px) rotate(${rot}deg)`;
  if (State.currentX > 50) {
    swipeCard.style.borderColor = `rgba(0,212,255,${Math.min(State.currentX / 200, 1)})`;
  } else if (State.currentX < -50) {
    swipeCard.style.borderColor = `rgba(255,107,107,${Math.min(Math.abs(State.currentX) / 200, 1)})`;
  } else {
    swipeCard.style.borderColor = 'var(--border)';
  }
});
window.addEventListener('mouseup', () => {
  if (!State.isDragging) return;
  State.isDragging = false;
  swipeCard.style.transition = 'transform .45s cubic-bezier(.175,.885,.32,1.275), opacity .3s';
  if      (State.currentX >  150) swipeAction('like');
  else if (State.currentX < -150) swipeAction('skip');
  else {
    swipeCard.style.transform  = 'translateX(0) rotate(0deg)';
    swipeCard.style.borderColor = 'var(--border)';
  }
  State.currentX = 0;
});

/* Drag to swipe — touch */
swipeCard.addEventListener('touchstart', e => {
  State.isDragging = true;
  State.startX = e.touches[0].clientX;
}, { passive: true });
window.addEventListener('touchmove', e => {
  if (!State.isDragging) return;
  State.currentX = e.touches[0].clientX - State.startX;
  swipeCard.style.transform = `translateX(${State.currentX}px) rotate(${State.currentX / 22}deg)`;
}, { passive: true });
window.addEventListener('touchend', () => {
  if (!State.isDragging) return;
  State.isDragging = false;
  if      (State.currentX >  120) swipeAction('like');
  else if (State.currentX < -120) swipeAction('skip');
  else {
    swipeCard.style.transform = 'translateX(0)';
    swipeCard.style.borderColor = 'var(--border)';
  }
  State.currentX = 0;
});

function applyFilters() {
  const game      = document.getElementById('filter-game').value;
  const region    = document.querySelector('#filter-regions .filter-chip.active')?.dataset.val || '';
  const playstyle = document.querySelector('#filter-playstyle .filter-chip.active')?.dataset.val || '';
  const online    = document.querySelector('#filter-online .filter-chip.active')?.dataset.val || '';
  loadPlayers({ game, region, playstyle, online });
}

function resetFilters() {
  document.getElementById('filter-game').value = '';
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.val === '');
  });
  loadPlayers();
}

/* ══════════════════════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════════════════════ */
const TAG_COLORS = {
  TOURNAMENT: 'chip-error',
  CASUAL:     'chip-success',
  RANKED:     'chip-primary',
  HARDCORE:   'chip-muted',
  CUSTOM:     'chip-muted',
};

const MOCK_EVENTS = [
  {
    id: 1, title: 'Valorant 5v5 Championship', game: 'Valorant', host: 'MatchCore',
    date: '2026-06-15', time: '18:00', slots_total: 10, slots_joined: 7,
    prize: '$500', region: 'EUW', tag: 'TOURNAMENT',
  },
  {
    id: 2, title: 'Casual Friday — Minecraft Build Battle', game: 'Minecraft', host: 'NovaShard',
    date: '2026-06-13', time: '20:00', slots_total: 8, slots_joined: 3,
    prize: null, region: 'Global', tag: 'CASUAL',
  },
  {
    id: 3, title: 'CS2 Ranked Grind Night', game: 'CS2', host: 'ZephyrVoid',
    date: '2026-06-14', time: '22:00', slots_total: 5, slots_joined: 4,
    prize: null, region: 'EUW', tag: 'RANKED',
  },
  {
    id: 4, title: 'Elden Ring Boss Rush', game: 'Elden Ring', host: 'IronPulse_AZ',
    date: '2026-06-16', time: '19:00', slots_total: 4, slots_joined: 1,
    prize: null, region: 'EUW', tag: 'HARDCORE',
  },
  {
    id: 5, title: 'League of Legends Clash Night', game: 'LoL', host: 'GhostFrame',
    date: '2026-06-17', time: '21:00', slots_total: 10, slots_joined: 10,
    prize: '$200', region: 'EUW', tag: 'TOURNAMENT',
  },
  {
    id: 6, title: 'Apex Legends Friday Grind', game: 'Apex Legends', host: 'PixelStorm',
    date: '2026-06-20', time: '17:00', slots_total: 6, slots_joined: 2,
    prize: null, region: 'MENA', tag: 'CASUAL',
  },
];

async function loadEvents() {
  try {
    const res = await fetch(`${API}/events`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    State.allEvents = data.events;
  } catch {
    State.allEvents = [...MOCK_EVENTS];
  }
  State.events = [...State.allEvents];
  renderEvents(State.events);
}

function filterEvents(btn) {
  const tag = btn.dataset.tag || '';
  document.querySelectorAll('#event-filter-chips .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  State.events = tag ? State.allEvents.filter(e => e.tag === tag) : [...State.allEvents];
  renderEvents(State.events);
}

function renderEvents(events) {
  const grid = document.getElementById('events-grid');
  if (!events.length) {
    grid.innerHTML = '<p class="loading-text">Bu kateqoriyada event yoxdur.</p>';
    return;
  }
  grid.innerHTML = events.map(ev => {
    const pct  = Math.round((ev.slots_joined / ev.slots_total) * 100);
    const full = ev.slots_joined >= ev.slots_total;
    const tagClass = TAG_COLORS[ev.tag] || 'chip-muted';
    return `
      <div class="card event-card">
        <div class="event-card-top">
          <div>
            <div class="event-game">${ev.game}</div>
            <div class="event-title">${ev.title}</div>
          </div>
          <span class="chip ${tagClass}">${ev.tag}</span>
        </div>
        <div class="event-meta">
          <span><span class="material-symbols-outlined">calendar_today</span>${ev.date}</span>
          <span><span class="material-symbols-outlined">schedule</span>${ev.time}</span>
          <span><span class="material-symbols-outlined">public</span>${ev.region}</span>
        </div>
        <div class="event-slots">
          <div class="slots-bar"><div class="slots-fill" style="width:${pct}%"></div></div>
          <div class="slots-text">${ev.slots_joined}/${ev.slots_total} oyunçu · ${full ? 'Dolu' : (ev.slots_total - ev.slots_joined) + ' yer qalıb'}</div>
        </div>
        <div class="event-card-footer">
          <div class="event-host">${ev.prize ? '🏆 ' + ev.prize + ' · ' : ''}${ev.host}</div>
          <button class="btn-join" ${full ? 'disabled' : ''} onclick="joinEvent(${ev.id}, this)">
            ${full ? 'Dolu' : 'Qoşul'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function joinEvent(id, btn) {
  btn.disabled    = true;
  btn.textContent = '...';
  try {
    const res  = await fetch(`${API}/events/${id}/join`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast(`✅ ${data.event} — qoşuldun!`);
      btn.textContent = 'Qoşuldu';
      btn.style.background = '#00ff88';
      btn.style.color      = '#003';

      // Update local state
      const ev = State.allEvents.find(e => e.id === id);
      if (ev) ev.slots_joined = Math.min(ev.slots_joined + 1, ev.slots_total);
    } else {
      showToast('❌ ' + data.error);
      btn.disabled    = false;
      btn.textContent = 'Qoşul';
    }
  } catch {
    showToast('✅ Evente qoşuldun!');
    btn.textContent      = 'Qoşuldu';
    btn.style.background = '#00ff88';
    btn.style.color      = '#003';
  }
}

async function createEvent() {
  const title  = document.getElementById('new-event-title').value.trim();
  const game   = document.getElementById('new-event-game').value.trim();
  const slots  = document.getElementById('new-event-slots').value;
  const date   = document.getElementById('new-event-date').value;
  const time   = document.getElementById('new-event-time').value;
  const region = document.getElementById('new-event-region').value;
  const tag    = document.getElementById('new-event-tag').value;
  const prize  = document.getElementById('new-event-prize').value.trim() || null;

  if (!title || !game || !date) {
    showToast('❗ Ad, Oyun və Tarix mütləqdir'); return;
  }

  const payload = { title, game, slots_total: Number(slots), date, time, region, tag, prize };

  try {
    const res = await fetch(`${API}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast('❌ ' + data.error); return; }
  } catch {
    // Offline — add locally
    State.allEvents.unshift({
      ...payload, id: Date.now(), slots_joined: 0, host: 'Sən',
    });
  }

  showToast('✅ Event yaradıldı!');
  document.getElementById('modal-create').classList.remove('open');

  // Reset form
  ['new-event-title','new-event-game','new-event-prize'].forEach(id => {
    document.getElementById(id).value = '';
  });

  loadEvents();
}

/* ══════════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════════ */
const DEFAULT_PROFILE = {
  username: 'Player_One', level: 32, playstyle: 'Competitive',
  platforms: ['PC', 'PS5'], games: ['Valorant', 'CS2', 'Apex Legends', 'Elden Ring'],
  stats: { matches: 128, hours_played: 340, events_joined: 14, win_rate: 68 },
};

async function loadProfile() {
  try {
    const res = await fetch(`${API}/profile`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    State.profile = data;
    renderProfile(data);
  } catch {
    State.profile = DEFAULT_PROFILE;
    renderProfile(DEFAULT_PROFILE);
  }
}

function renderProfile(u) {
  document.getElementById('profile-username').textContent   = u.username;
  document.getElementById('profile-level').textContent      = `LVL ${u.level} · ${u.playstyle}`;
  document.getElementById('pstat-matches').textContent      = u.stats.matches;
  document.getElementById('pstat-hours').textContent        = u.stats.hours_played + 'h';
  document.getElementById('pstat-events').textContent       = u.stats.events_joined;
  document.getElementById('pstat-winrate').textContent      = (u.stats.win_rate || 0) + '%';

  document.getElementById('profile-platforms').innerHTML = u.platforms.map(p =>
    `<div class="platform-badge">${p}</div>`
  ).join('');

  document.getElementById('profile-games').innerHTML = u.games.map(g =>
    `<div class="game-card-mini">${g}</div>`
  ).join('');

  // Sync avatar
  if (u.avatar) {
    document.getElementById('profile-avatar-img').src = u.avatar;
    document.getElementById('nav-avatar-img').src     = u.avatar;
  }

  // Pre-fill edit form
  document.getElementById('edit-username').value = u.username;
  if (u.email)     document.getElementById('edit-email').value    = u.email;
  if (u.discord)   document.getElementById('edit-discord').value  = u.discord;
  if (u.bio)       document.getElementById('edit-bio').value      = u.bio;
  if (u.region) {
    const sel = document.getElementById('edit-region');
    [...sel.options].forEach(o => { if (o.value === u.region) o.selected = true; });
  }
  if (u.playstyle) {
    const sel = document.getElementById('edit-playstyle');
    [...sel.options].forEach(o => { if (o.value === u.playstyle) o.selected = true; });
  }
}

async function saveProfile() {
  const payload = {
    username:  document.getElementById('edit-username').value.trim(),
    email:     document.getElementById('edit-email').value.trim(),
    region:    document.getElementById('edit-region').value,
    language:  document.getElementById('edit-language').value,
    playstyle: document.getElementById('edit-playstyle').value,
    discord:   document.getElementById('edit-discord').value.trim(),
    bio:       document.getElementById('edit-bio').value.trim(),
    public:    document.getElementById('edit-public').checked,
  };

  if (!payload.username) { showToast('❗ İstifadəçi adı boş ola bilməz'); return; }

  try {
    const res = await fetch(`${API}/profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { showToast('❌ Profil saxlanmadı'); return; }
  } catch {
    // Offline — update local state
    if (State.profile) Object.assign(State.profile, payload);
  }

  showToast('✅ Profil yeniləndi!');
  navigate('profile');
}

function shareProfile() {
  const url = `${window.location.origin}?profile=${State.profile?.username || 'Player_One'}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('📋 Link kopyalandı!'));
  } else {
    showToast('📋 ' + url);
  }
}

/* ══════════════════════════════════════════════════════════════
   AVATAR UPLOAD (preview only — backend handles persistence)
══════════════════════════════════════════════════════════════ */
function triggerAvatarUpload() {
  document.getElementById('avatar-file-input').click();
}

function previewAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('❗ Şəkil 2MB-dan böyük ola bilməz'); return; }

  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target.result;
    document.getElementById('edit-avatar-img').src = src;
    showToast('📸 Şəkil seçildi — yadda saxlamağı unutma!');
  };
  reader.readAsDataURL(file);
}

/* ══════════════════════════════════════════════════════════════
   SETUP / ONBOARDING
══════════════════════════════════════════════════════════════ */
function setupNext(step) {
  // Validate step 1
  if (step === 2) {
    const username = document.getElementById('setup-username').value.trim();
    if (!username) { showToast('❗ İstifadəçi adını daxil et'); return; }
  }
  document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
  document.getElementById('setup-step-' + step).classList.add('active');
  for (let i = 1; i <= 3; i++) {
    document.getElementById('step-dot-' + i).classList.toggle('done', i <= step);
  }
}

function togglePlatformCard(el) {
  el.classList.toggle('selected');
}

async function finishSetup() {
  const username  = document.getElementById('setup-username').value.trim() || 'GamerTag123';
  const email     = document.getElementById('setup-email').value.trim();
  const playstyle = document.getElementById('setup-playstyle').value;
  const region    = document.getElementById('setup-region').value;

  const selectedGames = [...document.querySelectorAll('.game-select-card.selected')]
    .map(el => el.textContent.trim());
  const selectedPlatforms = [...document.querySelectorAll('.platform-card.selected')]
    .map(el => el.textContent.trim());

  const payload = {
    username, email, playstyle, region,
    games: selectedGames,
    platforms: selectedPlatforms,
    level: 1,
    stats: { matches: 0, hours_played: 0, events_joined: 0, win_rate: 0 },
  };

  try {
    await fetch(`${API}/setup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Offline — persist in localStorage
    try { localStorage.setItem('mc_profile', JSON.stringify(payload)); } catch {}
  }

  State.profile = payload;
  showToast(`🎮 Xoş gəldin, ${username}!`);
  navigate('players');
}

/* ══════════════════════════════════════════════════════════════
   HOME STATS (live from API)
══════════════════════════════════════════════════════════════ */
async function loadHomeStats() {
  try {
    const res  = await fetch(`${API}/stats`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.players)  document.getElementById('stat-players').textContent = data.players;
    if (data.events)   document.getElementById('stat-events').textContent  = data.events;
    if (data.avg_ping) document.getElementById('stat-ping').textContent    = data.avg_ping + 'ms';
  } catch { /* use default values in HTML */ }
}

/* ══════════════════════════════════════════════════════════════
   CLOSE MODAL ON OUTSIDE CLICK
══════════════════════════════════════════════════════════════ */
document.getElementById('modal-create').addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('open');
});

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
navigate('home');
loadHomeStats();
