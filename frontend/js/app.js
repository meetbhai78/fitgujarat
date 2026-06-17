// ========================================
// Gujarat Step Counter - Main App & Router
// ========================================

let currentPage = 'splash';
let aiChatHistory = [];
let leaderboardSubView = 'standings';
let adminSubView = 'dashboard';
let allAdminUsers = [];
let allAdminWinners = [];
let allFraudFlags = [];

// ---- Router ----
function navigate(page) {
  currentPage = page;
  window.location.hash = page;
  renderPage(page);
}

function renderCurrentPage() {
  renderPage(currentPage);
}

function renderPage(page) {
  const container = document.getElementById('pageContainer');
  const topNav = document.getElementById('topNav');
  const bottomBar = document.getElementById('bottomBar');

  // Auth pages hide nav
  const authPages = ['splash', 'login', 'register'];
  
  // Admin role check and redirection
  const user = getUser();
  const isAdmin = user && (user.role === 'state_admin' || user.role === 'district_admin');
  
  if (isLoggedIn() && !authPages.includes(page)) {
    if (isAdmin && page !== 'admin') {
      page = 'admin';
      currentPage = 'admin';
      window.location.hash = 'admin';
    } else if (!isAdmin && page === 'admin') {
      page = 'dashboard';
      currentPage = 'dashboard';
      window.location.hash = 'dashboard';
    }
  }

  const showNav = !authPages.includes(page) && isLoggedIn();
  topNav.style.display = showNav ? 'flex' : 'none';
  bottomBar.style.display = (showNav && !isAdmin) ? 'flex' : 'none';

  if (showNav && typeof updateThemeToggleIcon === 'function') {
    updateThemeToggleIcon();
  }

  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  if (page === 'winners') {
    page = 'leaderboard';
    currentPage = 'leaderboard';
    window.location.hash = 'leaderboard';
    leaderboardSubView = 'winners';
  }

  // Render page
  switch (page) {
    case 'splash': renderSplash(container); break;
    case 'login': renderLogin(container); break;
    case 'register': renderRegister(container); break;
    case 'dashboard': renderDashboard(container); break;
    case 'activity': renderActivity(container); break;
    case 'leaderboard': renderLeaderboard(container); break;
    case 'profile': renderProfile(container); break;
    case 'admin': renderAdmin(container); break;
    default: renderDashboard(container);
  }
}

// ---- SPLASH ----
function renderSplash(container) {
  container.innerHTML = `
    <div class="splash-screen">
      <div class="splash-logo">🏃</div>
      <h1 class="splash-title">${t('appName')}</h1>
      <p class="splash-subtitle">${t('appTagline')}</p>
      <div class="splash-loader">
        <div class="loader-dots">
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    if (isLoggedIn()) {
      loadUserProfile().then(() => {
        const user = getUser();
        if (user && (user.role === 'state_admin' || user.role === 'district_admin')) {
          navigate('admin');
        } else {
          navigate('dashboard');
        }
      });
    } else {
      navigate('login');
    }
  }, 2000);
}

// ---- LOGIN ----
function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-emoji">🏃</span>
          <h1 class="logo-title">${t('appName')}</h1>
          <p class="logo-subtitle">${t('appTagline')}</p>
        </div>

        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">${t('email')} / ${t('phone')}</label>
            <input type="text" class="form-input" id="loginContact" placeholder="${t('email')} ${t('or')} ${t('phone')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('password')}</label>
            <div class="password-wrapper">
              <input type="password" class="form-input" id="loginPassword" placeholder="${t('password')}" required>
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('loginPassword', this)">👁️</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn">${t('login')}</button>
        </form>

        <div class="auth-footer">
          ${t('dontHaveAccount')} <a href="#" onclick="navigate('register')">${t('register')}</a>
        </div>
      </div>

      <div style="margin-top:24px; display:flex; justify-content:center; gap:16px; align-items:center;">
        <button class="theme-toggle-btn" onclick="toggleTheme()" style="background:var(--bg-glass-light); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:6px 12px; color:var(--text-primary); cursor:pointer; font-weight:600; font-size:12px; display:flex; align-items:center; gap:6px;">
          <span>${currentTheme === 'light' ? '🌙' : '☀️'}</span> 
          ${currentTheme === 'light' ? (currentLang === 'gu' ? 'ડાર્ક મોડ' : 'Dark Mode') : (currentLang === 'gu' ? 'લાઇટ મોડ' : 'Light Mode')}
        </button>
        <div class="lang-toggle">
          <button class="lang-btn ${currentLang==='en'?'active':''}" onclick="setLanguage('en')">English</button>
          <button class="lang-btn ${currentLang==='gu'?'active':''}" onclick="setLanguage('gu')">ગુજરાતી</button>
        </div>
      </div>
    </div>
  `;
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const contact = document.getElementById('loginContact').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = t('loading');

  try {
    const isEmail = contact.includes('@');
    const data = isEmail ? { email: contact, password } : { phone: contact, password };
    const result = await api.login(data);
    
    api.setToken(result.token);
    setUser(result.user);
    showToast(t('loginSuccess'));
    
    await loadUserProfile();
    const user = getUser();
    if (user && (user.role === 'state_admin' || user.role === 'district_admin')) {
      navigate('admin');
    } else {
      navigate('dashboard');
    }
  } catch (error) {
    showToast(error.message, 'error');
    btn.disabled = false;
    btn.textContent = t('login');
  }
}

// ---- REGISTER ----
function renderRegister(container) {
  const districtOptions = DISTRICTS.map(d => 
    `<option value="${d}">${getDistrictName(d)}</option>`
  ).join('');

  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-emoji">🏃</span>
          <h1 class="logo-title">${t('register')}</h1>
          <p class="logo-subtitle">${t('appTagline')}</p>
        </div>

        <form id="registerForm" onsubmit="handleRegister(event)">
          <div class="form-group">
            <label class="form-label">${t('name')}</label>
            <input type="text" class="form-input" id="regName" placeholder="${t('name')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('email')}</label>
            <input type="email" class="form-input" id="regEmail" placeholder="${t('email')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('phone')}</label>
            <input type="tel" class="form-input" id="regPhone" placeholder="${t('phone')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('password')}</label>
            <div class="password-wrapper">
              <input type="password" class="form-input" id="regPassword" placeholder="${t('password')}" required minlength="6">
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('regPassword', this)">👁️</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('state')}</label>
            <div class="form-state-fixed">🇮🇳 ${t('stateFixed')}</div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('district')}</label>
            <select class="form-select" id="regDistrict" required>
              <option value="">${t('selectDistrict')}</option>
              ${districtOptions}
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="regBtn">${t('register')}</button>
        </form>

        <div class="auth-footer">
          ${t('alreadyHaveAccount')} <a href="#" onclick="navigate('login')">${t('login')}</a>
        </div>
      </div>

      <div style="margin-top:24px; display:flex; justify-content:center; gap:16px; align-items:center;">
        <button class="theme-toggle-btn" onclick="toggleTheme()" style="background:var(--bg-glass-light); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:6px 12px; color:var(--text-primary); cursor:pointer; font-weight:600; font-size:12px; display:flex; align-items:center; gap:6px;">
          <span>${currentTheme === 'light' ? '🌙' : '☀️'}</span> 
          ${currentTheme === 'light' ? (currentLang === 'gu' ? 'ડાર્ક મોડ' : 'Dark Mode') : (currentLang === 'gu' ? 'લાઇટ મોડ' : 'Light Mode')}
        </button>
        <div class="lang-toggle">
          <button class="lang-btn ${currentLang==='en'?'active':''}" onclick="setLanguage('en')">English</button>
          <button class="lang-btn ${currentLang==='gu'?'active':''}" onclick="setLanguage('gu')">ગુજરાતી</button>
        </div>
      </div>
    </div>
  `;
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.textContent = t('loading');

  try {
    const data = {
      name: document.getElementById('regName').value.trim(),
      email: document.getElementById('regEmail').value.trim() || undefined,
      phone: document.getElementById('regPhone').value.trim() || undefined,
      password: document.getElementById('regPassword').value,
      district: document.getElementById('regDistrict').value
    };

    if (!data.email && !data.phone) {
      throw new Error('Either email or phone is required');
    }

    const result = await api.register(data);
    api.setToken(result.token);
    setUser(result.user);
    showToast(t('registerSuccess'));
    
    await loadUserProfile();
    const user = getUser();
    if (user && (user.role === 'state_admin' || user.role === 'district_admin')) {
      navigate('admin');
    } else {
      navigate('dashboard');
    }
  } catch (error) {
    showToast(error.message, 'error');
    btn.disabled = false;
    btn.textContent = t('register');
  }
}

// ---- DASHBOARD ----
async function renderDashboard(container) {
  const user = getUser();
  const streak = getStreak();
  if (!user) { navigate('login'); return; }

  const isFrozen = user.frozen_until && new Date(user.frozen_until) > new Date();
  
  let freezeBannerHtml = '';
  if (isFrozen) {
    freezeBannerHtml = `
      <div class="suspension-banner" id="suspensionBanner" data-until="${user.frozen_until}" style="
        background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);
        color: white; padding: 18px; border-radius: var(--radius-lg); margin-bottom: 20px;
        text-align: center; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
      ">
        <div style="font-size: 15px; font-weight: 800; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ❄️ Account Suspended (એકાઉન્ટ સસ્પેન્ડ)
        </div>
        <p style="font-size: 12px; opacity: 0.9; margin: 0 0 12px; line-height: 1.4;">
          Your account has been frozen for suspicious activity. Step synchronization is temporarily locked.
        </p>
        <div id="suspensionCountdown" style="
          font-family: monospace; font-size: 14px; font-weight: 800;
          background: rgba(0,0,0,0.25); border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 6px 14px; border-radius: 20px; display: inline-block;
        ">
          Calculating time...
        </div>
      </div>
    `;
  }

  const stepCounterHtml = isFrozen
    ? `
      <div class="step-counter card-glass" id="stepDisplay" style="padding: 30px; text-align: center; filter: grayscale(0.5); opacity: 0.85;">
        <div style="font-size: 40px; margin-bottom: 10px;">🔒</div>
        <div style="font-size: 14px; font-weight: 700; color: var(--danger);">Steps Sync Locked</div>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">Please wait until suspension ends to sync steps.</p>
      </div>
    `
    : `
      <div class="step-counter card-glass" id="stepDisplay">
        ${generateStepRing(0)}
        <button class="sync-btn" onclick="handleSyncSteps()">
          <span>🔄</span> ${t('syncSteps')}
        </button>
      </div>
    `;

  container.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <p class="page-subtitle">${getGreeting()}, ${user.name?.split(' ')[0] || ''} 👋</p>
        <h1 class="page-title">${t('todaySteps')}</h1>
      </div>

      ${freezeBannerHtml}
      ${stepCounterHtml}

      <div class="stat-grid">
        <div class="stat-card primary">
          <div class="stat-icon"><span class="flame-animation">🔥</span></div>
          <div class="stat-value" id="streakValue">${streak?.current_streak || 0}</div>
          <div class="stat-label">${t('currentStreak')}</div>
        </div>
        <div class="stat-card accent">
          <div class="stat-icon">📊</div>
          <div class="stat-value" id="scoreValue">-</div>
          <div class="stat-label">${t('totalScore')}</div>
        </div>
        <div class="stat-card secondary">
          <div class="stat-icon">🏅</div>
          <div class="stat-value" id="districtRankValue">-</div>
          <div class="stat-label">${t('districtRank')}</div>
        </div>
        <div class="stat-card" style="--stat-color: var(--info);">
          <div class="stat-icon">🌟</div>
          <div class="stat-value" id="stateRankValue">-</div>
          <div class="stat-label">${t('stateRank')}</div>
        </div>
      </div>

      <div class="card" id="recPreview">
        <div class="section-title"><span class="title-icon">🤖</span> ${t('recommendations')}</div>
        <div id="dashRecList" class="loading-spinner"><div class="spinner"></div></div>
      </div>

      ${generateAIChatHTML()}
    </div>
  `;

  // Load today's data
  loadDashboardData(user);
  initAIChatBox();

  if (isFrozen) {
    startSuspensionCountdown();
  }
}

function startSuspensionCountdown() {
  const el = document.getElementById('suspensionCountdown');
  const banner = document.getElementById('suspensionBanner');
  if (!el || !banner) return;

  const untilStr = banner.dataset.until;
  if (!untilStr) return;

  const untilDate = new Date(untilStr).getTime();

  function update() {
    const now = new Date().getTime();
    const diff = untilDate - now;

    if (diff <= 0) {
      showToast('🎉 Your account suspension has expired! You can now log steps.', 'success');
      api.getMe().then(updatedUser => {
        saveUser(updatedUser.user);
        renderDashboard(document.getElementById('pageContainer'));
      }).catch(() => {
        location.reload();
      });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let displayStr = '';
    if (days > 0) displayStr += `${days}d `;
    displayStr += `${hours}h ${minutes}m ${seconds}s`;

    el.textContent = `⏳ Unlocks in: ${displayStr}`;
    
    if (document.getElementById('suspensionCountdown') === el) {
      setTimeout(update, 1000);
    }
  }

  update();
}

async function loadDashboardData(user) {
  try {
    const isFrozen = user.frozen_until && new Date(user.frozen_until) > new Date();
    // Load today's activity
    const todayData = await api.getTodayActivity();
    if (todayData.activity && !isFrozen) {
      const steps = todayData.activity.raw_value;
      document.getElementById('stepDisplay').innerHTML = `
        ${generateStepRing(steps)}
        <p style="text-align:center; color:var(--text-secondary); font-size:13px; margin-top:8px;">
          ${t('score')}: <strong style="color:var(--accent);">${todayData.activity.calculated_score}</strong>
        </p>
        <button class="sync-btn" onclick="handleSyncSteps()" style="margin-top:16px;">
          <span>🔄</span> ${t('syncSteps')}
        </button>
      `;
    }

    // Load history stats
    const history = await api.getActivityHistory(30);
    document.getElementById('scoreValue').textContent = formatNumber(history.stats?.totalScore || 0);

    // Load rankings
    try {
      const distLB = await api.getDistrictLeaderboard(user.district, 'overall');
      document.getElementById('districtRankValue').textContent = distLB.userRank ? `#${distLB.userRank}` : '-';
    } catch(e) { /* no data yet */ }

    try {
      const stateLB = await api.getStateLeaderboard('overall');
      document.getElementById('stateRankValue').textContent = stateLB.userRank ? `#${stateLB.userRank}` : '-';
    } catch(e) { /* no data yet */ }

    // Load recommendations
    try {
      const recs = await api.getRecommendations();
      const recList = document.getElementById('dashRecList');
      recList.classList.remove('loading-spinner');
      if (recs.recommendations && recs.recommendations.length > 0) {
        recList.innerHTML = recs.recommendations.slice(0, 3).map(r => `
          <div class="rec-card">
            <div class="rec-icon">${r.icon}</div>
            <div class="rec-text">${currentLang === 'gu' ? r.gu : r.en}</div>
          </div>
        `).join('');
      } else {
        recList.innerHTML = `<p class="text-muted" style="font-size:13px;">${t('noData')}</p>`;
      }
    } catch(e) {
      const recList = document.getElementById('dashRecList');
      recList.classList.remove('loading-spinner');
      recList.innerHTML = `<p class="text-muted" style="font-size:13px;">${t('noData')}</p>`;
    }
  } catch (error) {
    console.error('Dashboard data error:', error);
  }
}

async function handleSyncSteps() {
  const syncBtn = document.querySelector('.sync-btn');
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>⏳</span> ${t('readingSensor')}`;
  }

  try {
    if (isNativeApp() && isSensorAvailable()) {
      // Native App: force hardware sensor sync
      const syncResult = await forceSync();
      if (syncResult.success) {
        showToast(`${syncResult.steps.toLocaleString()} ${t('steps')} ${t('logged')}!`);
      } else {
        throw new Error(syncResult.reason || 'Failed to read sensor');
      }
    } else {
      // Web Browser / No Sensor: sync the currently accumulated simulated steps
      // Add a tiny random walk increment (5-15 steps) immediately to show the click resolved
      const increment = Math.floor(Math.random() * 11) + 5;
      _liveStepCount += increment;
      
      // Perform immediate sync of current _liveStepCount
      await autoSyncStepsToBackend();
      showToast(`${_liveStepCount.toLocaleString()} ${t('steps')} ${t('logged')}!`);
      
      // Force refresh of the active view
      if (currentPage === 'dashboard') {
        renderDashboard(document.getElementById('pageContainer'));
      } else if (currentPage === 'activity') {
        loadActivityData();
      }
    }
  } catch (error) {
    showToast(error.message || 'Sync failed', 'error');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `<span>🔄</span> ${t('syncSteps')}`;
    }
  }
}

/**
 * Submit step count to the backend API
 */
async function submitStepCount(steps, source) {
  try {
    const user = getUser();
    const payload = {
      step_count: steps,
      device_id: source + '-' + (user?._id || 'unknown')
    };

    // Attach GPS if available
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        payload.gps_lat = pos.coords.latitude;
        payload.gps_lng = pos.coords.longitude;
      } catch (e) { /* GPS not available, that's fine */ }
    }

    const result = await api.logActivity(payload);

    showToast(`${steps.toLocaleString()} ${t('steps')} ${t('logged')}! ${t('score')}: ${result.scoring?.totalScore || 0}`);

    if (result.newBadge) {
      showToast(`🎉 New badge: ${result.newBadge.name}!`, 'info');
    }

    if (result.streak) setStreak(result.streak);
    
    if (currentPage === 'dashboard') {
      renderDashboard(document.getElementById('pageContainer'));
    } else if (currentPage === 'activity') {
      loadActivityData();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ---- ACTIVITY ----
async function renderActivity(container) {
  const user = getUser();
  if (!user) { navigate('login'); return; }

  container.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">${t('activity')}</h1>
        <p class="page-subtitle">${t('activityHistory')}</p>
      </div>

      <div class="card">
        <div class="section-title"><span class="title-icon">🔄</span> ${t('syncSteps')}</div>
        <div style="text-align:center; padding:16px 0;">
          <p style="color:var(--text-secondary); margin-bottom:16px; font-size:14px;">
            ${isSensorAvailable() ? 'Auto-syncing steps from your phone\'s pedometer sensor.' : 'Pedometer sensor not available. (Web/Demo mode will simulate automatic sync)'}
          </p>
          <button class="btn btn-primary sync-btn" onclick="handleSyncSteps()" style="margin: 0 auto; display: flex; align-items: center; gap: 8px;">
            <span>🔄</span> ${t('syncSteps')}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="section-title"><span class="title-icon">📅</span> ${t('streakCalendar')}</div>
        <div id="heatmapContainer" class="loading-spinner"><div class="spinner"></div></div>
      </div>

      <div class="card">
        <div class="section-title"><span class="title-icon">📊</span> ${t('activityHistory')}</div>
        <div class="stat-grid" id="activityStats" style="margin-bottom:16px;"></div>
        <div id="activityList" class="loading-spinner"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  loadActivityData();
}

async function loadActivityData() {
  try {
    const data = await api.getActivityHistory(365);
    
    // Heatmap
    const heatmapContainer = document.getElementById('heatmapContainer');
    heatmapContainer.classList.remove('loading-spinner');
    heatmapContainer.innerHTML = generateHeatmap(data.heatmapData || {});
    
    // Stats
    document.getElementById('activityStats').innerHTML = `
      <div class="stat-card primary">
        <div class="stat-value">${formatNumber(data.stats?.totalSteps || 0)}</div>
        <div class="stat-label">${t('steps')}</div>
      </div>
      <div class="stat-card accent">
        <div class="stat-value">${formatNumber(data.stats?.avgSteps || 0)}</div>
        <div class="stat-label">${t('avgSteps')}</div>
      </div>
      <div class="stat-card secondary">
        <div class="stat-value">${formatNumber(data.stats?.maxSteps || 0)}</div>
        <div class="stat-label">${t('bestDay')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.stats?.daysLogged || 0}</div>
        <div class="stat-label">${t('daysLogged')}</div>
      </div>
    `;

    // History list
    const activityList = document.getElementById('activityList');
    activityList.classList.remove('loading-spinner');
    const activities = data.activities || [];
    if (activities.length === 0) {
      activityList.innerHTML = `
        <div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">${t('noActivityYet')}</div></div>
      `;
    } else {
      activityList.innerHTML = activities.slice(0, 20).map(a => `
        <div class="rank-item" style="margin-bottom:8px;">
          <div style="flex:1;">
            <div class="rank-name">${formatDate(a.date)}</div>
            <div class="rank-district">${a.raw_value.toLocaleString()} ${t('steps')} ${a.is_flagged ? '⚠️' : ''}</div>
          </div>
          <div class="rank-value">${a.calculated_score}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Activity load error:', error);
  }
}

// ---- LEADERBOARD ----
let lbType = 'overall';
let lbLevel = 'district';

async function renderLeaderboard(container) {
  const user = getUser();
  if (!user) { navigate('login'); return; }

  container.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">${t('leaderboard')}</h1>
        <p class="page-subtitle">${getDistrictName(user.district)}</p>
      </div>

      <!-- Segmented View Toggle -->
      <div class="segmented-control">
        <button class="segment-btn ${leaderboardSubView === 'standings' ? 'active' : ''}" onclick="switchLeaderboardSubView('standings')">
          📊 ${currentLang === 'gu' ? 'સ્ટેન્ડિંગ્સ' : 'Live Standings'}
        </button>
        <button class="segment-btn ${leaderboardSubView === 'winners' ? 'active' : ''}" onclick="switchLeaderboardSubView('winners')">
          🌟 ${t('winners')}
        </button>
      </div>

      <div id="leaderboardViewShell"></div>
    </div>
  `;

  renderLeaderboardSubView();
}

function switchLeaderboardSubView(view) {
  leaderboardSubView = view;
  renderLeaderboard(document.getElementById('pageContainer'));
}

async function renderLeaderboardSubView() {
  const shell = document.getElementById('leaderboardViewShell');
  if (!shell) return;

  const user = getUser();
  if (!user) return;

  if (leaderboardSubView === 'standings') {
    shell.innerHTML = `
      <div class="leaderboard-tabs">
        <button class="lb-tab ${lbType==='overall'?'active':''}" onclick="switchLBType('overall')">${t('overallScore')}</button>
        <button class="lb-tab ${lbType==='streak'?'active':''}" onclick="switchLBType('streak')">${t('streakLB')}</button>
        <button class="lb-tab ${lbType==='peak_day'?'active':''}" onclick="switchLBType('peak_day')">${t('peakDay')}</button>
      </div>

      <div class="level-toggle">
        <button class="level-btn ${lbLevel==='district'?'active':''}" onclick="switchLBLevel('district')">🏘️ ${t('districtLevel')}</button>
        <button class="level-btn ${lbLevel==='state'?'active':''}" onclick="switchLBLevel('state')">🌟 ${t('stateLevel')}</button>
      </div>

      <div id="leaderboardContent" class="loading-spinner"><div class="spinner"></div></div>
    `;
    loadLeaderboard();
  } else {
    shell.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(167,139,250,0.05)); border:1px solid rgba(99,102,241,0.15); border-radius:12px; padding:12px 16px; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
        <span style="font-size:20px;">📅</span>
        <div>
          <div style="font-size:13px; font-weight:700; color:var(--text-primary);">${currentLang === 'gu' ? 'સ્ટ્રીક અઠવાડિક & માસિક' : 'Weekly District + Monthly State Winners'}</div>
          <div style="font-size:11px; color:var(--text-secondary);">District winners updated every week · State winner updated every month</div>
        </div>
      </div>

      <div class="section-title"><span class="title-icon">📅</span> ${t('districtWinners')} — ${getDistrictName(user.district)} <span style="font-size:11px; color:var(--text-muted); font-weight:500;">(Weekly)</span></div>
      <div id="districtWinnerCards" class="loading-spinner"><div class="spinner"></div></div>

      <div class="section-title mt-lg"><span class="title-icon">🌟</span> ${t('stateWinners')} <span style="font-size:11px; color:var(--text-muted); font-weight:500;">(Monthly)</span></div>
      <div id="stateWinnerCards" class="loading-spinner"><div class="spinner"></div></div>

      <div class="section-title mt-lg"><span class="title-icon">⏳</span> ${t('pastWinnersHistory')}</div>
      <div id="pastWinnersCards" class="loading-spinner"><div class="spinner"></div></div>
    `;
    loadWinners(user);
  }
}

function switchLBType(type) { lbType = type; renderLeaderboard(document.getElementById('pageContainer')); }
function switchLBLevel(level) { lbLevel = level; renderLeaderboard(document.getElementById('pageContainer')); }

async function loadLeaderboard() {
  const user = getUser();
  try {
    let data;
    if (lbLevel === 'district') {
      data = await api.getDistrictLeaderboard(user.district, lbType);
    } else {
      data = await api.getStateLeaderboard(lbType);
    }

    const rankings = data.leaderboard?.rankings || [];
    const container = document.getElementById('leaderboardContent');
    container.classList.remove('loading-spinner');

    if (rankings.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-text">${t('noData')}</div></div>`;
      return;
    }

    // Podium (top 3)
    const top3 = rankings.slice(0, 3);
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
    
    let podiumHtml = '<div class="podium">';
    podiumOrder.forEach((entry, i) => {
      const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
      const isYou = entry.user_id === data.userId;
      podiumHtml += `
        <div class="podium-item">
          <div class="podium-avatar" ${isYou ? 'style="border-color:var(--primary);"' : ''}>${getInitials(entry.name)}</div>
          <div class="podium-name" ${isYou ? 'style="color:var(--primary);"' : ''}>${entry.name || 'User'}</div>
          <div class="podium-score">${formatNumber(entry.value)}</div>
          <div class="podium-bar">${actualRank}</div>
        </div>
      `;
    });
    podiumHtml += '</div>';

    // Rank list (4+)
    let listHtml = '<div class="rank-list">';
    rankings.slice(3).forEach(entry => {
      const isYou = entry.user_id === data.userId;
      listHtml += `
        <div class="rank-item ${isYou ? 'is-you' : ''}">
          <div class="rank-number">${entry.rank}</div>
          <div class="rank-info">
            <div class="rank-name">${entry.name || 'User'}</div>
            <div class="rank-district">${getDistrictName(entry.district || '')}</div>
          </div>
          <div class="rank-value">${formatNumber(entry.value)}</div>
        </div>
      `;
    });
    listHtml += '</div>';

    container.innerHTML = podiumHtml + listHtml;

    // Your position bar
    if (data.userRank) {
      container.innerHTML += `
        <div class="your-position">
          <div>
            <div class="pos-label">${t('yourPosition')}</div>
            <div class="pos-rank">#${data.userRank}</div>
          </div>
          <div style="font-size:14px;color:var(--text-secondary);">${lbLevel === 'district' ? getDistrictName(user.district) : t('stateLevel')}</div>
        </div>
      `;
    }

  } catch (error) {
    console.error('Leaderboard error:', error);
    const container = document.getElementById('leaderboardContent');
    if (container) {
      container.classList.remove('loading-spinner');
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-text">${t('noData')}</div></div>`;
    }
  }
}

// ---- WINNERS ----
async function renderWinners(container) {
  const user = getUser();
  if (!user) { navigate('login'); return; }

  container.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">${t('winnerFeed')}</h1>
        <p class="page-subtitle">${t('districtWinners')} & ${t('stateWinners')}</p>
      </div>

      <div class="section-title"><span class="title-icon">🏘️</span> ${t('districtWinners')} - ${getDistrictName(user.district)}</div>
      <div id="districtWinnerCards" class="loading-spinner"><div class="spinner"></div></div>

      <div class="section-title mt-lg"><span class="title-icon">🌟</span> ${t('stateWinners')}</div>
      <div id="stateWinnerCards" class="loading-spinner"><div class="spinner"></div></div>
    </div>
  `;

  loadWinners(user);
}

async function loadWinners(user) {
  try {
    // Weekly district winners
    const distData = await api.getDistrictWinners(user.district);
    const distCards = document.getElementById('districtWinnerCards');
    if (distCards) distCards.classList.remove('loading-spinner');
    if (distData.winners && distData.winners.length > 0) {
      distCards.innerHTML = distData.winners.map(w => renderWinnerCard(w)).join('');
    } else {
      distCards.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-text">${t('noData')}</div></div>`;
    }

    // Monthly state winners
    const stateData = await api.getStateWinners();
    const stateCards = document.getElementById('stateWinnerCards');
    if (stateCards) stateCards.classList.remove('loading-spinner');
    if (stateData.winners && stateData.winners.length > 0) {
      stateCards.innerHTML = stateData.winners.map(w => renderWinnerCard(w)).join('');
    } else {
      stateCards.innerHTML = `<div class="empty-state"><div class="empty-icon">🌟</div><div class="empty-text">${t('noData')}</div></div>`;
    }

    // Past winners history
    const historyData = await api.getWinnersHistory();
    const historyCards = document.getElementById('pastWinnersCards');
    if (historyCards) historyCards.classList.remove('loading-spinner');
    if (historyData.winners && historyData.winners.length > 0) {
      historyCards.innerHTML = historyData.winners.map(w => renderWinnerCard(w)).join('');
    } else {
      historyCards.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">${t('noPastWinners')}</div></div>`;
    }
  } catch (error) {
    console.error('Winners load error:', error);
  }
}

function formatWinnerCycle(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(currentLang === 'gu' ? 'gu-IN' : 'en-IN', {
    month: 'long',
    year: 'numeric'
  });
}

function renderWinnerCard(winner) {
  const cat = getCategoryLabel(winner.category);
  const distName = winner.district ? getDistrictName(winner.district) : t('stateLevel');
  const userName = winner.userName || 'Winner';
  const user = getUser();
  const likedByList = winner.likedBy || [];
  const isLiked = user ? likedByList.includes(user._id) : false;
  const likedClass = isLiked ? 'liked' : '';
  const isOwnPost = user && String(user._id) === String(winner.userId);

  // Cadence label
  const freq = winner.frequency || 'monthly';
  const cycleStart = winner.cycleStart ? new Date(winner.cycleStart) : null;
  let cycleLabel = '';
  if (freq === 'weekly' && cycleStart) {
    const weekEnd = new Date(cycleStart);
    weekEnd.setDate(cycleStart.getDate() + 6);
    cycleLabel = `Week of ${cycleStart.toLocaleDateString('en-IN', { day:'numeric', month:'short' })}–${weekEnd.toLocaleDateString('en-IN', { day:'numeric', month:'short' })}`;
  } else if (cycleStart) {
    cycleLabel = cycleStart.toLocaleDateString(currentLang === 'gu' ? 'gu-IN' : 'en-IN', { month: 'long', year: 'numeric' });
  }

  // Frequency badge
  const freqBadge = freq === 'weekly'
    ? `<span class="freq-badge weekly">📅 Weekly</span>`
    : `<span class="freq-badge monthly">🗓️ Monthly</span>`;

  // Media section
  let mediaSection = '';
  if (winner.mediaType === 'image' && winner.mediaUrl) {
    mediaSection = `
      <div class="winner-media-wrap" onclick="event.stopPropagation()">
        <img src="${winner.mediaUrl}" alt="Winner post image" class="winner-media-img" loading="lazy" onerror="this.style.display='none'">
      </div>`;
  } else if (winner.mediaType === 'audio' && winner.mediaUrl) {
    mediaSection = `
      <div class="winner-media-wrap" onclick="event.stopPropagation()" style="padding:12px;">
        <audio controls style="width:100%; border-radius:8px;">
          <source src="${winner.mediaUrl}">
        </audio>
      </div>`;
  }

  // Caption
  const captionHtml = winner.caption
    ? `<div class="winner-caption"><span style="font-weight:700;">${userName}</span> ${winner.caption}</div>`
    : '';

  // Upload media button (only the winner sees it, and only if no media yet)
  const uploadBtn = (isOwnPost && winner.mediaType === 'none' && winner.isLive)
    ? `<button class="winner-upload-btn" onclick="event.stopPropagation(); openWinnerMediaModal('${winner.postId}', '${userName}')">
         📸 ${currentLang === 'gu' ? 'ઉજવણી પોસ્ટ કરો' : 'Share your celebration'}
       </button>`
    : '';

  return `
    <div class="winner-card ${winner.category} ig-style" onclick="handleWinnerView('${winner.postId}')">
      <!-- Instagram-style header -->
      <div class="winner-ig-header">
        <div class="winner-ig-avatar">${getInitials(userName)}</div>
        <div class="winner-ig-meta">
          <div class="winner-ig-name">${userName}</div>
          <div class="winner-ig-sub">
            <span class="winner-district-label">${winner.level === 'district' ? '🏘️ ' + distName : '🌟 Gujarat State'}</span>
            ${freqBadge}
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          <div class="winner-category-pill ${winner.category}">${cat.emoji} ${cat.text}</div>
          ${winner.isLive ? `<div class="live-badge"><div class="live-dot"></div>${t('live')}</div>` : ''}
        </div>
      </div>

      <!-- Media -->
      ${mediaSection}

      <!-- Caption -->
      ${captionHtml}

      <!-- Score band -->
      <div class="winner-score-band">
        <div>
          <div style="font-size:11px; color:var(--text-secondary);">${cycleLabel}</div>
          <div style="font-size:18px; font-weight:800; color:var(--primary); letter-spacing:-0.5px;">🏅 ${formatNumber(winner.value)} pts</div>
        </div>
        <div class="verified-badge"><span class="check">✅</span> ${t('verifiedByAI')}</div>
      </div>

      <!-- Engagement bar (IG-style) -->
      <div class="winner-ig-footer">
        <div class="winner-ig-actions">
          <button class="ig-action-btn like-btn ${likedClass}" onclick="event.stopPropagation(); handleWinnerLike('${winner.postId}')">
            <span class="like-icon">❤️</span>
            <span class="stat-num" id="like-count-${winner.postId}">${formatNumber(winner.likeCount || 0)}</span>
          </button>
          <button class="ig-action-btn" onclick="event.stopPropagation(); handleWinnerShare('${winner.postId}')">
            <span>🔗</span>
            <span>${formatNumber(winner.shareCount || 0)}</span>
          </button>
          <div class="ig-action-btn views-count">
            <span>👁️</span>
            <span>${formatNumber(winner.viewCount || 0)}</span>
          </div>
        </div>
        ${uploadBtn}
      </div>
    </div>
  `;
}

async function handleWinnerLike(postId) {
  const likeCountEl = document.getElementById(`like-count-${postId}`);
  const likeBtn = likeCountEl?.parentElement;
  if (!likeCountEl || !likeBtn) return;

  const isLiked = likeBtn.classList.contains('liked');
  let currentCount = parseInt(likeCountEl.textContent.replace(/[^0-9]/g, '')) || 0;
  
  // Optimistic UI update
  if (isLiked) {
    likeBtn.classList.remove('liked');
    likeCountEl.textContent = formatNumber(Math.max(0, currentCount - 1));
  } else {
    likeBtn.classList.add('liked');
    likeCountEl.textContent = formatNumber(currentCount + 1);
  }

  try {
    const result = await api.registerLike(postId);
    likeCountEl.textContent = formatNumber(result.like_count);
    if (result.liked) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
  } catch (error) {
    console.error('Like error:', error);
    // Revert back on failure
    if (isLiked) {
      likeBtn.classList.add('liked');
      likeCountEl.textContent = formatNumber(currentCount);
    } else {
      likeBtn.classList.remove('liked');
      likeCountEl.textContent = formatNumber(currentCount);
    }
    showToast('Failed to record like', 'error');
  }
}

async function handleWinnerView(postId) {
  try { await api.registerView(postId); } catch(e) {}
}

async function handleWinnerShare(postId) {
  try {
    await api.registerShare(postId);
    if (navigator.share) {
      await navigator.share({
        title: t('appName'),
        text: `Check out this winner on ${t('appName')}!`,
        url: window.location.href
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied!', 'info');
    }
  } catch(e) {
    showToast('Link copied!', 'info');
  }
}

// ---- WINNER MEDIA UPLOAD MODAL ----

function openWinnerMediaModal(postId, userName) {
  // Remove existing modal if any
  const existing = document.getElementById('winnerMediaModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'winnerMediaModal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px);
    display:flex; align-items:flex-end; justify-content:center; padding:0;
  `;
  modal.innerHTML = `
    <div style="background:var(--bg-card); border-radius:20px 20px 0 0; padding:24px 20px 32px; width:100%; max-width:600px; animation:slideUp 0.3s ease;">
      <div style="width:40px; height:4px; background:var(--border-color); border-radius:2px; margin:0 auto 20px;"></div>
      <div style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:6px;">📸 Share Your Celebration</div>
      <div style="font-size:13px; color:var(--text-secondary); margin-bottom:20px;">Congratulations, ${userName}! Share a photo or audio to celebrate your win. Admin will review and approve.</div>

      <!-- File picker -->
      <div id="winnerMediaPreview" style="display:none; margin-bottom:16px; border-radius:12px; overflow:hidden; border:1px solid var(--border-color);"></div>

      <label style="display:flex; align-items:center; gap:10px; border:2px dashed var(--border-color); border-radius:12px; padding:18px; cursor:pointer; transition:border-color 0.2s; margin-bottom:16px;" id="winnerMediaLabel">
        <span style="font-size:28px;">📁</span>
        <div>
          <div style="font-size:13px; font-weight:700; color:var(--text-primary);">Choose image or audio</div>
          <div style="font-size:11px; color:var(--text-muted);">JPEG, PNG, GIF, WebP, MP3, WAV, OGG · Max 20MB</div>
        </div>
        <input type="file" id="winnerMediaFile" accept="image/*,audio/*" style="display:none;" onchange="previewWinnerMedia(event)">
      </label>

      <!-- Caption -->
      <textarea id="winnerMediaCaption" maxlength="500" placeholder="Write a caption... (optional, max 500 chars)" style="
        width:100%; min-height:80px; padding:12px; border-radius:10px; border:1px solid var(--border-color);
        background:var(--bg-elevated); color:var(--text-primary); font-size:13px; resize:vertical;
        font-family:inherit; box-sizing:border-box; margin-bottom:16px;
      "></textarea>

      <div id="winnerMediaError" style="display:none; color:var(--danger); font-size:12px; margin-bottom:12px;"></div>

      <div style="display:flex; gap:10px;">
        <button onclick="submitWinnerMedia('${postId}')" id="winnerMediaSubmitBtn" class="btn btn-primary" style="flex:1; font-weight:700;">
          🚀 Submit for Approval
        </button>
        <button onclick="document.getElementById('winnerMediaModal').remove()" class="btn btn-outline" style="flex:0 0 auto; padding:12px 16px;">
          Cancel
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function previewWinnerMedia(event) {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById('winnerMediaPreview');
  const label = document.getElementById('winnerMediaLabel');
  preview.style.display = 'block';
  label.style.borderColor = 'var(--primary)';

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" style="width:100%; max-height:250px; object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
  } else if (file.type.startsWith('audio/')) {
    const url = URL.createObjectURL(file);
    preview.innerHTML = `
      <div style="padding:16px; background:var(--bg-glass-light); display:flex; align-items:center; gap:12px;">
        <span style="font-size:32px;">🎵</span>
        <div>
          <div style="font-size:13px; font-weight:700;">${file.name}</div>
          <audio controls style="width:200px; margin-top:6px;"><source src="${url}"></audio>
        </div>
      </div>
    `;
  }
}

async function submitWinnerMedia(postId) {
  const fileInput = document.getElementById('winnerMediaFile');
  const caption = document.getElementById('winnerMediaCaption')?.value?.trim() || '';
  const errorEl = document.getElementById('winnerMediaError');
  const submitBtn = document.getElementById('winnerMediaSubmitBtn');

  if (!fileInput?.files?.length && !caption) {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Please choose a file or write a caption.';
    return;
  }

  errorEl.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Uploading...';

  try {
    const formData = new FormData();
    if (fileInput?.files?.length) {
      formData.append('media', fileInput.files[0]);
    }
    formData.append('caption', caption);

    await api.uploadWinnerMedia(postId, formData);

    document.getElementById('winnerMediaModal')?.remove();
    showToast('🎉 Celebration post submitted! Awaiting admin approval.', 'success');

    // Reload winners section
    const user = getUser();
    if (user) loadWinners(user);
  } catch (error) {
    errorEl.style.display = 'block';
    errorEl.textContent = error.message || 'Upload failed. Please try again.';
    submitBtn.disabled = false;
    submitBtn.textContent = '🚀 Submit for Approval';
  }
}


async function renderProfile(container) {
  const user = getUser();
  const streak = getStreak();
  if (!user) { navigate('login'); return; }

  const badges = [
    { name: t('bronzeFlame'), icon: '🔥', days: 7, earned: (streak?.longest_streak || 0) >= 7 },
    { name: t('silverFlame'), icon: '🔥🔥', days: 30, earned: (streak?.longest_streak || 0) >= 30 },
    { name: t('goldFlame'), icon: '🔥🔥🔥', days: 100, earned: (streak?.longest_streak || 0) >= 100 },
    { name: t('diamondStreak'), icon: '💎🔥', days: 365, earned: (streak?.longest_streak || 0) >= 365 },
  ];

  container.innerHTML = `
    <div class="page-content">
      <div class="profile-header">
        <div class="profile-avatar">${getInitials(user.name)}</div>
        <h2 class="profile-name">${user.name}</h2>
        <p class="profile-district">📍 ${getDistrictName(user.district)}</p>
        <p class="profile-state">🇮🇳 ${t('stateFixed')}</p>
      </div>

      <div class="card">
        <div class="section-title"><span class="title-icon"><span class="flame-animation">🔥</span></span> ${t('streakStats')}</div>
        <div class="stat-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="stat-card primary">
            <div class="stat-value">${streak?.current_streak || 0}</div>
            <div class="stat-label">${t('currentStreak')}</div>
          </div>
          <div class="stat-card accent">
            <div class="stat-value">${streak?.longest_streak || 0}</div>
            <div class="stat-label">${t('longestStreak')}</div>
          </div>
        </div>
        <div style="display:flex; gap:12px; margin-top:12px;">
          <div class="card-glass" style="flex:1; text-align:center; padding:12px; margin:0;">
            <div style="font-size:24px;">❄️</div>
            <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">
              ${streak?.freeze_used_this_month ? t('freezeUsed') : `${streak?.freeze_available || 1} ${t('freezeAvailable')}`}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-title"><span class="title-icon">🎖️</span> ${t('badges')}</div>
        <div class="badge-grid">
          ${badges.map(b => `
            <div class="badge-item ${b.earned ? 'earned' : 'locked'}">
              <div class="badge-icon">${b.icon}</div>
              <div class="badge-name">${b.name}</div>
              <div class="badge-days">${b.days} ${t('days')}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="section-title"><span class="title-icon">🤖</span> ${t('recommendations')}</div>
        <div id="profileRecs" class="loading-spinner"><div class="spinner"></div></div>
      </div>

      ${generateAIChatHTML()}

      <div class="card">
        <div class="section-title"><span class="title-icon">⚙️</span> ${t('settings')}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <span style="font-size:14px;">${t('language')}</span>
          <div class="lang-toggle">
            <button class="lang-btn ${currentLang==='en'?'active':''}" onclick="setLanguage('en')">English</button>
            <button class="lang-btn ${currentLang==='gu'?'active':''}" onclick="setLanguage('gu')">ગુજરાતી</button>
          </div>
        </div>
        ${user.role !== 'user' ? `<button class="btn btn-secondary btn-full mb-md" onclick="navigate('admin')">🛡️ ${t('adminPanel')}</button>` : ''}
        <button class="btn btn-outline btn-full" style="border-color:var(--danger); color:var(--danger);" onclick="logoutUser()">
          🚪 ${t('logout')}
        </button>
      </div>
    </div>
  `;

  // Load recommendations
  try {
    const recs = await api.getRecommendations();
    const recContainer = document.getElementById('profileRecs');
    if (recContainer) recContainer.classList.remove('loading-spinner');
    if (recs.recommendations && recs.recommendations.length > 0) {
      recContainer.innerHTML = recs.recommendations.map(r => `
        <div class="rec-card">
          <div class="rec-icon">${r.icon}</div>
          <div class="rec-text">${currentLang === 'gu' ? r.gu : r.en}</div>
        </div>
      `).join('');
    } else {
      recContainer.innerHTML = `<p class="text-muted" style="font-size:13px;">${t('noData')}</p>`;
    }
  } catch(e) {
    const recContainer = document.getElementById('profileRecs');
    if (recContainer) {
      recContainer.classList.remove('loading-spinner');
      recContainer.innerHTML = `<p class="text-muted" style="font-size:13px;">${t('noData')}</p>`;
    }
  }

  initAIChatBox();
}

// ---- ADMIN ----
async function renderAdmin(container) {
  const user = getUser();
  if (!user || user.role === 'user') { navigate('dashboard'); return; }

  container.innerHTML = `
    <div class="page-content">
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h1 class="page-title">🛡️ ${t('adminPanel')}</h1>
          <p class="page-subtitle">${t('stateLevel')}</p>
        </div>
        <button class="btn btn-sm" style="border:1px solid var(--danger); color:var(--danger); background:none; font-weight:600; padding:6px 12px; border-radius:var(--radius-sm); font-size:12px; cursor:pointer;" onclick="logoutUser()">
          🚪 ${t('logout')}
        </button>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="admin-stats-summary" style="display:${adminSubView === 'dashboard' ? 'none' : 'grid'}; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:24px;">
        <div class="card" style="padding:14px; display:flex; align-items:center; gap:10px; margin-bottom:0;">
          <div style="font-size:22px;">👥</div>
          <div>
            <div style="font-size:11px; color:var(--text-secondary);">${t('users')}</div>
            <div id="adminStatUsersCount" style="font-size:20px; font-weight:700; color:var(--text-primary);">-</div>
          </div>
        </div>
        <div class="card" style="padding:14px; display:flex; align-items:center; gap:10px; margin-bottom:0;">
          <div style="font-size:22px;">🏆</div>
          <div>
            <div style="font-size:11px; color:var(--text-secondary);">Total Posts</div>
            <div id="adminStatWinnersCount" style="font-size:20px; font-weight:700; color:var(--text-primary);">-</div>
          </div>
        </div>
        <div class="card" style="padding:14px; display:flex; align-items:center; gap:10px; margin-bottom:0;">
          <div style="font-size:22px;">⏳</div>
          <div>
            <div style="font-size:11px; color:var(--warning);">Pending Approval</div>
            <div id="adminStatPendingCount" style="font-size:20px; font-weight:700; color:var(--warning);">-</div>
          </div>
        </div>
        <div class="card" style="padding:14px; display:flex; align-items:center; gap:10px; margin-bottom:0;">
          <div style="font-size:22px;">⚠️</div>
          <div>
            <div style="font-size:11px; color:var(--danger);">Fraud Flags</div>
            <div id="adminStatFlagCount" style="font-size:20px; font-weight:700; color:var(--danger);">-</div>
          </div>
        </div>
      </div>

      <!-- Segmented View Toggle -->
      <div class="segmented-control" style="margin-bottom: 20px;">
        <button class="segment-btn ${adminSubView === 'dashboard' ? 'active' : ''}" onclick="switchAdminSubView('dashboard')">
          📊 Dashboard
        </button>
        <button class="segment-btn ${adminSubView === 'users' ? 'active' : ''}" onclick="switchAdminSubView('users')">
          👥 ${t('users')}
        </button>
        <button class="segment-btn ${adminSubView === 'winners' ? 'active' : ''}" onclick="switchAdminSubView('winners')">
          🏆 Winners
        </button>
        <button class="segment-btn ${adminSubView === 'flags' ? 'active' : ''}" onclick="switchAdminSubView('flags')">
          ⚠️ Fraud
        </button>
      </div>

      <div id="adminTabContent"></div>
    </div>
  `;

  // Load real-time stats
  if (adminSubView !== 'dashboard') {
    loadAdminStats();
  }
  renderAdminTabContent();
}

async function loadAdminStats() {
  try {
    const stats = await api.getAdminStats();
    if (document.getElementById('adminStatUsersCount'))
      document.getElementById('adminStatUsersCount').textContent = stats.userCount ?? '-';
    if (document.getElementById('adminStatWinnersCount'))
      document.getElementById('adminStatWinnersCount').textContent = stats.winnerCount ?? '-';
    if (document.getElementById('adminStatPendingCount'))
      document.getElementById('adminStatPendingCount').textContent = stats.pendingCount ?? '-';
    if (document.getElementById('adminStatFlagCount'))
      document.getElementById('adminStatFlagCount').textContent = stats.flagCount ?? '-';
  } catch (e) {
    console.error('Failed to load admin stats:', e);
  }
}

function switchAdminSubView(view) {
  adminSubView = view;
  renderAdmin(document.getElementById('pageContainer'));
}

async function renderAdminTabContent() {
  const container = document.getElementById('adminTabContent');
  if (!container) return;

  if (adminSubView === 'dashboard') {
    renderAdminDashboard();
  } else if (adminSubView === 'users') {
    container.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
          <div class="section-title" style="margin-bottom:0;"><span class="title-icon">👥</span> ${t('users')}</div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; width:100%; justify-content:flex-end;">
            <div class="sort-bar" id="adminUserSortBar">
              <button class="sort-pill active" data-sort="newest" onclick="setUserSort(this)">📅 Newest</button>
              <button class="sort-pill" data-sort="name_asc" onclick="setUserSort(this)">🔤 A→Z</button>
              <button class="sort-pill" data-sort="name_desc" onclick="setUserSort(this)">🔤 Z→A</button>
              <button class="sort-pill" data-sort="district_asc" onclick="setUserSort(this)">📍 District</button>
            </div>
            <div style="position:relative; flex:1; min-width:180px;">
              <input type="text" id="adminUserSearchInput" class="form-input" placeholder="🔍 Search by name, phone, email, district..." style="padding: 10px 36px 10px 12px; font-size: 13px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-primary); outline: none; width:100%;" oninput="filterAdminUsersList()">
              <span id="searchClearBtn" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; color:var(--text-muted); display:none; font-size:14px;" onclick="clearAdminSearch()">✕</span>
            </div>
          </div>
        </div>
        <div id="adminUsersList" class="loading-spinner"><div class="spinner"></div></div>
      </div>
    `;
    loadAdminUsers();
  } else if (adminSubView === 'winners') {
    container.innerHTML = `
      <div class="card">
        <div class="section-title"><span class="title-icon">🏆</span> Winner Posts — Approval Queue</div>
        <div id="adminWinnersList"></div>
      </div>
    `;
    loadAdminWinners('pending');
  } else if (adminSubView === 'flags') {
    container.innerHTML = `
      <div class="card">
        <div class="section-title"><span class="title-icon">⚠️</span> Fraud Flags</div>
        <div id="fraudFlagsList" class="loading-spinner"><div class="spinner"></div></div>
      </div>
    `;
    loadFraudFlags();
  }
}

async function renderAdminDashboard() {
  const container = document.getElementById('adminTabContent');
  if (!container) return;

  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  try {
    const data = await api.getAdminDashboard();
    if (adminSubView !== 'dashboard') return;

    const summary = data.summary || {};
    const trends = data.activityTrend || [];
    const districts = data.topDistricts || [];
    const recentFlags = data.recentFlags || [];
    const system = data.systemHealth || {};

    const maxSteps = Math.max(...trends.map(trend => trend.steps), 1000);
    const sparklineHtml = trends.map(trend => {
      const pct = (trend.steps / maxSteps) * 100;
      const dateObj = new Date(trend.date);
      const dayLabel = dateObj.toLocaleDateString(currentLang === 'gu' ? 'gu-IN' : 'en-IN', { weekday: 'short' });
      const dateStr = dateObj.toLocaleDateString(currentLang === 'gu' ? 'gu-IN' : 'en-IN', { day: 'numeric', month: 'short' });
      return `
        <div class="trend-bar-wrapper">
          <div class="trend-tooltip">
            <strong>${dateStr}</strong><br>
            🏃 ${formatNumber(trend.steps)} ${t('steps')}<br>
            👥 ${trend.activeUsers} Active Users
          </div>
          <div class="trend-bar-fill" style="height: ${Math.max(pct, 5)}%;"></div>
          <div class="trend-bar-label">${dayLabel}</div>
        </div>
      `;
    }).join('');

    // Districts list
    const districtRowsHtml = districts.length > 0
      ? districts.map((d, index) => {
          const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏃';
          return `
            <tr>
              <td><span class="district-badge">${badge}</span> ${getDistrictName(d.district)}</td>
              <td style="text-align: right; font-weight: 800; color: var(--secondary);">${formatNumber(d.totalSteps)}</td>
              <td style="text-align: right; font-weight: 600; color: var(--text-primary);">${d.userCount}</td>
            </tr>
          `;
        }).join('')
      : `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">No district activities logged yet.</td></tr>`;

    // Recent Flags
    const flagsHtml = recentFlags.length > 0
      ? recentFlags.map(f => `
          <div class="alert-item" style="border-left: 4px solid var(--danger); background: var(--bg-glass-light); padding: 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="font-weight: 800; font-size: 13px; color: var(--text-primary);">${f.user_id?.name || 'User'}</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">📍 ${getDistrictName(f.user_id?.district) || 'State'} · ${f.reason}</div>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">📅 ${formatDate(f.activity_log_id?.date)} · 🏃 ${f.activity_log_id?.raw_value?.toLocaleString() || 0} steps</div>
            </div>
            <button class="btn btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="switchAdminSubView('flags')">
              Review
            </button>
          </div>
        `).join('')
      : `
          <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-glass-light); border-radius: var(--radius-md);">
            <div style="font-size: 28px; margin-bottom: 6px;">💚</div>
            <div style="font-size: 13px; font-weight: 600;">No pending fraud flags! All clear.</div>
          </div>
        `;

    container.innerHTML = `
      <div class="dashboard-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <h2 style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
            📊 Live System Overview <span style="background: rgba(29, 171, 156, 0.15); color: var(--secondary); font-size: 9px; padding: 2px 6px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(29,171,156,0.3);">Real-Time</span>
          </h2>
          <button class="btn btn-sm btn-outline" onclick="renderAdminDashboard()" style="padding: 6px 10px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; border-color: var(--border-color); color: var(--text-primary);">
            🔄 Refresh Dashboard
          </button>
        </div>
        <!-- Hero Metrics cards grid -->
        <div class="dashboard-grid-cards">
          <div class="db-stat-card">
            <div class="db-stat-icon" style="color: var(--primary);">👥</div>
            <div class="db-stat-content">
              <span class="db-stat-label">Total Users <span style="font-size:10px; opacity:0.6;">(કુલ વપરાશકર્તા)</span></span>
              <span class="db-stat-value">${summary.totalUsers?.toLocaleString() || 0}</span>
              <span class="db-stat-sub">+${summary.newUsersThisWeek || 0} this week</span>
            </div>
          </div>
          
          <div class="db-stat-card">
            <div class="db-stat-icon" style="color: var(--secondary);">🏃</div>
            <div class="db-stat-content">
              <span class="db-stat-label">Total Steps <span style="font-size:10px; opacity:0.6;">(કુલ પગલાં)</span></span>
              <span class="db-stat-value">${formatNumber(summary.totalStepsAllTime)}</span>
              <span class="db-stat-sub">🔥 ${formatNumber(summary.totalStepsToday)} today</span>
            </div>
          </div>

          <div class="db-stat-card">
            <div class="db-stat-icon" style="color: var(--accent);">🎯</div>
            <div class="db-stat-content">
              <span class="db-stat-label">Active Users <span style="font-size:10px; opacity:0.6;">(સક્રિય)</span></span>
              <span class="db-stat-value">${summary.activeToday?.toLocaleString() || 0}</span>
              <span class="db-stat-sub">⚡ Avg ${formatNumber(summary.avgStepsToday)} steps</span>
            </div>
          </div>

          <div class="db-stat-card">
            <div class="db-stat-icon" style="color: var(--danger);">⚠️</div>
            <div class="db-stat-content">
              <span class="db-stat-label">Alerts <span style="font-size:10px; opacity:0.6;">(સિસ્ટમ એલર્ટ્સ)</span></span>
              <span class="db-stat-value">${(summary.pendingFlags || 0) + (summary.pendingWinners || 0)}</span>
              <span class="db-stat-sub">${summary.pendingFlags || 0} flags · ${summary.pendingWinners || 0} pending posts</span>
            </div>
          </div>
        </div>

        <!-- 7-Day Activity Sparkline -->
        <div class="card" style="margin-bottom: 20px; padding: 18px 20px;">
          <div class="section-title" style="margin-bottom: 18px;"><span class="title-icon">📈</span> 7-Day Activity & Participation Trend</div>
          <div class="sparkline-chart-container">
            <div class="sparkline-chart">
              ${sparklineHtml}
            </div>
          </div>
        </div>

        <!-- Two Column Grid for Districts and Alerts -->
        <div class="dashboard-grid-split">
          <!-- Top Districts -->
          <div class="card" style="margin-bottom: 0; padding: 18px 20px;">
            <div class="section-title" style="margin-bottom: 14px;"><span class="title-icon">🏅</span> Top Active Districts <span style="font-size: 11px; font-weight: normal; color: var(--text-secondary); margin-left: 6px;">(જિલ્લા ક્રમ)</span></div>
            <div style="overflow-x: auto;">
              <table class="dashboard-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th style="text-align: right;">Total Steps</th>
                    <th style="text-align: right;">Active Users</th>
                  </tr>
                </thead>
                <tbody>
                  ${districtRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Alerts and Quick Actions -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Fraud Flags Alert Section -->
            <div class="card" style="margin-bottom: 0; padding: 18px 20px; flex: 1;">
              <div class="section-title" style="margin-bottom: 14px;"><span class="title-icon">🚨</span> Recent Fraud Alerts</div>
              <div class="alerts-container">
                ${flagsHtml}
              </div>
            </div>

            <!-- Administrative Tools & Health -->
            <div class="card" style="margin-bottom: 0; padding: 18px 20px;">
              <div class="section-title" style="margin-bottom: 14px;"><span class="title-icon">⚙️</span> System Health & Operations</div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-glass-light); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 12px;">
                  <span style="color: var(--text-secondary); font-weight: 500;">Database Connection</span>
                  <span class="status-badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 700;">Online</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-glass-light); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 12px;">
                  <span style="color: var(--text-secondary); font-weight: 500;">Cron Scheduler</span>
                  <span class="status-badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 700;">Active</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-glass-light); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 12px;">
                  <span style="color: var(--text-secondary); font-weight: 500;">Uptime</span>
                  <span style="font-weight: 800; color: var(--text-primary);">${formatUptime(system.serverUptime || 0)}</span>
                </div>
                
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
                  <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Manual Declarations Trigger:</div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" style="flex: 1; font-weight: 700; font-size: 12px; padding: 10px;" onclick="triggerManualWinners('weekly')">
                      Weekly Winners
                    </button>
                    <button class="btn btn-sm btn-outline" style="flex: 1; font-weight: 700; font-size: 12px; padding: 10px;" onclick="triggerManualWinners('monthly')">
                      Monthly Winners
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Failed to load admin dashboard:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 40px var(--space-md); color: var(--danger);">
        <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
        <div style="font-weight: 700; font-size: 15px; margin-bottom: 6px;">Failed to load dashboard metrics</div>
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 20px;">${error.message || 'Server error'}</div>
        <button class="btn btn-sm btn-outline" onclick="renderAdminDashboard()">🔄 Retry</button>
      </div>
    `;
  }
}

function formatUptime(seconds) {
  if (!seconds) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

async function triggerManualWinners(mode) {
  const confirmed = confirm(`Are you sure you want to manually trigger winner declaration calculation for the current ${mode} cycle? This will calculate leaders from the database and create winner post slots.`);
  if (!confirmed) return;

  showToast('⏳ Calculating winners...', 'info');
  try {
    const result = await api.triggerAdminWinners(mode);
    showToast(`🎉 ${result.message}`, 'success');
    renderAdminDashboard();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Failed to trigger winners.', 'error');
  }
}

async function loadFraudFlags() {
  const container = document.getElementById('fraudFlagsList');
  if (!container) return;

  container.classList.add('loading-spinner');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const data = await api.getFraudFlags();
    allFraudFlags = data.flags || [];
    container.classList.remove('loading-spinner');
    sortAndRenderFraudFlags();
  } catch (error) {
    console.error('Fraud flags error:', error);
    if (container) {
      container.classList.remove('loading-spinner');
      container.innerHTML = `<p class="text-muted" style="text-align:center;">Failed to load fraud flags.</p>`;
    }
  }
}

function sortAndRenderFraudFlags() {
  const container = document.getElementById('fraudFlagsList');
  if (!container) return;

  const sortBar = document.getElementById('adminFlagSortBar');
  const sortBy = sortBar ? (sortBar.querySelector('.sort-pill.active')?.dataset.sort || 'newest') : 'newest';

  const sortHeaderHtml = `
    <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
      <div class="sort-bar" id="adminFlagSortBar">
        <button class="sort-pill ${sortBy==='newest'?'active':''}" data-sort="newest" onclick="setFlagSort(this)">📅 Newest</button>
        <button class="sort-pill ${sortBy==='steps_desc'?'active':''}" data-sort="steps_desc" onclick="setFlagSort(this)">🏃 Steps</button>
        <button class="sort-pill ${sortBy==='name_asc'?'active':''}" data-sort="name_asc" onclick="setFlagSort(this)">🔤 A→Z</button>
      </div>
    </div>
  `;

  if (allFraudFlags.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">${t('noData')}</div></div>`;
    return;
  }

  // Sort flags
  const sorted = [...allFraudFlags];
  if (sortBy === 'steps_desc') {
    sorted.sort((a, b) => (b.activity_log_id?.raw_value || 0) - (a.activity_log_id?.raw_value || 0));
  } else if (sortBy === 'name_asc') {
    sorted.sort((a, b) => (a.user_id?.name || '').localeCompare(b.user_id?.name || ''));
  } else if (sortBy === 'newest') {
    sorted.sort((a, b) => new Date(b.created_at || b.reviewed_at || 0) - new Date(a.created_at || a.reviewed_at || 0));
  }

  container.innerHTML = sortHeaderHtml + `
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${sorted.map(flag => `
        <div class="rank-item" style="margin-bottom:0; flex-wrap:wrap; display:flex; justify-content:space-between; align-items:center;">
          <div style="flex:1; min-width:200px;">
            <div class="rank-name">${flag.user_id?.name || 'User'}</div>
            <div class="rank-district">${flag.reason}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
              ${flag.activity_log_id?.date || ''} | ${flag.activity_log_id?.raw_value?.toLocaleString() || 0} ${t('steps')}
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-sm btn-success" onclick="handleFlagReview('${flag._id}', 'approved')">✅ ${t('approve')}</button>
            <button class="btn btn-sm" style="background:var(--danger); color:white;" onclick="handleFlagReview('${flag._id}', 'rejected')">❌ ${t('reject')}</button>
            <button class="btn btn-sm" style="background:var(--warning); color:white; font-weight:600;" onclick="promptFreezeUser('${flag.user_id?._id}', '${flag.user_id?.name?.replace(/'/g, "\\'")}')">❄️ Freeze</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function handleFlagReview(flagId, action) {
  try {
    await api.reviewFlag(flagId, action);
    showToast(`Flag ${action}!`);
    loadFraudFlags();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAdminUsers() {
  try {
    const data = await api.getAdminUsers();
    allAdminUsers = data.users || [];

    if (document.getElementById('adminStatUsersCount')) {
      document.getElementById('adminStatUsersCount').textContent = allAdminUsers.length;
    }

    const input = document.getElementById('adminUserSearchInput');
    if (input && input.value.trim()) {
      filterAdminUsersList();
    } else {
      renderFilteredAdminUsers(allAdminUsers);
    }
  } catch (error) {
    console.error('Failed to load admin users:', error);
    const container = document.getElementById('adminUsersList');
    if (container) {
      container.classList.remove('loading-spinner');
      container.innerHTML = `<p class="text-muted" style="text-align:center;">Failed to load users.</p>`;
    }
  }
}

function clearAdminSearch() {
  const input = document.getElementById('adminUserSearchInput');
  if (input) {
    input.value = '';
    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    renderFilteredAdminUsers(allAdminUsers);
  }
}

function setUserSort(btn) {
  document.querySelectorAll('#adminUserSortBar .sort-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterAdminUsersList();
}

function setWinnerSort(btn) {
  document.querySelectorAll('#adminWinnerSortBar .sort-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  sortAndRenderAdminWinners();
}

function setFlagSort(btn) {
  document.querySelectorAll('#adminFlagSortBar .sort-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  sortAndRenderFraudFlags();
}

function filterAdminUsersList() {
  const input = document.getElementById('adminUserSearchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  const sortBar = document.getElementById('adminUserSortBar');
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

  let filtered = allAdminUsers;
  if (query) {
    filtered = allAdminUsers.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const district = (u.district || '').toLowerCase();
      const districtName = (getDistrictName(u.district) || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query) || district.includes(query) || districtName.includes(query) || role.includes(query);
    });
  }

  // Apply sorting from active pill
  const sortBy = sortBar ? (sortBar.querySelector('.sort-pill.active')?.dataset.sort || 'newest') : 'newest';
  const sorted = [...filtered];
  if (sortBy === 'name_asc') {
    sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortBy === 'name_desc') {
    sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (sortBy === 'district_asc') {
    sorted.sort((a, b) => (getDistrictName(a.district) || '').localeCompare(getDistrictName(b.district) || ''));
  } else {
    // newest (default)
    sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  renderFilteredAdminUsers(sorted);
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function renderFilteredAdminUsers(users) {
  const container = document.getElementById('adminUsersList');
  if (!container) return;
  container.classList.remove('loading-spinner');

  if (users.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding: 24px; text-align: center;"><div class="empty-icon" style="font-size: 32px; margin-bottom: 8px;">🔍</div><div class="empty-text" style="font-size: 13px; color: var(--text-secondary);">No matching users found</div></div>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${users.map(u => {
        const initials = getInitials(u.name);
        const isFrozen = u.frozen_until && new Date(u.frozen_until) > new Date();
        
        // Role Badge Styling
        let roleBadgeStyle = 'background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); color: var(--text-secondary);';
        let roleLabel = '👤 User';
        if (u.role === 'state_admin') {
          roleBadgeStyle = 'background: rgba(255, 107, 53, 0.15); border: 1px solid var(--primary); color: var(--primary-light); font-weight: 700;';
          roleLabel = '🛡️ State Admin';
        } else if (u.role === 'district_admin') {
          roleBadgeStyle = 'background: rgba(29, 171, 156, 0.15); border: 1px solid var(--secondary); color: var(--secondary-light); font-weight: 700;';
          roleLabel = '🏘️ District Admin';
        }

        // District / address description
        let districtText = '📍 State-Level (Gujarat)';
        if (u.role === 'state_admin') {
          districtText = `🛡️ Gujarat State (${getDistrictName(u.district) || 'Gandhinagar'})`;
        } else if (u.district) {
          districtText = `📍 ${getDistrictName(u.district)} District`;
        } else {
          districtText = `📍 General Gujarat`;
        }

        return `
          <div class="card" style="margin-bottom:0; padding:16px; border: 1px solid var(--border-color); display:flex; flex-direction:column; gap:12px; transition: all 0.2s ease;">
            <!-- Top section: Avatar + Info -->
            <div style="display:flex; gap:12px; align-items:flex-start;">
              <!-- Avatar -->
              <div style="width:46px; height:46px; border-radius:50%; background: linear-gradient(135deg, var(--bg-elevated) 0%, rgba(255,255,255,0.03) 100%); border: 1.5px solid var(--border-light); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; color:var(--text-primary); flex-shrink:0; box-shadow: var(--shadow-sm);">
                ${initials}
              </div>
              
              <!-- Info details -->
              <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:6px;">
                  <div style="font-weight:700; font-size:15px; color:var(--text-primary); cursor:pointer; display:flex; align-items:center; gap:8px;" onclick="toggleUserHistoryDetail('${u._id}')">
                    ${u.name}
                    <span style="font-size:11px; font-weight:normal; opacity:0.6; background:rgba(255,255,255,0.05); padding:1px 6px; border-radius:10px;">🔍 History</span>
                  </div>
                  <span class="badge" style="font-size:10px; padding:2px 8px; border-radius:20px; ${roleBadgeStyle}">${roleLabel}</span>
                </div>
                
                <!-- District / Address -->
                <div style="font-size:12px; color:var(--primary-light); font-weight:600; margin-top:4px;">
                  ${districtText}
                </div>

                <!-- Contact Info Grid -->
                <div style="display:flex; flex-direction:column; gap:2px; margin-top:8px; font-size:12px; color:var(--text-secondary);">
                  <div style="display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    <span>✉️</span> <span>${u.email || '<span style="color:var(--text-muted); font-style:italic;">No Email</span>'}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span>📞</span> <span>${u.phone || '<span style="color:var(--text-muted); font-style:italic;">No Phone</span>'}</span>
                  </div>
                </div>

                ${isFrozen 
                  ? `<div style="margin-top:8px; padding:4px 8px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); border-radius:6px; color:var(--danger); font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                      ❄️ Frozen until ${new Date(u.frozen_until).toLocaleDateString()}
                     </div>` 
                  : ''
                }
              </div>
            </div>
            
            <!-- Actions row -->
            <div style="display:flex; gap:6px; flex-wrap:wrap; border-top: 1px solid rgba(255,255,255,0.04); padding-top:10px; justify-content:flex-end;">
              <button class="btn btn-sm" style="background:rgba(255, 107, 53, 0.1); border: 1px solid rgba(255, 107, 53, 0.25); color:var(--primary-light); font-weight:600; padding:6px 12px; border-radius:8px; font-size:12px;" onclick="promptEditUser('${u._id}', '${(u.name || '').replace(/'/g, "\\'")}', '${(u.email||'').replace(/'/g, "\\'")}', '${(u.phone||'').replace(/'/g, "\\'")}', '${u.district || ''}', '${u.role}')">
                ✏️ Edit
              </button>
              <button class="btn btn-sm" style="background:rgba(255, 255, 255, 0.03); border:1px solid var(--border-color); color:var(--text-primary); font-weight:600; padding:6px 12px; border-radius:8px; font-size:12px;" onclick="promptResetPassword('${u._id}', '${(u.name || '').replace(/'/g, "\\'")}')">
                🔑 Password
              </button>
              ${isFrozen
                ? `<button class="btn btn-sm" style="background:rgba(29, 171, 156, 0.1); border: 1px solid rgba(29, 171, 156, 0.25); color:var(--secondary-light); font-weight:600; padding:6px 12px; border-radius:8px; font-size:12px;" onclick="handleUnfreezeUser('${u._id}', '${(u.name || '').replace(/'/g, "\\'")}')">
                    🔥 Unfreeze
                   </button>`
                : `<button class="btn btn-sm" style="background:rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); color:var(--warning); font-weight:600; padding:6px 12px; border-radius:8px; font-size:12px;" onclick="promptFreezeUser('${u._id}', '${(u.name || '').replace(/'/g, "\\'")}')">
                    ❄️ Freeze
                   </button>`
              }
              <button class="btn btn-sm" style="background:rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color:var(--danger); font-weight:600; padding:6px 12px; border-radius:8px; font-size:12px;" onclick="handleDeleteUser('${u._id}', '${(u.name || '').replace(/'/g, "\\'")}')">
                🗑️ ${t('delete')}
              </button>
            </div>

            <!-- Expandable History Panel -->
            <div id="userHistoryPanel-${u._id}" style="display:none; width:100%; padding:12px; background:var(--bg-elevated); border-radius:var(--radius-md); border:1px solid var(--border-color); margin-top:8px;">
              <div style="font-size:12px; font-weight:700; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span>📈 Step Log & Fraud Flags History</span>
                <span style="cursor:pointer; font-size:10px; opacity:0.7;" onclick="toggleUserHistoryDetail('${u._id}')">❌ Close</span>
              </div>
              <div id="userHistoryContent-${u._id}" class="loading-spinner"><div class="spinner"></div></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function toggleUserHistoryDetail(userId) {
  const panel = document.getElementById(`userHistoryPanel-${userId}`);
  const content = document.getElementById(`userHistoryContent-${userId}`);
  if (!panel || !content) return;

  if (panel.style.display === 'block') {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';

  if (content.classList.contains('loading-spinner')) {
    try {
      const data = await api.request('GET', `/activity/history/${userId}`);
      content.classList.remove('loading-spinner');

      const activities = data.activities || [];
      if (activities.length === 0) {
        content.innerHTML = `<div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:12px;">No activity logged yet.</div>`;
        return;
      }

      // Identify fraud activities
      const fraudLogs = activities.filter(a => a.is_flagged);
      const fraudInfoHtml = fraudLogs.length > 0
        ? `<div style="background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.25); color:#EF4444; border-radius:6px; padding:8px 10px; font-size:11px; margin-bottom:10px; font-weight:600;">
             ⚠️ Detected ${fraudLogs.length} flagged fraud activities for this user! Inspect details below.
           </div>`
        : `<div style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.25); color:#10B981; border-radius:6px; padding:8px 10px; font-size:11px; margin-bottom:10px; font-weight:600;">
             ✅ No suspicious/fraud activity detected.
           </div>`;

      const statsHtml = `
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-bottom:12px; text-align:center;">
          <div style="background:var(--bg-glass-light); border:1px solid var(--border-light); padding:6px; border-radius:4px;">
            <div style="font-size:9px; color:var(--text-secondary);">Total Steps</div>
            <div style="font-size:12px; font-weight:700; color:var(--text-primary);">${data.stats.totalSteps.toLocaleString()}</div>
          </div>
          <div style="background:var(--bg-glass-light); border:1px solid var(--border-light); padding:6px; border-radius:4px;">
            <div style="font-size:9px; color:var(--text-secondary);">Avg Steps</div>
            <div style="font-size:12px; font-weight:700; color:var(--text-primary);">${data.stats.avgSteps.toLocaleString()}</div>
          </div>
          <div style="background:var(--bg-glass-light); border:1px solid var(--border-light); padding:6px; border-radius:4px;">
            <div style="font-size:9px; color:var(--text-secondary);">Days Logged</div>
            <div style="font-size:12px; font-weight:700; color:var(--text-primary);">${data.stats.daysLogged}</div>
          </div>
        </div>
      `;

      const listHtml = `
        <div style="max-height:220px; overflow-y:auto; font-size:11px; display:flex; flex-direction:column; gap:6px; padding-right:4px;">
          ${activities.map(a => `
            <div style="background:var(--bg-glass-light); padding:8px; border-radius:6px; border:1px solid ${a.is_flagged ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'};">
              <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:4px;">
                <span>📅 ${formatDate(a.date)}</span>
                <span style="color:${a.is_flagged ? '#EF4444' : 'var(--secondary)'};">${a.raw_value.toLocaleString()} steps</span>
              </div>
              <div style="color:var(--text-secondary); display:flex; justify-content:space-between;">
                <span>Score: ${a.calculated_score}</span>
                <span>Device: ${a.device_id || 'unknown'}</span>
              </div>
              ${a.gps_lat ? `<div style="color:var(--text-muted); font-size:9px; margin-top:2px;">📍 GPS: ${a.gps_lat.toFixed(5)}, ${a.gps_lng.toFixed(5)}</div>` : ''}
              ${a.is_flagged ? `<div style="color:#EF4444; font-weight:600; font-size:10px; margin-top:4px; border-top:1px dashed rgba(239,68,68,0.2); padding-top:4px;">⚠️ Flagged: ${a.flagged_reason || 'Suspicious Steps Limit Exceeded'}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;

      content.innerHTML = fraudInfoHtml + statsHtml + listHtml;
    } catch (error) {
      console.error(error);
      content.classList.remove('loading-spinner');
      content.innerHTML = `<div style="color:var(--danger); font-size:12px; text-align:center;">Failed to load history: ${error.message}</div>`;
    }
  }
}

function promptEditUser(userId, userName, userEmail, userPhone, userDistrict, userRole) {
  const existing = document.getElementById('adminEditUserModal');
  if (existing) existing.remove();

  const districtOptions = DISTRICTS.map(d =>
    `<option value="${d}" ${d === userDistrict ? 'selected' : ''}>${getDistrictName(d)}</option>`
  ).join('');

  const roleOptions = [
    ['user', '👤 Regular User'],
    ['district_admin', '🏘️ District Admin'],
    ['state_admin', '🛡️ State Admin']
  ].map(([val, label]) =>
    `<option value="${val}" ${val === userRole ? 'selected' : ''}>${label}</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.id = 'adminEditUserModal';
  modal.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;`;
  modal.innerHTML = `
    <div class="card" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:24px;width:100%;max-width:460px;animation:scaleUp 0.2s ease;margin:0;box-shadow:var(--shadow-lg);max-height:90vh;overflow-y:auto;">
      <h3 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:0 0 4px;">✏️ Edit User: ${userName}</h3>
      <p style="font-size:12px;color:var(--text-secondary);margin:0 0 20px;">Update user details. Leave a field blank to keep it unchanged.</p>

      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-input" id="editUserName" value="${userName || ''}" placeholder="Full Name">
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-input" id="editUserEmail" value="${userEmail || ''}" placeholder="Email">
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" class="form-input" id="editUserPhone" value="${userPhone || ''}" placeholder="Phone">
      </div>
      <div class="form-group">
        <label class="form-label">District</label>
        <select class="form-select" id="editUserDistrict">
          ${districtOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-select" id="editUserRole">
          ${roleOptions}
        </select>
      </div>
      <div id="editUserError" style="display:none;color:var(--danger);font-size:12px;margin-bottom:12px;font-weight:600;"></div>
      <div style="display:flex;gap:10px;">
        <button onclick="submitEditUser('${userId}')" class="btn btn-primary" style="flex:1;font-weight:700;">💾 Save Changes</button>
        <button onclick="document.getElementById('adminEditUserModal').remove()" class="btn btn-outline" style="flex:0 0 auto;padding:10px 16px;">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function submitEditUser(userId) {
  const errorEl = document.getElementById('editUserError');
  const data = {
    name:     document.getElementById('editUserName')?.value.trim(),
    email:    document.getElementById('editUserEmail')?.value.trim(),
    phone:    document.getElementById('editUserPhone')?.value.trim(),
    district: document.getElementById('editUserDistrict')?.value,
    role:     document.getElementById('editUserRole')?.value,
  };

  // Remove empty fields
  Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });

  try {
    const result = await api.editUser(userId, data);
    showToast(result.message || 'User updated!', 'success');
    document.getElementById('adminEditUserModal')?.remove();
    loadAdminUsers();
  } catch (error) {
    if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = error.message; }
  }
}

function promptResetPassword(userId, userName) {
  const existing = document.getElementById('adminResetPwdModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'adminResetPwdModal';
  modal.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;`;
  modal.innerHTML = `
    <div class="card" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:24px;width:100%;max-width:400px;animation:scaleUp 0.2s ease;margin:0;box-shadow:var(--shadow-lg);">
      <h3 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:0 0 4px;">🔑 Reset Password: ${userName}</h3>
      <p style="font-size:12px;color:var(--text-secondary);margin:0 0 20px;">Enter a new password for this user. Minimum 6 characters.</p>
      <div class="form-group">
        <label class="form-label">New Password</label>
        <div class="password-wrapper">
          <input type="password" class="form-input" id="resetPwdInput" placeholder="New password (min 6 chars)" minlength="6">
          <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('resetPwdInput', this)">👁️</button>
        </div>
      </div>
      <div id="resetPwdError" style="display:none;color:var(--danger);font-size:12px;margin-bottom:12px;font-weight:600;"></div>
      <div style="display:flex;gap:10px;">
        <button onclick="submitResetPassword('${userId}')" class="btn btn-primary" style="flex:1;font-weight:700;background:var(--warning);border-color:var(--warning);">🔑 Reset Password</button>
        <button onclick="document.getElementById('adminResetPwdModal').remove()" class="btn btn-outline" style="flex:0 0 auto;padding:10px 16px;">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function submitResetPassword(userId) {
  const newPassword = document.getElementById('resetPwdInput')?.value;
  const errorEl = document.getElementById('resetPwdError');
  if (!newPassword || newPassword.length < 6) {
    if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = 'Password must be at least 6 characters.'; }
    return;
  }
  try {
    const result = await api.resetUserPassword(userId, newPassword);
    showToast(result.message || 'Password reset!', 'success');
    document.getElementById('adminResetPwdModal')?.remove();
  } catch (error) {
    if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = error.message; }
  }
}

async function handleDeleteUser(userId, userName) {

  const confirmed = confirm(`${t('confirmDeleteUser') || 'Are you sure you want to delete this user and all their data?'} (${userName})`);
  if (!confirmed) return;

  try {
    await api.deleteUser(userId);
    showToast('User deleted successfully.');
    loadAdminUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function promptFreezeUser(userId, userName) {
  const existing = document.getElementById('adminFreezeModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'adminFreezeModal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.8); backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center; padding:16px;
  `;
  
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const yyyy = defaultDate.getFullYear();
  const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
  const dd = String(defaultDate.getDate()).padStart(2, '0');
  const hh = String(defaultDate.getHours()).padStart(2, '0');
  const min = String(defaultDate.getMinutes()).padStart(2, '0');
  const defaultVal = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

  modal.innerHTML = `
    <div class="card" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:24px; width:100%; max-width:440px; animation:scaleUp 0.2s ease; margin:0; box-shadow:var(--shadow-lg);">
      <h3 style="font-size:16px; font-weight:800; color:var(--text-primary); margin: 0 0 6px; display:flex; align-items:center; gap:8px;">
        ❄️ Freeze User: ${userName}
      </h3>
      <p style="font-size:12px; color:var(--text-secondary); margin: 0 0 20px; line-height: 1.4;">
        Choose a preset duration or pick a custom Date & Time to suspend this user's step logging and leaderboard updates. Unfreezing happens automatically.
      </p>

      <div style="margin-bottom:16px;">
        <label style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px; text-transform: uppercase;">Duration Presets:</label>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
          <button onclick="setFreezePreset(1)" class="btn btn-sm btn-outline" style="font-size:11px; padding:8px 0; font-weight: 700;">1 Hour</button>
          <button onclick="setFreezePreset(24)" class="btn btn-sm btn-outline" style="font-size:11px; padding:8px 0; font-weight: 700;">1 Day</button>
          <button onclick="setFreezePreset(72)" class="btn btn-sm btn-outline" style="font-size:11px; padding:8px 0; font-weight: 700;">3 Days</button>
          <button onclick="setFreezePreset(168)" class="btn btn-sm btn-outline" style="font-size:11px; padding:8px 0; font-weight: 700;">7 Days</button>
          <button onclick="setFreezePreset(720)" class="btn btn-sm btn-outline" style="font-size:11px; padding:8px 0; font-weight: 700;">30 Days</button>
          <button onclick="setFreezePreset(0)" class="btn btn-sm btn-outline" style="font-size:11px; padding:8px 0; border-color:var(--danger); color:var(--danger); font-weight: 700;">Indefinite</button>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <label for="freezeUntilInput" style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px; text-transform: uppercase;">Custom Date & Time:</label>
        <input type="datetime-local" id="freezeUntilInput" value="${defaultVal}" style="
          width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color);
          background:var(--bg-elevated); color:var(--text-primary); font-size:13px; font-family:inherit; box-sizing:border-box;
        ">
      </div>

      <div id="freezeModalError" style="display:none; color:var(--danger); font-size:11px; margin-bottom:12px; font-weight:600;"></div>

      <div style="display:flex; gap:10px;">
        <button onclick="submitUserFreeze('${userId}')" class="btn btn-primary" style="flex:1; font-weight:700; background:var(--warning); border-color:var(--warning); color:white;">
          ❄️ Freeze Account
        </button>
        <button onclick="document.getElementById('adminFreezeModal').remove()" class="btn btn-outline" style="flex:0 0 auto; padding:10px 16px;">
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  window.setFreezePreset = function(hours) {
    const input = document.getElementById('freezeUntilInput');
    if (!input) return;

    if (hours === 0) {
      const target = new Date();
      target.setFullYear(target.getFullYear() + 10);
      input.value = target.toISOString().slice(0, 16);
      return;
    }

    const target = new Date();
    target.setHours(target.getHours() + hours);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const h = String(target.getHours()).padStart(2, '0');
    const minStr = String(target.getMinutes()).padStart(2, '0');
    input.value = `${y}-${m}-${d}T${h}:${minStr}`;
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function submitUserFreeze(userId) {
  const input = document.getElementById('freezeUntilInput');
  const errorEl = document.getElementById('freezeModalError');
  if (!input || !errorEl) return;

  const targetDate = new Date(input.value);
  if (isNaN(targetDate.getTime())) {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Please select a valid date and time.';
    return;
  }

  if (targetDate <= new Date()) {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Freeze date and time must be in the future.';
    return;
  }

  errorEl.style.display = 'none';

  try {
    const result = await api.freezeUser(userId, targetDate.toISOString());
    showToast(result.message || 'User frozen successfully!', 'success');
    
    document.getElementById('adminFreezeModal')?.remove();

    if (adminSubView === 'users') {
      loadAdminUsers();
    } else if (adminSubView === 'flags') {
      loadFraudFlags();
    } else if (adminSubView === 'dashboard') {
      renderAdminDashboard();
    }
  } catch (error) {
    errorEl.style.display = 'block';
    errorEl.textContent = error.message || 'Failed to freeze user.';
  }
}

async function handleUnfreezeUser(userId, userName) {
  const confirmed = confirm(`Unfreeze user ${userName} immediately?`);
  if (!confirmed) return;

  try {
    const result = await api.unfreezeUser(userId);
    showToast(result.message || 'User unfrozen successfully.', 'success');
    
    if (adminSubView === 'users') {
      loadAdminUsers();
    } else if (adminSubView === 'flags') {
      loadFraudFlags();
    }
  } catch (error) {
    showToast(error.message || 'Failed to unfreeze user.', 'error');
  }
}

let adminWinnersFilter = 'pending';

async function loadAdminWinners(statusFilter) {
  if (statusFilter !== undefined) adminWinnersFilter = statusFilter;

  const container = document.getElementById('adminWinnersList');
  if (!container) return;

  container.classList.add('loading-spinner');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const data = await api.getAdminWinnerPosts(adminWinnersFilter);
    allAdminWinners = data.posts || [];
    container.classList.remove('loading-spinner');

    if (document.getElementById('adminStatWinnersCount')) {
      document.getElementById('adminStatWinnersCount').textContent = allAdminWinners.length;
    }

    sortAndRenderAdminWinners();
  } catch (error) {
    console.error('Failed to load admin winner posts:', error);
    if (container) {
      container.classList.remove('loading-spinner');
      container.innerHTML = `<p class="text-muted" style="text-align:center;">Failed to load winner posts.</p>`;
    }
  }
}

function sortAndRenderAdminWinners() {
  const container = document.getElementById('adminWinnersList');
  if (!container) return;

  const sortSelect = document.getElementById('adminWinnerSortBar');
  const sortBy = sortSelect ? (sortSelect.querySelector('.sort-pill.active')?.dataset.sort || 'newest') : 'newest';

  // Sub-tab filter buttons + sort bar
  const filterHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${[['pending','⏳ Pending','var(--warning)'],['approved','✅ Approved','var(--secondary)'],['rejected','❌ Rejected','var(--danger)'],['all','📋 All','var(--text-secondary)']].map(([val, label, clr]) =>
          `<button onclick="loadAdminWinners('${val}')" style="padding:6px 14px; border-radius:20px; border:1px solid ${clr}; background:${adminWinnersFilter===val ? clr : 'transparent'}; color:${adminWinnersFilter===val ? 'white' : clr}; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s;">${label}</button>`
        ).join('')}
      </div>
      <div class="sort-bar" id="adminWinnerSortBar">
        <button class="sort-pill ${sortBy==='newest'?'active':''}" data-sort="newest" onclick="setWinnerSort(this)">📅 Newest</button>
        <button class="sort-pill ${sortBy==='score_desc'?'active':''}" data-sort="score_desc" onclick="setWinnerSort(this)">🏅 Score</button>
        <button class="sort-pill ${sortBy==='name_asc'?'active':''}" data-sort="name_asc" onclick="setWinnerSort(this)">🔤 A→Z</button>
      </div>
    </div>
  `;

  if (allAdminWinners.length === 0) {
    container.innerHTML = filterHtml + `<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-text">No posts in this category</div></div>`;
    return;
  }

  // Sort posts
  const sorted = [...allAdminWinners];
  if (sortBy === 'score_desc') {
    sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
  } else if (sortBy === 'name_asc') {
    sorted.sort((a, b) => (a.user_id?.name || '').localeCompare(b.user_id?.name || ''));
  } else if (sortBy === 'newest') {
    sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  container.innerHTML = filterHtml + `
    <div style="display:flex; flex-direction:column; gap:16px;">
      ${sorted.map(p => {
        const categoryMeta = getCategoryLabel(p.category);
        const freq = p.frequency || 'monthly';
        const statusColor = p.approval_status === 'approved' ? 'var(--secondary)' : p.approval_status === 'rejected' ? 'var(--danger)' : 'var(--warning)';
        const statusEmoji = p.approval_status === 'approved' ? '✅' : p.approval_status === 'rejected' ? '❌' : '⏳';

        const cycleStart = p.cycle_start ? new Date(p.cycle_start) : null;
        let cycleLabel = '';
        if (freq === 'weekly' && cycleStart) {
          const weekEnd = new Date(cycleStart);
          weekEnd.setDate(cycleStart.getDate() + 6);
          cycleLabel = `Week of ${cycleStart.toLocaleDateString('en-IN', {day:'numeric',month:'short'})}–${weekEnd.toLocaleDateString('en-IN', {day:'numeric',month:'short'})}`;
        } else if (cycleStart) {
          cycleLabel = cycleStart.toLocaleDateString('en-IN', { month:'long', year:'numeric' });
        }

        // Media preview
        let mediaPrev = '';
        if (p.media_type === 'image' && p.media_url) {
          mediaPrev = `<img src="${p.media_url}" style="width:100%; max-height:200px; object-fit:cover; border-radius:12px; margin:10px 0; border: 1px solid var(--border-color);" onerror="this.style.display='none'">`;
        } else if (p.media_type === 'audio' && p.media_url) {
          mediaPrev = `<audio controls style="width:100%; margin:10px 0; border-radius: 8px;"><source src="${p.media_url}"></audio>`;
        } else {
          mediaPrev = `<div style="font-size:11px; color:var(--text-muted); margin:6px 0; font-style:italic;">📭 No media uploaded</div>`;
        }

        return `
          <div class="card" style="margin-bottom:0; padding:16px; border: 1px solid var(--border-color); position:relative; display:flex; flex-direction:column; gap:8px;">
            <!-- Status badge -->
            <div style="position:absolute; top:16px; right:16px; font-size:10px; font-weight:700; color:${statusColor}; background:${statusColor}20; padding:3px 10px; border-radius:20px; border:1px solid ${statusColor};">${statusEmoji} ${p.approval_status.toUpperCase()}</div>

            <!-- User info -->
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
              <div style="width:40px; height:40px; border-radius:50%; background: linear-gradient(135deg, var(--bg-elevated) 0%, rgba(255,255,255,0.03) 100%); border: 1.5px solid var(--border-light); display:flex; align-items:center; justify-content:center; font-weight:800; color:var(--text-primary); font-size:14px; box-shadow: var(--shadow-sm); flex-shrink:0;">
                ${getInitials(p.user_id?.name || '?')}
              </div>
              <div>
                <div style="font-weight:700; font-size:14px; color:var(--text-primary);">${p.user_id?.name || 'Unknown User'}</div>
                <div style="font-size:11px; color:var(--primary-light); font-weight:600; margin-top:2px;">
                  ${categoryMeta.emoji} ${categoryMeta.text} · ${p.level === 'state' ? 'State Level' : (getDistrictName(p.district) || 'District Level')}
                </div>
              </div>
            </div>

            <!-- Cycle Meta details -->
            <div style="font-size:12px; color:var(--text-secondary); display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:4px;">
              <span style="background:var(--bg-glass-light); padding:2px 8px; border-radius:6px; border:1px solid var(--border-color);">${freq === 'weekly' ? '📅 Weekly' : '🗓️ Monthly'}</span>
              <span>🏅 <strong>${(p.value || 0).toLocaleString()}</strong> pts</span>
              <span style="opacity:0.6;">· ${cycleLabel}</span>
            </div>

            ${mediaPrev}

            ${p.caption ? `<div style="font-size:13px; color:var(--text-primary); margin:6px 0; padding:10px; background:var(--bg-glass-light); border-radius:8px; border-left:3px solid var(--primary);">${p.caption}</div>` : ''}

            <!-- Action buttons -->
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; border-top: 1px solid rgba(255,255,255,0.04); padding-top:12px; justify-content:flex-end;">
              ${p.approval_status !== 'approved' ? `<button class="btn btn-sm btn-success" onclick="handleApproveWinnerPost('${p._id}')" style="min-width:80px; padding:6px 14px; border-radius:8px; font-size:12px;">✅ Approve</button>` : ''}
              ${p.approval_status !== 'rejected' ? `<button class="btn btn-sm" onclick="handleRejectWinnerPost('${p._id}')" style="min-width:80px; background:rgba(239,68,68,0.1); border:1px solid var(--danger); color:var(--danger); font-weight:600; padding:6px 14px; border-radius:8px; font-size:12px;">❌ Reject</button>` : ''}
              <button class="btn btn-sm" onclick="handleDeleteWinnerPost('${p._id}')" style="background:rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color:var(--danger); font-weight:600; padding:6px 14px; border-radius:8px; font-size:12px;">🗑️ Delete</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function handleApproveWinnerPost(postId) {
  try {
    await api.approveWinnerPost(postId);
    showToast('✅ Winner post approved! Now visible in feed.', 'success');
    loadAdminWinners();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function handleRejectWinnerPost(postId) {
  const confirmed = confirm('Reject this winner post? It will be hidden from the public feed.');
  if (!confirmed) return;
  try {
    await api.rejectWinnerPost(postId);
    showToast('Post rejected.', 'info');
    loadAdminWinners();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function handleDeleteWinnerPost(postId) {
  const confirmed = confirm(t('confirmDeletePost') || 'Are you sure you want to delete this winner post?');
  if (!confirmed) return;

  try {
    await api.deleteWinnerPost(postId);
    showToast('Winner post deleted successfully.');
    loadAdminWinners();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ---- Init ----
window.addEventListener('DOMContentLoaded', () => {
  // Set language
  document.body.classList.toggle('lang-gu', currentLang === 'gu');
  
  // Set theme icon
  if (typeof updateThemeToggleIcon === 'function') {
    updateThemeToggleIcon();
  }
  
  // Handle hash routing
  const hash = window.location.hash.replace('#', '');
  if (hash && hash !== 'splash') {
    if (isLoggedIn()) {
      loadUserProfile().then(() => navigate(hash));
    } else {
      navigate('login');
    }
  } else {
    navigate('splash');
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && hash !== currentPage) {
    currentPage = hash;
    renderPage(hash);
  }
});

// ---- AI Health Coach Chat Helpers ----
function generateAIChatHTML() {
  return `
    <div class="card premium-ai-card">
      <div class="section-title">
        <span class="title-icon">🤖</span>
        <span data-i18n="aiCoachTitle">AI Health Coach</span>
      </div>
      <div class="ai-chat-box" id="aiChatBox">
        <div class="ai-chat-msg assistant">
          👋 ${t('aiCoachGreeting')}
        </div>
      </div>
      <div class="ai-chat-input-wrapper">
        <input type="text" class="form-input ai-input" id="aiChatInput" placeholder="${t('aiChatPlaceholder')}" onkeypress="handleAIChatKeyPress(event)">
        <button class="btn btn-primary btn-sm" onclick="handleAIChatSubmit()" id="aiChatSendBtn">
          <span>📤</span>
        </button>
      </div>
    </div>
  `;
}

function appendChatMessage(sender, text) {
  const chatBox = document.getElementById('aiChatBox');
  if (!chatBox) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `ai-chat-msg ${sender}`;
  msgDiv.textContent = text;
  
  // Remove typing indicator if present
  const loader = chatBox.querySelector('.typing-indicator');
  if (loader) loader.remove();

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showAIChatTypingIndicator() {
  const chatBox = document.getElementById('aiChatBox');
  if (!chatBox) return;

  if (chatBox.querySelector('.typing-indicator')) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-chat-msg assistant typing-indicator';
  msgDiv.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleAIChatSubmit() {
  const inputEl = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSendBtn');
  if (!inputEl || !inputEl.value.trim()) return;

  const message = inputEl.value.trim();
  inputEl.value = '';

  // Append user message and push to history
  appendChatMessage('user', message);
  aiChatHistory.push({ sender: 'user', text: message });

  // Show thinking indicator
  showAIChatTypingIndicator();
  
  inputEl.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  try {
    const response = await api.sendAIChatMessage(message, aiChatHistory);
    const botText = currentLang === 'gu' ? response.gu : response.en;
    
    // Append bot response and save to history
    appendChatMessage('assistant', botText);
    aiChatHistory.push({ sender: 'assistant', text: botText });
  } catch (error) {
    console.error('AI Chat Error:', error);
    appendChatMessage('system', 'AI Health Coach is temporarily offline.');
  } finally {
    inputEl.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    inputEl.focus();
  }
}

function handleAIChatKeyPress(e) {
  if (e.key === 'Enter') {
    handleAIChatSubmit();
  }
}

function initAIChatBox() {
  const chatBox = document.getElementById('aiChatBox');
  if (!chatBox) return;

  if (aiChatHistory.length > 0) {
    chatBox.innerHTML = '';
    aiChatHistory.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-chat-msg ${msg.sender}`;
      msgDiv.textContent = msg.text;
      chatBox.appendChild(msgDiv);
    });
  } else {
    chatBox.innerHTML = `
      <div class="ai-chat-msg assistant">
        👋 ${t('aiCoachGreeting')}
      </div>
    `;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}
