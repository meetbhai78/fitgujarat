const User = require('../models/User');
const WinnerPost = require('../models/WinnerPost');
const Leaderboard = require('../models/Leaderboard');
const { GUJARAT_DISTRICTS } = require('../config/districts');
const { computeLeaderboards, getMonthStart, getMonthEnd } = require('./leaderboardService');

/**
 * Winner Declaration Service
 * District Winners: Weekly (Monday–Sunday cycle)
 * State Winners:   Monthly (1st–last day cycle)
 */

const CATEGORIES = ['top_scorer', 'streak_leader', 'peak_performer', 'top_referrer'];
const TYPE_MAP = {
  top_scorer: 'overall',
  streak_leader: 'streak',
  peak_performer: 'peak_day',
  top_referrer: 'referral'
};

// ─── Date helpers ──────────────────────────────────────────────────────────

/**
 * Get the most recent Monday (start of current week)
 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day); // roll back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of current week (Sunday 23:59:59)
 */
function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// ─── Main generator ────────────────────────────────────────────────────────

/**
 * Generate winners for all districts (weekly) and state (monthly)
 * Called by cron at end of each cycle
 * @param {Date} cycleStart
 * @param {Date} cycleEnd
 * @param {'weekly'|'monthly'|'both'} mode
 */
async function generateWinners(cycleStart, cycleEnd, mode = 'both') {
  const now = new Date();
  const allWinners = [];

  // ── District winners (weekly) ──────────────────────────────────────────
  if (mode === 'weekly' || mode === 'both') {
    const weekStart = cycleStart || getWeekStart(now);
    const weekEnd = cycleEnd || getWeekEnd(now);

    await computeLeaderboards(weekStart, weekEnd);

    for (const district of GUJARAT_DISTRICTS) {
      for (const category of CATEGORIES) {
        const winner = await declareWinner(district, category, weekStart, weekEnd, 'district', 'weekly');
        if (winner) allWinners.push(winner);
      }
    }
  }

  // ── State winners (monthly) ────────────────────────────────────────────
  if (mode === 'monthly' || mode === 'both') {
    const monthStart = cycleStart || getMonthStart(now);
    const monthEnd = cycleEnd || getMonthEnd(now);

    await computeLeaderboards(monthStart, monthEnd);

    for (const category of CATEGORIES) {
      const winner = await declareWinner('STATE', category, monthStart, monthEnd, 'state', 'monthly');
      if (winner) allWinners.push(winner);
    }
  }

  return allWinners;
}

// ─── Single winner declaration ─────────────────────────────────────────────

/**
 * Declare a single winner for a district/state and category
 */
async function declareWinner(district, category, cycleStart, cycleEnd, level, frequency = 'monthly') {
  const leaderboardType = TYPE_MAP[category];

  const leaderboard = await Leaderboard.findOne({
    district,
    type: leaderboardType,
    cycle_start: cycleStart,
    cycle_end: cycleEnd
  });

  if (!leaderboard || leaderboard.rankings.length === 0) return null;

  const topEntry = leaderboard.rankings[0];
  const user = await User.findById(topEntry.user_id);
  if (!user) return null;

  // Mark previous live posts as not live
  await WinnerPost.updateMany(
    {
      level,
      district: level === 'district' ? district : null,
      category,
      frequency,
      is_live: true
    },
    { is_live: false }
  );

  // Create new winner post — auto-approved, no media yet
  const winnerPost = await WinnerPost.create({
    level,
    district: level === 'district' ? district : null,
    category,
    frequency,
    user_id: topEntry.user_id,
    value: topEntry.value,
    badge_card_url: '',
    is_live: true,
    approval_status: 'approved', // system posts are auto-approved
    media_url: '',
    media_type: 'none',
    caption: '',
    view_count: 0,
    share_count: 0,
    like_count: 0,
    viewed_by: [],
    liked_by: [],
    cycle_start: cycleStart,
    cycle_end: cycleEnd
  });

  return winnerPost;
}

// ─── Engagement ────────────────────────────────────────────────────────────

async function registerView(postId, userId) {
  const post = await WinnerPost.findById(postId);
  if (!post) return null;
  if (!post.viewed_by.includes(userId)) {
    post.viewed_by.push(userId);
    post.view_count += 1;
    await post.save();
  }
  return post;
}

async function registerShare(postId) {
  return WinnerPost.findByIdAndUpdate(
    postId,
    { $inc: { share_count: 1 } },
    { new: true }
  );
}

async function registerLike(postId, userId) {
  const post = await WinnerPost.findById(postId);
  if (!post) return null;
  const idx = post.liked_by.indexOf(userId);
  if (idx === -1) {
    post.liked_by.push(userId);
    post.like_count += 1;
  } else {
    post.liked_by.splice(idx, 1);
    post.like_count = Math.max(0, post.like_count - 1);
  }
  await post.save();
  return post;
}

// ─── Getters ───────────────────────────────────────────────────────────────

/**
 * Get weekly district winner posts (only approved)
 */
async function getDistrictWinners(district) {
  return WinnerPost.find({
    level: 'district',
    frequency: 'weekly',
    district,
    is_live: true,
    approval_status: 'approved'
  }).populate('user_id', 'name profile_photo_url district').sort({ created_at: -1 });
}

/**
 * Get monthly state winner posts (only approved)
 */
async function getStateWinners() {
  return WinnerPost.find({
    level: 'state',
    frequency: 'monthly',
    is_live: true,
    approval_status: 'approved'
  }).populate('user_id', 'name profile_photo_url district').sort({ created_at: -1 });
}

/**
 * Get historical winner posts (not live), only approved visible to public
 */
async function getWinnersHistory(level, district, adminView = false) {
  let query = { is_live: false };
  if (!adminView) query.approval_status = 'approved';
  if (level) query.level = level;
  if (level === 'district' && district) query.district = district;

  return WinnerPost.find(query)
    .sort({ cycle_start: -1 })
    .limit(50)
    .populate('user_id', 'name profile_photo_url district');
}

// ─── Card data generator ───────────────────────────────────────────────────

const CATEGORY_LABELS = {
  top_scorer:    { en: 'Top Scorer',     gu: 'ટોપ સ્કોરર',      emoji: '🏆' },
  streak_leader: { en: 'Streak Leader',  gu: 'સ્ટ્રીક લીડર',    emoji: '🔥' },
  peak_performer:{ en: 'Peak Performer', gu: 'પીક પર્ફોર્મર',   emoji: '⚡' },
  top_referrer:  { en: 'Top Referrer',   gu: 'ટોપ રેફરર',      emoji: '👥' }
};

function generateWinnerCardData(post, user) {
  const cat = CATEGORY_LABELS[post.category];
  return {
    postId: post._id,
    level: post.level,
    frequency: post.frequency || 'monthly',
    district: post.district,
    category: post.category,
    categoryLabel: cat,
    userName: user?.name || 'Unknown',
    userPhoto: user?.profile_photo_url || '',
    value: post.value,
    isLive: post.is_live,
    approvalStatus: post.approval_status,
    mediaUrl: post.media_url || '',
    mediaType: post.media_type || 'none',
    caption: post.caption || '',
    viewCount: post.view_count,
    shareCount: post.share_count,
    likeCount: post.like_count || 0,
    likedBy: post.liked_by || [],
    createdAt: post.created_at,
    cycleStart: post.cycle_start,
    cycleEnd: post.cycle_end
  };
}

module.exports = {
  generateWinners,
  declareWinner,
  registerView,
  registerShare,
  registerLike,
  getDistrictWinners,
  getStateWinners,
  generateWinnerCardData,
  getWinnersHistory,
  getWeekStart,
  getWeekEnd
};
