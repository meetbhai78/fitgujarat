const ActivityLog = require('../models/ActivityLog');
const UserStreak = require('../models/UserStreak');
const { getUserRank } = require('./leaderboardService');

/**
 * AI Recommendation Service
 * Implements Section 4.2
 */

/**
 * Get personalized recommendations for a user
 */
async function getRecommendations(userId, userDistrict) {
  const recommendations = [];

  // Get user's recent activity
  const recentLogs = await ActivityLog.find({
    user_id: userId,
    is_flagged: false
  }).sort({ date: -1 }).limit(14);

  const streak = await UserStreak.findOne({ user_id: userId });

  if (recentLogs.length === 0) {
    recommendations.push({
      type: 'getting_started',
      en: 'Start your journey! Log your first step count today and begin climbing the leaderboard.',
      gu: 'તમારી યાત્રા શરૂ કરો! આજે તમારું પહેલું પગલાં ગણતરી લોગ કરો અને લીડરબોર્ડ પર ચડવાનું શરૂ કરો.',
      icon: '🚀',
      priority: 1
    });
    return recommendations;
  }

  // Calculate stats
  const avgSteps = recentLogs.reduce((sum, l) => sum + l.raw_value, 0) / recentLogs.length;
  const avgScore = recentLogs.reduce((sum, l) => sum + l.calculated_score, 0) / recentLogs.length;
  const maxSteps = Math.max(...recentLogs.map(l => l.raw_value));
  const last7 = recentLogs.slice(0, 7);
  const avg7 = last7.reduce((sum, l) => sum + l.raw_value, 0) / last7.length;

  // 1. Ranking prediction
  const districtRank = await getUserRank(userId, userDistrict, 'overall');
  if (districtRank) {
    if (districtRank <= 3) {
      recommendations.push({
        type: 'ranking',
        en: `Amazing! You're ranked #${districtRank} in ${userDistrict}! Keep up the great work to maintain your position.`,
        gu: `અદ્ભુત! તમે ${userDistrict}માં #${districtRank} ક્રમે છો! તમારી સ્થિતિ જાળવી રાખવા શ્રેષ્ઠ કાર્ય ચાલુ રાખો.`,
        icon: '🏆',
        priority: 1
      });
    } else if (districtRank <= 10) {
      const improvement = Math.round((1 - (districtRank - 3) / districtRank) * 100);
      recommendations.push({
        type: 'ranking',
        en: `You're #${districtRank} in ${userDistrict}. A ${improvement}% improvement could move you to the top 3!`,
        gu: `તમે ${userDistrict}માં #${districtRank} ક્રમે છો. ${improvement}% સુધારો તમને ટોપ 3માં લાવી શકે!`,
        icon: '📈',
        priority: 2
      });
    } else {
      recommendations.push({
        type: 'ranking',
        en: `You're #${districtRank} in ${userDistrict}. Aim for ${Math.round(avgSteps * 1.2)} daily steps to climb the ranks!`,
        gu: `તમે ${userDistrict}માં #${districtRank} ક્રમે છો. ક્રમ ચડવા દરરોજ ${Math.round(avgSteps * 1.2)} પગલાંનું લક્ષ્ય રાખો!`,
        icon: '🎯',
        priority: 2
      });
    }
  }

  // 2. Daily goal suggestion based on performance
  const suggestedGoal = Math.round(avgSteps * 1.1 / 1000) * 1000; // Round to nearest 1000
  recommendations.push({
    type: 'daily_goal',
    en: `Your daily goal: ${suggestedGoal.toLocaleString()} steps. This is 10% above your average and will boost your score!`,
    gu: `તમારું દૈનિક લક્ષ્ય: ${suggestedGoal.toLocaleString()} પગલાં. આ તમારી સરેરાશ કરતાં 10% વધુ છે અને તમારો સ્કોર વધારશે!`,
    icon: '🎯',
    priority: 3
  });

  // 3. Streak advice
  if (streak) {
    if (streak.current_streak > 0 && streak.current_streak < 7) {
      recommendations.push({
        type: 'streak',
        en: `${7 - streak.current_streak} more days to earn your Bronze Flame badge! Keep your streak alive!`,
        gu: `બ્રોન્ઝ ફ્લેમ બેજ મેળવવા માટે ${7 - streak.current_streak} વધુ દિવસ! તમારી સ્ટ્રીક જાળવી રાખો!`,
        icon: '🔥',
        priority: 2
      });
    } else if (streak.current_streak >= 7 && streak.current_streak < 30) {
      recommendations.push({
        type: 'streak',
        en: `Great ${streak.current_streak}-day streak! ${30 - streak.current_streak} more days for Silver Flame and 1.2x score multiplier!`,
        gu: `શ્રેષ્ઠ ${streak.current_streak}-દિવસની સ્ટ્રીક! સિલ્વર ફ્લેમ અને 1.2x સ્કોર ગુણક માટે ${30 - streak.current_streak} વધુ દિવસ!`,
        icon: '🔥🔥',
        priority: 2
      });
    } else if (streak.current_streak >= 30) {
      recommendations.push({
        type: 'streak',
        en: `Incredible ${streak.current_streak}-day streak! You're earning a 1.2x score multiplier. Keep going for Centurion status!`,
        gu: `અવિશ્વસનીય ${streak.current_streak}-દિવસની સ્ટ્રીક! તમે 1.2x સ્કોર ગુણક મેળવી રહ્યા છો. સેન્ચુરિયન દરજ્જા માટે ચાલુ રાખો!`,
        icon: '🔥🔥🔥',
        priority: 1
      });
    }

    // Freeze reminder
    if (streak.freeze_available > 0 && !streak.freeze_used_this_month) {
      recommendations.push({
        type: 'freeze',
        en: 'You have 1 streak freeze available this month. Use it wisely on a rest day!',
        gu: 'આ મહિને તમારી પાસે 1 સ્ટ્રીક ફ્રીઝ ઉપલબ્ધ છે. આરામના દિવસે સમજદારીથી વાપરો!',
        icon: '❄️',
        priority: 4
      });
    }
  }

  // 4. Performance trend
  if (recentLogs.length >= 7) {
    const olderAvg = recentLogs.slice(7).reduce((sum, l) => sum + l.raw_value, 0) / Math.max(recentLogs.slice(7).length, 1);
    if (avg7 > olderAvg * 1.1) {
      recommendations.push({
        type: 'trend',
        en: 'Your steps are trending up! You\'re improving week over week. Keep this momentum!',
        gu: 'તમારા પગલાં વધી રહ્યા છે! તમે અઠવાડિયે-અઠવાડિયે સુધારી રહ્યા છો. આ ગતિ જાળવી રાખો!',
        icon: '📈',
        priority: 3
      });
    } else if (avg7 < olderAvg * 0.9) {
      recommendations.push({
        type: 'trend',
        en: 'Your steps have dipped this week. Try a morning walk to get back on track!',
        gu: 'આ અઠવાડિયે તમારા પગલાં ઘટ્યા છે. પાછા ટ્રેક પર આવવા સવારે ચાલવાનો પ્રયાસ કરો!',
        icon: '💪',
        priority: 3
      });
    }
  }

  // Sort by priority
  recommendations.sort((a, b) => a.priority - b.priority);

  return recommendations;
}

module.exports = { getRecommendations };
