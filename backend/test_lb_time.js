require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Leaderboard = require('./models/Leaderboard');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const lbs = await Leaderboard.find({ type: 'overall', district: 'STATE' });
  for (const lb of lbs) {
    console.log(`STATE overall | Start: ${lb.cycle_start.toISOString()} | End: ${lb.cycle_end.toISOString()} | Rankings count: ${lb.rankings.length} | Updated at: ${lb.updated_at.toISOString()}`);
  }
  
  mongoose.disconnect();
}

test();
