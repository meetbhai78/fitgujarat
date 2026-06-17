const cron = require('node-cron');
const { computeLeaderboards, getMonthStart, getMonthEnd } = require('../services/leaderboardService');
const { generateWinners } = require('../services/winnerService');
const { resetMonthlyFreezes } = require('../services/streakService');

// Global cron execution tracker for system health check
global.cronTracker = {
  lastLeaderboardRefresh: null,
  lastWinnerGeneration: null,
  lastFreezeReset: null,
  status: 'Active'
};

/**
 * Initialize all cron jobs
 */
function initCronJobs() {
  // 1. Refresh leaderboards every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    global.cronTracker.lastLeaderboardRefresh = new Date();
    console.log('⏰ [CRON] Refreshing leaderboards...');
    try {
      const now = new Date();
      await computeLeaderboards(getMonthStart(now), getMonthEnd(now));
      console.log('✅ [CRON] Leaderboards refreshed.');
    } catch (error) {
      console.error('❌ [CRON] Leaderboard refresh error:', error);
    }
  });

  // 2. Monthly winner generation (1st of each month at midnight)
  cron.schedule('0 0 1 * *', async () => {
    global.cronTracker.lastWinnerGeneration = new Date();
    console.log('⏰ [CRON] Generating monthly winners...');
    try {
      const now = new Date();
      // Compute previous calendar month start and end dates
      const prevMonth = new Date(now);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const start = getMonthStart(prevMonth);
      const end = getMonthEnd(prevMonth);

      console.log(`⏰ [CRON] Winner period: ${start.toISOString()} to ${end.toISOString()}`);
      const winners = await generateWinners(start, end);
      console.log(`✅ [CRON] Generated ${winners.length} monthly winner posts.`);
    } catch (error) {
      console.error('❌ [CRON] Monthly winner generation error:', error);
    }
  });

  // 3. Monthly freeze reset (1st of each month at midnight)
  cron.schedule('0 0 1 * *', async () => {
    global.cronTracker.lastFreezeReset = new Date();
    console.log('⏰ [CRON] Resetting monthly streak freezes...');
    try {
      await resetMonthlyFreezes();
      console.log('✅ [CRON] Monthly freezes reset.');
    } catch (error) {
      console.error('❌ [CRON] Freeze reset error:', error);
    }
  });

  // Set initial status timestamp
  global.cronTracker.lastLeaderboardRefresh = new Date();

  console.log('📅 Cron jobs initialized.');
}

module.exports = { initCronJobs };
