require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { computeLeaderboards } = require('./services/leaderboardService');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const start = new Date('2026-06-01T00:00:00Z');
  const end = new Date('2026-06-30T23:59:59Z');

  console.log('Running computeLeaderboards...');
  await computeLeaderboards(start, end);
  console.log('Done!');
  
  const Leaderboard = require('./models/Leaderboard');
  const lb = await Leaderboard.findOne({ district: 'STATE', type: 'overall', cycle_start: start });
  console.log('STATE overall rankings length:', lb ? lb.rankings.length : 'NULL');
  
  mongoose.disconnect();
}

test();
