require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Leaderboard = require('./models/Leaderboard');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const leaderboards = await Leaderboard.find({ type: 'overall', district: 'STATE' });
  console.log('Leaderboards count:', leaderboards.length);
  for (const lb of leaderboards) {
    console.log(`LB: ${lb.district} ${lb.type} | Start: ${lb.cycle_start.toISOString()} | End: ${lb.cycle_end.toISOString()} | Rankings count: ${lb.rankings.length}`);
  }

  const users = await User.find({ role: 'user' });
  console.log('Regular Users:', users.length);

  mongoose.disconnect();
}

test();
