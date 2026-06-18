require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const ActivityLog = require('./models/ActivityLog');
const User = require('./models/User');

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const cycleStart = new Date('2026-06-01T00:00:00.000Z');
  const cycleEnd = new Date('2026-06-30T23:59:59.999Z');
  const district = 'STATE';

  const startDate = formatDate(cycleStart);
  const endDate = formatDate(cycleEnd);
  
  console.log('startDate:', startDate, 'endDate:', endDate);

  const users = district !== 'STATE'
    ? await User.find({ district, role: 'user', is_hidden: { $ne: true } }).select('_id')
    : await User.find({ role: 'user', is_hidden: { $ne: true } }).select('_id');
  const userIds = users.map(u => u._id);
  const userFilter = { user_id: { $in: userIds } };

  const pipeline = [
    {
      $match: {
        ...userFilter,
        date: { $gte: startDate, $lte: endDate },
        is_flagged: false
      }
    },
    {
      $group: {
        _id: '$user_id',
        totalScore: { $sum: '$calculated_score' },
        totalSteps: { $sum: '$raw_value' }
      }
    },
    { $sort: { totalScore: -1 } },
    { $limit: 100 }
  ];

  const results = await ActivityLog.aggregate(pipeline);
  console.log('Results:', results);
  
  mongoose.disconnect();
}

test();
