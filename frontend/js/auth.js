// ========================================
// Gujarat Step Counter - Auth State
// ========================================

let currentUser = null;
let currentStreak = null;

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function getUser() {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem('user');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  return null;
}

function setUser(user) {
  currentUser = user;
  localStorage.setItem('user', JSON.stringify(user));
}

function setStreak(streak) {
  currentStreak = streak;
}

function getStreak() {
  return currentStreak;
}

async function loadUserProfile() {
  try {
    const data = await api.getMe();
    setUser(data.user);
    setStreak(data.streak);
    if (typeof initAutoStepCounter === 'function') {
      initAutoStepCounter();
    }
    return data;
  } catch (error) {
    console.error('Failed to load profile:', error);
    return null;
  }
}

function logoutUser() {
  if (typeof stopAutoStepCounter === 'function') {
    stopAutoStepCounter();
  }
  currentUser = null;
  currentStreak = null;
  api.clearToken();
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  navigate('login');
}
