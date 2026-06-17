/**
 * Clear Demo Data Script
 * Deletes all mock users, activities, streaks, leaderboards, flags, and winner posts.
 * Keeps only the primary State Admin account (meetberani78@gmail.com).
 * Run: node clear-demo-data.js
 */
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');
const UserStreak = require('./models/UserStreak');
const Leaderboard = require('./models/Leaderboard');
const WinnerPost = require('./models/WinnerPost');
const FraudFlag = require('./models/FraudFlag');

async function clearDemoData() {
  try {
    await connectDB();
    console.log('\n🧹 Clearing demo and mock data from database...\n');

    // 1. Delete all activity logs, fraud flags, leaderboards, and winner posts
    const resultLogs = await ActivityLog.deleteMany({});
    const resultFlags = await FraudFlag.deleteMany({});
    const resultLeaderboards = await Leaderboard.deleteMany({});
    const resultWinners = await WinnerPost.deleteMany({});

    console.log(`🗑️ Deleted ${resultLogs.deletedCount} Activity Logs.`);
    console.log(`🗑️ Deleted ${resultFlags.deletedCount} Fraud Flags.`);
    console.log(`🗑️ Deleted ${resultLeaderboards.deletedCount} Leaderboards.`);
    console.log(`🗑️ Deleted ${resultWinners.deletedCount} Winner Posts.`);

    // 2. Find and preserve the primary admin
    const adminUser = await User.findOne({ email: 'meetberani78@gmail.com' });
    if (!adminUser) {
      console.log('⚠️ Primary admin account (meetberani78@gmail.com) not found in database!');
    }

    // 3. Delete all users except meetberani78@gmail.com
    const resultUsers = await User.deleteMany({ email: { $ne: 'meetberani78@gmail.com' } });
    console.log(`🗑️ Deleted ${resultUsers.deletedCount} Mock Users.`);

    // 4. Clear streaks for deleted users, keep only the admin streak
    if (adminUser) {
      await UserStreak.deleteMany({ user_id: { $ne: adminUser._id } });
      let adminStreak = await UserStreak.findOne({ user_id: adminUser._id });
      if (!adminStreak) {
        await UserStreak.create({
          user_id: adminUser._id,
          current_streak: 0,
          longest_streak: 0,
          freeze_available: 1,
          freeze_used_this_month: false
        });
        console.log('✅ Created UserStreak record for primary admin.');
      }
    } else {
      await UserStreak.deleteMany({});
    }
    console.log(`🗑️ Cleared Mock User Streaks.`);

    console.log('\n✨ Database is now clean and ready for REAL data!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Clear database error:', error.message);
    process.exit(1);
  }
}

clearDemoData();
