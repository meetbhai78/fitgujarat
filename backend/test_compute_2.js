require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { computeOverallLeaderboard, getMonthStart, getMonthEnd } = require('./services/leaderboardService');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const now = new Date();
  const start = getMonthStart(now);
  const end = getMonthEnd(now);
  
  console.log('Start:', start.toISOString(), 'End:', end.toISOString());
  await computeOverallLeaderboard('STATE', start, end);
  console.log('Done!');
  
  mongoose.disconnect();
}

test();
