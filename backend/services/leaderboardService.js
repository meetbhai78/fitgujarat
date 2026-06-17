const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const UserStreak = require('../models/UserStreak');
const Leaderboard = require('../models/Leaderboard');
const { GUJARAT_DISTRICTS } = require('../config/districts');

/**
 * Compute leaderboards for all districts and state
 * Section 3.4 Triple Leaderboard System
 */
async function computeLeaderboards(cycleStart, cycleEnd) {
  const districts = [...GUJARAT_DISTRICTS, 'STATE'];
  
  for (const district of districts) {
    await computeOverallLeaderboard(district, cycleStart, cycleEnd);
    await computeStreakLeaderboard(district, cycleStart, cycleEnd);
    await computePeakDayLeaderboard(district, cycleStart, cycleEnd);
  }
}

/**
 * Overall Activity Score Leaderboard
 * Cumulative AI score over the period
 */
async function computeOverallLeaderboard(district, cycleStart, cycleEnd) {
  const startDate = formatDate(cycleStart);
  const endDate = formatDate(cycleEnd);

  // Build user filter (only count regular users who are not hidden)
  const users = district !== 'STATE'
    ? await User.find({ district, role: 'user', is_hidden: { $ne: true } }).select('_id')
    : await User.find({ role: 'user', is_hidden: { $ne: true } }).select('_id');
  const userIds = users.map(u => u._id);
  const userFilter = { user_id: { $in: userIds } };

  const pipeline = [
    {
      $match: {
        ...userFilter,
        date: { $gte: startDate, $lte: endDate },
        is_flagged: false
      }
    },
    {
      $group: {
        _id: '$user_id',
        totalScore: { $sum: '$calculated_score' }
      }
    },
    { $sort: { totalScore: -1 } },
    { $limit: 100 }
  ];

  const results = await ActivityLog.aggregate(pipeline);
  const rankings = results.map((r, i) => ({
    user_id: r._id,
    value: r.totalScore,
    rank: i + 1
  }));

  await Leaderboard.findOneAndUpdate(
    { district, type: 'overall', cycle_start: cycleStart, cycle_end: cycleEnd },
    { rankings, updated_at: new Date() },
    { upsert: true, new: true }
  );

  return rankings;
}

/**
 * Streak Leaderboard
 * Current consecutive-day streak length (never resets per cycle)
 */
async function computeStreakLeaderboard(district, cycleStart, cycleEnd) {
  let userFilter = { is_hidden: { $ne: true } };
  if (district !== 'STATE') {
    userFilter.district = district;
  }

  const users = await User.find(userFilter).select('_id');
  const userIds = users.map(u => u._id);

  const streaks = await UserStreak.find({ user_id: { $in: userIds } })
    .sort({ current_streak: -1 })
    .limit(100);

  const rankings = streaks.map((s, i) => ({
    user_id: s.user_id,
    value: s.current_streak,
    rank: i + 1
  }));

  await Leaderboard.findOneAndUpdate(
    { district, type: 'streak', cycle_start: cycleStart, cycle_end: cycleEnd },
    { rankings, updated_at: new Date() },
    { upsert: true, new: true }
  );

  return rankings;
}

/**
 * Peak Day Leaderboard
 * Highest single-day score ever achieved
 */
async function computePeakDayLeaderboard(district, cycleStart, cycleEnd) {
  // Build user filter (only count regular users who are not hidden)
  const users = district !== 'STATE'
    ? await User.find({ district, role: 'user', is_hidden: { $ne: true } }).select('_id')
    : await User.find({ role: 'user', is_hidden: { $ne: true } }).select('_id');
  const userIds = users.map(u => u._id);
  const userFilter = { user_id: { $in: userIds } };

  const pipeline = [
    {
      $match: {
        ...userFilter,
        is_flagged: false
      }
    },
    {
      $group: {
        _id: '$user_id',
        peakScore: { $max: '$calculated_score' }
      }
    },
    { $sort: { peakScore: -1 } },
    { $limit: 100 }
  ];

  const results = await ActivityLog.aggregate(pipeline);
  const rankings = results.map((r, i) => ({
    user_id: r._id,
    value: r.peakScore,
    rank: i + 1
  }));

  await Leaderboard.findOneAndUpdate(
    { district, type: 'peak_day', cycle_start: cycleStart, cycle_end: cycleEnd },
    { rankings, updated_at: new Date() },
    { upsert: true, new: true }
  );

  return rankings;
}

/**
 * Get leaderboard with user details populated
 */
async function getLeaderboard(district, type, cycleStart, cycleEnd) {
  let leaderboard = await Leaderboard.findOne({
    district,
    type,
    cycle_start: { $lte: new Date() },
    cycle_end: { $gte: new Date() }
  }).sort({ updated_at: -1 });

  if (!leaderboard) {
    // Compute on-the-fly if not cached
    const now = new Date();
    const start = cycleStart || getMonthStart(now);
    const end = cycleEnd || getMonthEnd(now);
    
    if (type === 'overall') await computeOverallLeaderboard(district, start, end);
    else if (type === 'streak') await computeStreakLeaderboard(district, start, end);
    else if (type === 'peak_day') await computePeakDayLeaderboard(district, start, end);

    leaderboard = await Leaderboard.findOne({
      district, type, cycle_start: start, cycle_end: end
    });
  }

  if (!leaderboard) return { rankings: [], district, type };

  // Populate user details
  const populatedRankings = [];
  for (const entry of leaderboard.rankings) {
    const user = await User.findById(entry.user_id).select('name district profile_photo_url');
    populatedRankings.push({
      user_id: entry.user_id,
      value: entry.value,
      rank: entry.rank,
      name: user?.name || 'Unknown',
      district: user?.district || '',
      profile_photo_url: user?.profile_photo_url || ''
    });
  }

  return {
    district: leaderboard.district,
    type: leaderboard.type,
    cycle_start: leaderboard.cycle_start,
    cycle_end: leaderboard.cycle_end,
    rankings: populatedRankings
  };
}

/**
 * Get user's rank in a specific leaderboard
 */
async function getUserRank(userId, district, type) {
  const leaderboard = await Leaderboard.findOne({
    district,
    type,
    cycle_end: { $gte: new Date() }
  }).sort({ updated_at: -1 });

  if (!leaderboard) return null;

  const entry = leaderboard.rankings.find(
    r => r.user_id.toString() === userId.toString()
  );

  return entry ? entry.rank : null;
}

function getMonthStart(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthEnd(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

module.exports = {
  computeLeaderboards,
  getLeaderboard,
  getUserRank,
  getMonthStart,
  getMonthEnd
};
