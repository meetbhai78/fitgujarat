// ========================================
// Gujarat Step Counter - API Client
// ========================================

const PRODUCTION_URL = 'https://fitgujarat.onrender.com';
let API_BASE = '/api';

// Detect mobile environment (Capacitor) or different origin to point to the production backend
if (window.Capacitor || window.location.protocol === 'file:' || (!window.location.origin.includes('localhost') && !window.location.origin.includes('onrender.com'))) {
  API_BASE = `${PRODUCTION_URL}/api`;
}

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(method, path, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const options = { method, headers };
    if (data && method !== 'GET') options.body = JSON.stringify(data);

    try {
      const response = await fetch(`${API_BASE}${path}`, options);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (HTTP ${response.status}). Please check if your backend server is running.`);
      }

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || `HTTP ${response.status}`);
      }

      return json;
    } catch (error) {
      if (error.message === 'Invalid token.' || error.message === 'Access denied. No token provided.') {
        this.clearToken();
        navigate('login');
      }
      throw error;
    }
  }

  /** Multipart/form-data request for file uploads */
  async uploadRequest(method, path, formData) {
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (HTTP ${response.status}).`);
      }

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
      return json;
    } catch (error) {
      throw error;
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async register(data) { return this.request('POST', '/auth/register', data); }
  async login(data) { return this.request('POST', '/auth/login', data); }
  async getMe() { return this.request('GET', '/auth/me'); }
  async updateLanguage(lang) { return this.request('PUT', '/auth/language', { language: lang }); }

  // ── Activity ──────────────────────────────────────────────────────────────
  async logActivity(data) { return this.request('POST', '/activity/log', data); }
  async getActivityHistory(days = 365) { return this.request('GET', `/activity/history/me?days=${days}`); }
  async getTodayActivity() { return this.request('GET', '/activity/today'); }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  async getDistrictLeaderboard(district, type) {
    return this.request('GET', `/leaderboard/district/${encodeURIComponent(district)}/${type}`);
  }
  async getStateLeaderboard(type) { return this.request('GET', `/leaderboard/state/${type}`); }

  // ── Winners ───────────────────────────────────────────────────────────────
  async getDistrictWinners(district) {
    return this.request('GET', `/winners/district/${encodeURIComponent(district)}`);
  }
  async getStateWinners() { return this.request('GET', '/winners/state'); }
  async getWinnersHistory(level, district) {
    let query = '';
    if (level) query += `level=${encodeURIComponent(level)}`;
    if (district) query += `${query ? '&' : ''}district=${encodeURIComponent(district)}`;
    return this.request('GET', `/winners/history${query ? '?' + query : ''}`);
  }
  async registerView(postId) { return this.request('POST', `/winners/${postId}/view`); }
  async registerShare(postId) { return this.request('POST', `/winners/${postId}/share`); }
  async registerLike(postId) { return this.request('POST', `/winners/${postId}/like`); }

  /** Upload image/audio to a winner post */
  async uploadWinnerMedia(postId, formData) {
    return this.uploadRequest('POST', `/winners/${postId}/media`, formData);
  }

  // ── AI ────────────────────────────────────────────────────────────────────
  async getRecommendations() { return this.request('GET', '/winners/recommendations'); }
  async sendAIChatMessage(message, history) { return this.request('POST', '/ai/chat', { message, history }); }

  // ── Admin ─────────────────────────────────────────────────────────────────
  async getAdminDashboard() { return this.request('GET', '/admin/dashboard'); }
  async triggerAdminWinners(mode = 'both') { return this.request('POST', '/admin/trigger-winners', { mode }); }
  async getAdminStats() { return this.request('GET', '/admin/stats'); }
  async getFraudFlags(status = 'pending') { return this.request('GET', `/admin/flags?status=${status}`); }
  async reviewFlag(flagId, action) { return this.request('POST', `/admin/flags/${flagId}/review`, { action }); }
  async getAdminUsers() { return this.request('GET', '/admin/users'); }
  async deleteUser(userId) { return this.request('DELETE', `/admin/users/${userId}`); }
  async editUser(userId, data) { return this.request('PUT', `/admin/users/${userId}`, data); }
  async resetUserPassword(userId, newPassword) { return this.request('POST', `/admin/users/${userId}/reset-password`, { newPassword }); }
  async freezeUser(userId, frozenUntil) { return this.request('POST', `/admin/users/${userId}/freeze`, { frozenUntil }); }
  async unfreezeUser(userId) { return this.request('POST', `/admin/users/${userId}/unfreeze`); }
  async hideUser(userId) { return this.request('POST', `/admin/users/${userId}/hide`); }
  async unhideUser(userId) { return this.request('POST', `/admin/users/${userId}/unhide`); }

  /** Get winner posts filtered by approval status (pending | approved | rejected | all) */
  async getAdminWinnerPosts(status = 'all') {
    const q = status !== 'all' ? `?status=${status}` : '';
    return this.request('GET', `/admin/winner-posts${q}`);
  }
  async approveWinnerPost(postId) { return this.request('POST', `/admin/winner-posts/${postId}/approve`); }
  async rejectWinnerPost(postId) { return this.request('POST', `/admin/winner-posts/${postId}/reject`); }
  async deleteWinnerPost(postId) { return this.request('DELETE', `/admin/winner-posts/${postId}`); }

  // ── Profile ───────────────────────────────────────────────────────────────
  async updateProfileName(name) { return this.request('PUT', '/auth/profile', { name }); }
  async uploadProfilePhoto(formData) { return this.uploadRequest('POST', '/auth/profile/photo', formData); }
  async removeProfilePhoto() { return this.request('DELETE', '/auth/profile/photo'); }

  // ── User Reports ──────────────────────────────────────────────────────────
  async reportUser(userId, reason, details) { return this.request('POST', `/auth/report/${userId}`, { reason, details }); }
  async getAdminReports(status = 'pending') { return this.request('GET', `/admin/reports?status=${status}`); }
  async dismissReport(reportId) { return this.request('POST', `/admin/reports/${reportId}/dismiss`); }
  async actionReport(reportId) { return this.request('POST', `/admin/reports/${reportId}/action`); }
  async adminRemoveUserPhoto(userId) { return this.request('DELETE', `/admin/users/${userId}/photo`); }
}

const api = new ApiClient();
