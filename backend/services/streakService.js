const UserStreak = require('../models/UserStreak');

// Badge definitions from Section 3.5
const STREAK_BADGES = [
  { minDays: 7, name: 'Bronze Flame', nameGu: 'બ્રોન્ઝ ફ્લેમ', bonusPoints: 50, icon: '🔥', reward: null },
  { minDays: 30, name: 'Silver Flame', nameGu: 'સિલ્વર ફ્લેમ', bonusPoints: 200, icon: '🔥🔥', reward: 'Profile highlight' },
  { minDays: 100, name: 'Gold Flame (Centurion)', nameGu: 'ગોલ્ડ ફ્લેમ (સેન્ચુરિયન)', bonusPoints: 1000, icon: '🔥🔥🔥', reward: 'District feature post' },
  { minDays: 365, name: 'Diamond Streak (Legend)', nameGu: 'ડાયમંડ સ્ટ્રીક (લિજેન્ડ)', bonusPoints: 0, icon: '💎🔥', reward: 'Sponsor reward eligibility' }
];

/**
 * Update streak after a daily activity is logged
 * Implements Section 3.5 streak mechanics
 */
async function updateStreak(userId, activityDate) {
  let streak = await UserStreak.findOne({ user_id: userId });
  
  if (!streak) {
    streak = await UserStreak.create({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: activityDate,
      freeze_available: 1,
      freeze_used_this_month: false
    });
    return { streak, badge: null, isNewStreak: true };
  }

  // Already logged today
  if (streak.last_activity_date === activityDate) {
    return { streak, badge: null, isNewStreak: false };
  }

  const lastDate = new Date(streak.last_activity_date);
  const currentDate = new Date(activityDate);
  const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day - increment streak
    streak.current_streak += 1;
  } else if (diffDays === 2 && streak.freeze_available > 0 && !streak.freeze_used_this_month) {
    // Missed one day - auto-use freeze if available
    streak.current_streak += 1; // Continue streak
    streak.freeze_available -= 1;
    streak.freeze_used_this_month = true;
  } else if (streak.recovery_active && new Date() <= streak.recovery_deadline) {
    // Recovery challenge is active and within deadline
    const recoveredStreak = Math.floor(streak.streak_before_break * 0.5);
    streak.current_streak = recoveredStreak + 1;
    streak.recovery_active = false;
    streak.recovery_deadline = null;
    streak.streak_before_break = 0;
  } else if (diffDays > 1) {
    // Streak broken
    streak.streak_before_break = streak.current_streak;
    streak.recovery_active = true;
    streak.recovery_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    streak.current_streak = 1; // Start new streak
  }

  // Update longest streak
  if (streak.current_streak > streak.longest_streak) {
    streak.longest_streak = streak.current_streak;
  }

  streak.last_activity_date = activityDate;
  await streak.save();

  // Check for new badge
  const badge = getNewBadge(streak.current_streak);

  return { streak, badge, isNewStreak: true };
}

/**
 * Use streak freeze manually
 */
async function useFreeze(userId) {
  const streak = await UserStreak.findOne({ user_id: userId });
  if (!streak) return { success: false, message: 'No streak record found' };
  if (streak.freeze_available <= 0) return { success: false, message: 'No freeze available' };
  if (streak.freeze_used_this_month) return { success: false, message: 'Already used freeze this month' };

  streak.freeze_available -= 1;
  streak.freeze_used_this_month = true;
  await streak.save();

  return { success: true, message: 'Freeze applied successfully', streak };
}

/**
 * Reset monthly freeze availability (called by cron)
 */
async function resetMonthlyFreezes() {
  await UserStreak.updateMany({}, {
    freeze_available: 1,
    freeze_used_this_month: false
  });
}

/**
 * Get the badge earned for a streak length
 */
function getNewBadge(streakLength) {
  let earnedBadge = null;
  for (const badge of STREAK_BADGES) {
    if (streakLength === badge.minDays) {
      earnedBadge = badge;
    }
  }
  return earnedBadge;
}

/**
 * Get all earned badges for a streak length
 */
function getEarnedBadges(streakLength) {
  return STREAK_BADGES.filter(b => streakLength >= b.minDays);
}

/**
 * Get streak multiplier for scoring
 */
function getStreakMultiplier(streakLength) {
  if (streakLength >= 100) return 1.5;
  if (streakLength >= 30) return 1.2;
  if (streakLength >= 7) return 1.1;
  return 1.0;
}

module.exports = {
  updateStreak,
  useFreeze,
  resetMonthlyFreezes,
  getNewBadge,
  getEarnedBadges,
  getStreakMultiplier,
  STREAK_BADGES
};
