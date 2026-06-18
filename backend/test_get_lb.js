require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { getLeaderboard } = require('./services/leaderboardService');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  console.log('Fetching STATE overall leaderboard...');
  const lb = await getLeaderboard('STATE', 'overall');
  console.log('Returned rankings count:', lb.rankings.length);
  
  if (lb.rankings.length > 0) {
    console.log('First rank:', lb.rankings[0]);
  }
  
  mongoose.disconnect();
}

test();
