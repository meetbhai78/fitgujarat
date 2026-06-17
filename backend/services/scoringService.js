const ActivityLog = require('../models/ActivityLog');
const UserStreak = require('../models/UserStreak');

// Constants for scoring
const POINTS_PER_100_STEPS = 1;
const MAX_DAILY_STEPS = 40000; // Cap for plausibility
const CONSISTENCY_BONUS = 10; // bonus for consecutive day
const IMPROVEMENT_BONUS_PERCENT = 0.15; // 15% bonus if above 7-day avg

// Streak multipliers
const STREAK_MULTIPLIERS = {
  7: 1.1,    // 7+ days = 1.1x
  30: 1.2,   // 30+ days = 1.2x
  100: 1.5   // 100+ days = 1.5x
};

/**
 * Calculate AI-driven score for a step count entry
 * Implements Section 3.3 of the requirements
 */
async function calculateScore(userId, stepCount, date) {
  // 1. Base score: 1 point per 100 steps
  const cappedSteps = Math.min(stepCount, MAX_DAILY_STEPS);
  let baseScore = Math.floor(cappedSteps / 100) * POINTS_PER_100_STEPS;

  // 2. Consistency bonus: extra points for consecutive days
  const streak = await UserStreak.findOne({ user_id: userId });
  let consistencyBonus = 0;
  if (streak && streak.current_streak > 0) {
    consistencyBonus = CONSISTENCY_BONUS * Math.min(streak.current_streak, 30); // cap at 30 days worth
  }

  // 3. Performance improvement bonus: compare to 7-day rolling average
  let improvementBonus = 0;
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLogs = await ActivityLog.find({
    user_id: userId,
    date: { $gte: formatDate(sevenDaysAgo), $lt: date },
    is_flagged: false
  });

  if (recentLogs.length > 0) {
    const avgSteps = recentLogs.reduce((sum, log) => sum + log.raw_value, 0) / recentLogs.length;
    if (cappedSteps > avgSteps) {
      improvementBonus = Math.floor(baseScore * IMPROVEMENT_BONUS_PERCENT);
    }
  }

  // 4. Streak multiplier
  let streakMultiplier = 1.0;
  if (streak) {
    const currentStreak = streak.current_streak;
    if (currentStreak >= 100) streakMultiplier = STREAK_MULTIPLIERS[100];
    else if (currentStreak >= 30) streakMultiplier = STREAK_MULTIPLIERS[30];
    else if (currentStreak >= 7) streakMultiplier = STREAK_MULTIPLIERS[7];
  }

  // 5. Total score
  const rawScore = baseScore + consistencyBonus + improvementBonus;
  const totalScore = Math.round(rawScore * streakMultiplier);

  return {
    baseScore,
    consistencyBonus,
    improvementBonus,
    streakMultiplier,
    totalScore,
    cappedSteps,
    wasAboveCap: stepCount > MAX_DAILY_STEPS
  };
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

module.exports = { calculateScore, MAX_DAILY_STEPS, STREAK_MULTIPLIERS };
