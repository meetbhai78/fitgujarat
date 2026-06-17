// ========================================
// Gujarat Step Counter - Utilities & i18n
// ========================================

// ---- i18n System ----
const i18n = {
  en: {
    appName: 'Gujarat Step Counter',
    appTagline: 'Walk. Compete. Win.',
    login: 'Login', register: 'Register', logout: 'Logout',
    email: 'Email', phone: 'Phone', password: 'Password',
    confirmPassword: 'Confirm Password', name: 'Full Name',
    district: 'District', state: 'State',
    selectDistrict: 'Select Your District',
    stateFixed: 'Gujarat (Fixed)',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    loginSuccess: 'Login successful!', registerSuccess: 'Registration successful!',
    home: 'Home', activity: 'Activity', leaderboard: 'Leaderboard',
    winners: 'Winners', profile: 'Profile', admin: 'Admin',
    todaySteps: "Today's Steps", currentStreak: 'Current Streak',
    days: 'days', districtRank: 'District Rank', stateRank: 'State Rank',
    syncSteps: 'Sync Steps', dailyGoal: 'Daily Goal',
    logActivity: 'Log Activity', stepCount: 'Step Count',
    activityHistory: 'Activity History', streakCalendar: 'Streak Calendar',
    score: 'Score', steps: 'steps', noActivityYet: 'No activity logged yet',
    syncFromDevice: 'Sync from Device', manualEntry: 'Manual Entry',
    overallScore: 'Overall Score', streakLB: 'Streak 🔥', peakDay: 'Peak Day ⚡',
    districtLevel: 'District', stateLevel: 'State',
    rank: 'Rank', yourPosition: 'Your Position', top10: 'Top 10',
    winnerFeed: 'Winner Feed', districtWinners: 'District Winners',
    stateWinners: 'State Winners',
    topScorer: 'Top Scorer', streakLeader: 'Streak Leader',
    peakPerformer: 'Peak Performer',
    live: 'LIVE', views: 'views', shares: 'shares',
    verifiedByAI: 'Verified by AI', shareWinner: 'Share',
    pastWinnersHistory: 'Past Month Winners History',
    noPastWinners: 'No past winners record found',
    myProfile: 'My Profile', badges: 'Badges',
    streakStats: 'Streak Stats', longestStreak: 'Longest Streak',
    freezeAvailable: 'Freeze Available', freezeUsed: 'Freeze Used This Month',
    useFreeze: 'Use Freeze', recommendations: 'AI Recommendations',
    aiCoachTitle: 'AI Health Coach',
    aiCoachGreeting: 'Hello! I am your AI Health Coach. Ask me anything about your steps, streak, or health!',
    aiChatPlaceholder: 'Ask AI Coach...',
    editProfile: 'Edit Profile', settings: 'Settings', language: 'Language',
    bronzeFlame: 'Bronze Flame', silverFlame: 'Silver Flame',
    goldFlame: 'Gold Flame', diamondStreak: 'Diamond Streak',
    adminPanel: 'Admin Panel', fraudFlags: 'Fraud Flags',
    pendingReview: 'Pending Review', approved: 'Approved', rejected: 'Rejected',
    approve: 'Approve', reject: 'Reject',
    loading: 'Loading...', error: 'Error', success: 'Success',
    save: 'Save', cancel: 'Cancel', submit: 'Submit',
    noData: 'No data available', enterSteps: 'Enter step count...',
    users: 'Users', winnerPosts: 'Winner Posts', delete: 'Delete',
    confirmDeleteUser: 'Are you sure you want to delete this user and all their data?',
    confirmDeletePost: 'Are you sure you want to delete this winner post?',
    welcomeBack: 'Welcome back', goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    totalScore: 'Total Score', avgSteps: 'Avg Steps', bestDay: 'Best Day',
    daysLogged: 'Days Logged', loginToContinue: 'Login to continue',
    or: 'or', contactMethod: 'Contact Method',
    districtWinner: 'District Winner', stateWinner: 'State Winner',
    viewAll: 'View All', seeMore: 'See More',
    readingSensor: 'Reading sensor...',
    enterRealSteps: 'Enter Your Steps',
    enterRealStepsDesc: 'Enter the step count shown on your phone\'s health app or pedometer',
    logSteps: 'Log Steps',
    logged: 'logged',
  },
  gu: {
    appName: 'ગુજરાત સ્ટેપ કાઉન્ટર',
    appTagline: 'ચાલો. સ્પર્ધા કરો. જીતો.',
    login: 'લૉગિન', register: 'નોંધણી', logout: 'લૉગઆઉટ',
    email: 'ઈમેલ', phone: 'ફોન', password: 'પાસવર્ડ',
    confirmPassword: 'પાસવર્ડ ની પુષ્ટિ', name: 'પૂરું નામ',
    district: 'જિલ્લો', state: 'રાજ્ય',
    selectDistrict: 'તમારો જિલ્લો પસંદ કરો',
    stateFixed: 'ગુજરાત (નિશ્ચિત)',
    alreadyHaveAccount: 'પહેલાથી ખાતું છે?',
    dontHaveAccount: 'ખાતું નથી?',
    loginSuccess: 'લૉગિન સફળ!', registerSuccess: 'નોંધણી સફળ!',
    home: 'હોમ', activity: 'પ્રવૃત્તિ', leaderboard: 'લીડરબોર્ડ',
    winners: 'વિજેતાઓ', profile: 'પ્રોફાઈલ', admin: 'એડમિન',
    todaySteps: 'આજના પગલાં', currentStreak: 'વર્તમાન સ્ટ્રીક',
    days: 'દિવસ', districtRank: 'જિલ્લા ક્રમ', stateRank: 'રાજ્ય ક્રમ',
    syncSteps: 'પગલાં સિંક કરો', dailyGoal: 'દૈનિક લક્ષ્ય',
    logActivity: 'પ્રવૃત્તિ લોગ કરો', stepCount: 'પગલાંની સંખ્યા',
    activityHistory: 'પ્રવૃત્તિ ઇતિહાસ', streakCalendar: 'સ્ટ્રીક કેલેન્ડર',
    score: 'સ્કોર', steps: 'પગલાં', noActivityYet: 'હજુ સુધી કોઈ પ્રવૃત્તિ નથી',
    syncFromDevice: 'ઉપકરણમાંથી સિંક કરો', manualEntry: 'મેન્યુઅલ એન્ટ્રી',
    overallScore: 'કુલ સ્કોર', streakLB: 'સ્ટ્રીક 🔥', peakDay: 'શ્રેષ્ઠ દિવસ ⚡',
    districtLevel: 'જિલ્લો', stateLevel: 'રાજ્ય',
    rank: 'ક્રમ', yourPosition: 'તમારી સ્થિતિ', top10: 'ટોપ ૧૦',
    winnerFeed: 'વિજેતા ફીડ', districtWinners: 'જિલ્લા વિજેતાઓ',
    stateWinners: 'રાજ્ય વિજેતાઓ',
    topScorer: 'ટોપ સ્કોરર', streakLeader: 'સ્ટ્રીક લીડર',
    peakPerformer: 'પીક પર્ફોર્મર',
    live: 'લાઈવ', views: 'જોયું', shares: 'શેર',
    verifiedByAI: 'AI દ્વારા ચકાસાયેલ', shareWinner: 'શેર કરો',
    pastWinnersHistory: 'અગાઉના મહિનાના વિજેતાઓનો ઇતિહાસ',
    noPastWinners: 'અગાઉના કોઈ વિજેતા રેકોર્ડ મળ્યા નથી',
    myProfile: 'મારી પ્રોફાઈલ', badges: 'બેજ',
    streakStats: 'સ્ટ્રીક આંકડા', longestStreak: 'સૌથી લાંબી સ્ટ્રીક',
    freezeAvailable: 'ફ્રીઝ ઉપલબ્ધ', freezeUsed: 'આ મહિને ફ્રીઝ વપરાયેલ',
    useFreeze: 'ફ્રીઝ વાપરો', recommendations: 'AI ભલામણો',
    aiCoachTitle: 'AI હેલ્થ કોચ',
    aiCoachGreeting: 'નમસ્તે! હું તમારો AI હેલ્થ કોચ છું. તમારા પગલાં, સ્ટ્રીક અથવા આરોગ્ય વિશે મને કંઈપણ પૂછો!',
    aiChatPlaceholder: 'AI કોચને પૂછો...',
    editProfile: 'પ્રોફાઈલ સંપાદિત કરો', settings: 'સેટિંગ્સ', language: 'ભાષા',
    bronzeFlame: 'બ્રોન્ઝ ફ્લેમ', silverFlame: 'સિલ્વર ફ્લેમ',
    goldFlame: 'ગોલ્ડ ફ્લેમ', diamondStreak: 'ડાયમંડ સ્ટ્રીક',
    adminPanel: 'એડમિન પેનલ', fraudFlags: 'ફ્રોડ ફ્લેગ્સ',
    pendingReview: 'સમીક્ષા બાકી', approved: 'મંજૂર', rejected: 'નામંજૂર',
    approve: 'મંજૂર કરો', reject: 'નામંજૂર કરો',
    loading: 'લોડ થઈ રહ્યું છે...', error: 'ભૂલ', success: 'સફળ',
    save: 'સાચવો', cancel: 'રદ કરો', submit: 'સબમિટ',
    noData: 'કોઈ ડેટા ઉપલબ્ધ નથી', enterSteps: 'પગલાં દાખલ કરો...',
    users: 'વપરાશકર્તાઓ', winnerPosts: 'વિજેતા પોસ્ટ્સ', delete: 'કાઢી નાખો',
    confirmDeleteUser: 'શું તમે આ વપરાશકર્તા અને તેમનો તમામ ડેટા કાઢી નાખવા માંગો છો?',
    confirmDeletePost: 'શું તમે આ વિજેતા પોસ્ટ કાઢી નાખવા માંગો છો?',
    welcomeBack: 'પાછા આવ્યા', goodMorning: 'સુપ્રભાત',
    goodAfternoon: 'શુભ બપોર', goodEvening: 'શુભ સાંજ',
    totalScore: 'કુલ સ્કોર', avgSteps: 'સરેરાશ પગલાં', bestDay: 'શ્રેષ્ઠ દિવસ',
    daysLogged: 'લોગ કરેલ દિવસો', loginToContinue: 'ચાલુ રાખવા લૉગિન કરો',
    or: 'અથવા', contactMethod: 'સંપર્ક પદ્ધતિ',
    districtWinner: 'જિલ્લા વિજેતા', stateWinner: 'રાજ્ય વિજેતા',
    viewAll: 'બધા જુઓ', seeMore: 'વધુ જુઓ',
    readingSensor: 'સેન્સર વાંચી રહ્યું છે...',
    enterRealSteps: 'તમારા પગલાં દાખલ કરો',
    enterRealStepsDesc: 'તમારા ફોનની હેલ્થ એપ અથવા પેડોમીટર પર દેખાતી સ્ટેપ સંખ્યા દાખલ કરો',
    logSteps: 'પગલાં લોગ કરો',
    logged: 'લોગ થયા',
  }
};

let currentLang = localStorage.getItem('lang') || 'en';

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.en[key]) || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  
  // Update body class for font
  document.body.classList.toggle('lang-gu', lang === 'gu');
  
  // Update lang toggle buttons
  document.getElementById('langEn')?.classList.toggle('active', lang === 'en');
  document.getElementById('langGu')?.classList.toggle('active', lang === 'gu');
  
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Re-render current page
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  }
}

// ---- Gujarat Districts ----
const DISTRICTS = [
  'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha',
  'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod',
  'Dang', 'Devbhumi Dwarka', 'Gandhinagar', 'Gir Somnath',
  'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar',
  'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal',
  'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat',
  'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'
];

const DISTRICT_GU = {
  'Ahmedabad': 'અમદાવાદ', 'Amreli': 'અમરેલી', 'Anand': 'આણંદ',
  'Aravalli': 'અરવલ્લી', 'Banaskantha': 'બનાસકાંઠા', 'Bharuch': 'ભરૂચ',
  'Bhavnagar': 'ભાવનગર', 'Botad': 'બોટાદ', 'Chhota Udaipur': 'છોટા ઉદેપુર',
  'Dahod': 'દાહોદ', 'Dang': 'ડાંગ', 'Devbhumi Dwarka': 'દેવભૂમિ દ્વારકા',
  'Gandhinagar': 'ગાંધીનગર', 'Gir Somnath': 'ગીર સોમનાથ',
  'Jamnagar': 'જામનગર', 'Junagadh': 'જૂનાગઢ', 'Kheda': 'ખેડા',
  'Kutch': 'કચ્છ', 'Mahisagar': 'મહીસાગર', 'Mehsana': 'મહેસાણા',
  'Morbi': 'મોરબી', 'Narmada': 'નર્મદા', 'Navsari': 'નવસારી',
  'Panchmahal': 'પંચમહાલ', 'Patan': 'પાટણ', 'Porbandar': 'પોરબંદર',
  'Rajkot': 'રાજકોટ', 'Sabarkantha': 'સાબરકાંઠા', 'Surat': 'સુરત',
  'Surendranagar': 'સુરેન્દ્રનગર', 'Tapi': 'તાપી', 'Vadodara': 'વડોદરા',
  'Valsad': 'વલસાડ'
};

function getDistrictName(district) {
  if (currentLang === 'gu' && DISTRICT_GU[district]) return DISTRICT_GU[district];
  return district;
}

// ---- Formatting Helpers ----
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toLocaleString() || '0';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(currentLang === 'gu' ? 'gu-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t('goodMorning');
  if (hour < 17) return t('goodAfternoon');
  return t('goodEvening');
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// ---- Toast Notification ----
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
  }
}

// ---- Heatmap Generator ----
function generateHeatmap(heatmapData, days = 365) {
  const cells = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const data = heatmapData[dateStr];
    
    let level = 0;
    if (data) {
      const steps = data.steps;
      if (steps >= 10000) level = 4;
      else if (steps >= 7000) level = 3;
      else if (steps >= 4000) level = 2;
      else if (steps > 0) level = 1;
    }
    
    cells.push(`<div class="heatmap-cell level-${level}" title="${dateStr}: ${data ? data.steps + ' steps' : 'No data'}"></div>`);
  }
  
  return `
    <div class="heatmap-container">
      <div class="heatmap">${cells.join('')}</div>
      <div class="heatmap-legend">
        <span>Less</span>
        <div class="legend-cells">
          <div class="heatmap-cell level-0"></div>
          <div class="heatmap-cell level-1"></div>
          <div class="heatmap-cell level-2"></div>
          <div class="heatmap-cell level-3"></div>
          <div class="heatmap-cell level-4"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  `;
}

// ---- Step Ring SVG ----
function generateStepRing(steps, goal = 10000) {
  const percent = Math.min(steps / goal, 1);
  const circumference = 2 * Math.PI * 88; // radius = 88
  const offset = circumference - (percent * circumference);
  
  return `
    <div class="step-ring">
      <svg viewBox="0 0 200 200">
        <circle class="ring-bg" cx="100" cy="100" r="88"/>
        <circle class="ring-progress" cx="100" cy="100" r="88"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
          stroke="url(#stepGradient)"/>
      </svg>
      <div class="step-value">
        <div class="number">${formatNumber(steps)}</div>
        <div class="label">${t('steps')}</div>
      </div>
    </div>
  `;
}

// ---- Category Labels ----
function getCategoryLabel(category) {
  const labels = {
    top_scorer: { en: 'Top Scorer', gu: 'ટોપ સ્કોરર', emoji: '🏆' },
    streak_leader: { en: 'Streak Leader', gu: 'સ્ટ્રીક લીડર', emoji: '🔥' },
    peak_performer: { en: 'Peak Performer', gu: 'પીક પર્ફોર્મર', emoji: '⚡' }
  };
  const l = labels[category] || labels.top_scorer;
  return { text: currentLang === 'gu' ? l.gu : l.en, emoji: l.emoji };
}

// ---- Avatar Helper ----
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ---- Automatic Device Pedometer System (CapacitorPedometer) ----
// Fully automatic step counting from device hardware sensor (native app)
// or simulated background walking steps (web browser demo mode).
// NO manual text fields — prevents cheating.
// Auto-syncs to backend every 30 seconds and on app resume.

let _liveStepCount = 0;            // live step count (baseline + current session steps)
let _lastSyncedSteps = 0;          // steps at last backend sync
let _autoSyncInterval = null;      // auto-sync timer
let _sensorAvailable = false;      // whether hardware sensor is present
let _stepListenerSetup = false;    // prevent duplicate listeners
let _todayStepsBaseline = 0;       // steps already logged today before this session
let _trackingDate = "";            // date of current tracking (YYYY-MM-DD)

const AUTO_SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds for responsive automatic updates

function isNativeApp() {
  return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
}

/**
 * Initialize the automatic step counter.
 * Call this once when the app starts (after login).
 */
async function initAutoStepCounter() {
  const today = getTodayDate();
  _trackingDate = today;

  // Fetch today's baseline steps from backend or local storage
  try {
    const todayData = await api.getTodayActivity();
    _todayStepsBaseline = todayData.activity ? todayData.activity.raw_value : 0;
    _liveStepCount = _todayStepsBaseline;
    _lastSyncedSteps = _todayStepsBaseline;
  } catch (err) {
    console.warn('Failed to load baseline steps from backend:', err);
    _todayStepsBaseline = parseInt(localStorage.getItem('todayStepsBaseline') || '0');
    _liveStepCount = _todayStepsBaseline;
    _lastSyncedSteps = _todayStepsBaseline;
  }

  // 1) Initialize hardware sensor on native platforms
  if (isNativeApp()) {
    try {
      const Pedometer = window.Capacitor.Plugins.CapacitorPedometer;
      if (!Pedometer) {
        _sensorAvailable = false;
        setupWebSimulation();
        return;
      }

      // Check if sensor hardware exists
      const check = await Pedometer.isAvailable();
      _sensorAvailable = check.stepCounting;

      if (!_sensorAvailable) {
        console.warn('Step counter sensor not available on this device');
        setupWebSimulation();
        return;
      }

      // Request permissions
      try {
        const permStatus = await Pedometer.checkPermissions();
        if (permStatus.activityRecognition !== 'granted') {
          await Pedometer.requestPermissions();
        }
      } catch (e) {
        console.warn('Permission request failed:', e);
      }

      // Start tracking from hardware sensor
      await Pedometer.startMeasurementUpdates();

      // Listen for real-time step updates from native sensor
      if (!_stepListenerSetup) {
        await Pedometer.addListener('measurement', (data) => {
          // Check if date changed (midnight transition)
          const currentDate = getTodayDate();
          if (currentDate !== _trackingDate) {
            _todayStepsBaseline = 0;
            _trackingDate = currentDate;
            localStorage.setItem('todayStepsBaseline', '0');
          }

          const sessionSteps = data.numberOfSteps || 0;
          _liveStepCount = _todayStepsBaseline + sessionSteps;
          
          // Update the dashboard UI in real-time if visible
          updateLiveStepDisplay(_liveStepCount);
        });
        _stepListenerSetup = true;
      }

      console.log(`Step counter initialized. Baseline steps: ${_todayStepsBaseline}`);
    } catch (e) {
      console.error('Failed to initialize native step counter:', e);
      _sensorAvailable = false;
      setupWebSimulation();
    }
  } else {
    // 2) Initialize simulated background walking on web/browser demo mode
    _sensorAvailable = false;
    setupWebSimulation();
  }

  // Start background auto-sync timer (every 30 seconds)
  startAutoSync();

  // Sync on app resume (when user comes back to app)
  document.addEventListener('resume', () => {
    autoSyncStepsToBackend();
  });
}

/**
 * Set up automated step simulation for web/demo mode (increments steps incrementally over time)
 */
function setupWebSimulation() {
  console.log('Step counter: Pedometer sensor not available. Starting simulated auto-sync increments.');
  if (!_stepListenerSetup) {
    setInterval(() => {
      // Check if date changed (midnight transition)
      const currentDate = getTodayDate();
      if (currentDate !== _trackingDate) {
        _todayStepsBaseline = 0;
        _trackingDate = currentDate;
        localStorage.setItem('todayStepsBaseline', '0');
      }

      // Simulate a natural walking pace (add 2 to 8 random steps every 5 seconds)
      const increment = Math.floor(Math.random() * 7) + 2;
      _liveStepCount += increment;

      // Update the dashboard UI in real-time if visible
      updateLiveStepDisplay(_liveStepCount);
    }, 5000);
    _stepListenerSetup = true;
  }
}

/**
 * Update the live step count display on the dashboard
 */
function updateLiveStepDisplay(steps) {
  const display = document.getElementById('stepDisplay');
  if (display) {
    const numberEl = display.querySelector('.step-value .number');
    if (numberEl) {
      numberEl.textContent = formatNumber(steps);
    }

    // Update the ring progress
    const goal = 10000;
    const pct = Math.min(steps / goal, 1);
    const circle = display.querySelector('.ring-progress');
    if (circle) {
      const circumference = 2 * Math.PI * 88;
      circle.style.strokeDashoffset = circumference - (pct * circumference);
    }
  }
}

/**
 * Start auto-sync timer
 */
function startAutoSync() {
  if (_autoSyncInterval) clearInterval(_autoSyncInterval);
  _autoSyncInterval = setInterval(() => {
    autoSyncStepsToBackend();
  }, AUTO_SYNC_INTERVAL_MS);
}

/**
 * Auto-sync current steps to the backend
 */
async function autoSyncStepsToBackend() {
  if (_liveStepCount <= 0) return;

  // Only sync if steps have changed since last sync
  if (_liveStepCount === _lastSyncedSteps) return;

  try {
    const user = getUser();
    if (!user) return;

    const payload = {
      step_count: _liveStepCount,
      device_id: (_sensorAvailable ? 'android-sensor-' : 'web-simulated-') + (user._id || 'unknown')
    };

    // Attach GPS if available
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        payload.gps_lat = pos.coords.latitude;
        payload.gps_lng = pos.coords.longitude;
      } catch (e) { /* GPS not available */ }
    }

    const result = await api.logActivity(payload);

    _lastSyncedSteps = _liveStepCount;
    localStorage.setItem('lastSyncedSteps', String(_lastSyncedSteps));
    localStorage.setItem('todayStepsBaseline', String(_todayStepsBaseline));

    if (result.streak) setStreak(result.streak);

    console.log(`Auto-synced ${_liveStepCount} steps to backend`);
  } catch (error) {
    console.error('Auto-sync failed:', error);
  }
}

/**
 * Force an immediate sync (called by the Sync button)
 */
async function forceSync() {
  if (!isNativeApp() || !_sensorAvailable) {
    return { success: false, reason: 'no_sensor' };
  }

  try {
    // Check if date changed (midnight transition)
    const currentDate = getTodayDate();
    if (currentDate !== _trackingDate) {
      _todayStepsBaseline = 0;
      _trackingDate = currentDate;
      localStorage.setItem('todayStepsBaseline', '0');
    }

    const Pedometer = window.Capacitor.Plugins.CapacitorPedometer;
    
    // Stop and restart updates to force immediate hardware sensor read
    await Pedometer.stopMeasurementUpdates();
    await Pedometer.startMeasurementUpdates();

    // Give the sensor a tiny moment to register a reading
    await new Promise(resolve => setTimeout(resolve, 500));

    await autoSyncStepsToBackend();
    return { success: true, steps: _liveStepCount };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

/**
 * Get the current live step count
 */
function getLiveStepCount() {
  return _liveStepCount;
}

/**
 * Check if the sensor is available
 */
function isSensorAvailable() {
  return _sensorAvailable;
}

/**
 * Stop auto-sync and step counter tracking (used during logout)
 */
function stopAutoStepCounter() {
  if (_autoSyncInterval) {
    clearInterval(_autoSyncInterval);
    _autoSyncInterval = null;
  }
  if (isNativeApp() && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorPedometer) {
    try {
      window.Capacitor.Plugins.CapacitorPedometer.stopMeasurementUpdates();
    } catch (e) {
      console.warn('Failed to stop native tracking:', e);
    }
  }
  _todayStepsBaseline = 0;
  _liveStepCount = 0;
  _lastSyncedSteps = 0;
  localStorage.removeItem('todayStepsBaseline');
  localStorage.removeItem('lastSyncedSteps');
}

// ---- Theme System (Light / Dark Mode) ----
let currentTheme = localStorage.getItem('theme') || 'dark';
document.body.classList.toggle('light-theme', currentTheme === 'light');

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  document.body.classList.toggle('light-theme', currentTheme === 'light');
  updateThemeToggleIcon();
  
  // Also refresh current page to update any inline theme buttons
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  }
}

function updateThemeToggleIcon() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
  }
}
