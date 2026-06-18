require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const ActivityLog = require('./models/ActivityLog');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const startDate = '2026-06-01';
  const endDate = '2026-06-30';

  const users = await User.find({ role: 'user', is_hidden: { $ne: true } }).select('_id');
  const userIds = users.map(u => u._id);
  console.log('User IDs count:', userIds.length);

  const pipeline = [
    {
      $match: {
        user_id: { $in: userIds },
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
    }
  ];

  const results = await ActivityLog.aggregate(pipeline);
  console.log('Aggregation results:', results);

  mongoose.disconnect();
}

test();
