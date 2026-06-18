require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { computeLeaderboards } = require('./services/leaderboardService');
const Leaderboard = require('./models/Leaderboard');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const start = new Date('2026-06-01T00:00:00Z');
  const end = new Date('2026-06-30T23:59:59Z');
  
  // Clear leaderboards
  await Leaderboard.deleteMany({});
  console.log('Cleared existing leaderboards.');

  console.log('Running computeLeaderboards...');
  await computeLeaderboards(start, end);
  console.log('Done computing!');
  
  const lbs = await Leaderboard.find({ type: 'overall', district: 'STATE' });
  for (const lb of lbs) {
    console.log(`STATE overall rankings length for start ${lb.cycle_start.toISOString()}:`, lb.rankings.length);
  }
  
  mongoose.disconnect();
}

test();
