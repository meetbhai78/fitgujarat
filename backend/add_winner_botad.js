/**
 * Script to add a custom winner from Botad district who is both a District and State winner
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const WinnerPost = require('./models/WinnerPost');

async function main() {
  try {
    await connectDB();
    console.log('🔌 Connected to MongoDB successfully.');

    // 1. Check if user already exists or create them
    const email = 'rajesh.botad@demo.com';
    let user = await User.findOne({ email });
    
    if (!user) {
      console.log('👥 Demo user Rajesh Vaghela not found. Creating user in Botad...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('demo123', salt);
      
      user = await User.create({
        name: 'Rajesh Vaghela',
        email: email,
        phone: '9876500099',
        password_hash: passwordHash,
        district: 'Botad',
        state: 'Gujarat',
        role: 'user',
        is_verified: true,
        district_locked: true,
        referral_code: 'rajeshbotad'
      });
      console.log(`✅ User created: ${user.name} (ID: ${user._id}, District: ${user.district})`);
    } else {
      console.log(`✅ Existing user found: ${user.name} (ID: ${user._id}, District: ${user.district})`);
    }

    // 2. Set current week and month cycles
    const today = new Date();
    
    // Weekly cycle (Monday to Sunday of current week)
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + distanceToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Monthly cycle (Start of current month to end of current month)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 3. Clear existing winner posts for this user to avoid duplication
    console.log('🗑️  Clearing previous winner posts for this user...');
    await WinnerPost.deleteMany({ user_id: user._id });

    // 4. Create District Winner Post (Botad)
    console.log('🏆 Creating District Winner Post for Botad...');
    const districtPost = await WinnerPost.create({
      level: 'district',
      district: 'Botad',
      category: 'top_scorer',
      user_id: user._id,
      value: 12500, // steps score
      is_live: true,
      frequency: 'weekly',
      caption: 'Botad District Weekly Champion Rajesh Vaghela set an incredible pace with 12,500 daily average steps! 🏆👣',
      cycle_start: weekStart,
      cycle_end: weekEnd,
      approval_status: 'approved',
      created_at: today
    });
    console.log(`✅ District Winner Post created successfully (ID: ${districtPost._id})`);

    // 5. Create State Winner Post (Gujarat)
    console.log('👑 Creating State Winner Post for Gujarat...');
    const statePost = await WinnerPost.create({
      level: 'state',
      district: null, // null for state level
      category: 'streak_leader',
      user_id: user._id,
      value: 45, // 45 days streak
      is_live: true,
      frequency: 'monthly',
      caption: 'Gujarat State Monthly Streak Champion Rajesh Vaghela from Botad showed unparalleled consistency with a 45-day active walking streak! 🔥🚶‍♂️',
      cycle_start: monthStart,
      cycle_end: monthEnd,
      approval_status: 'approved',
      created_at: today
    });
    console.log(`✅ State Winner Post created successfully (ID: ${statePost._id})`);

    console.log('\n🎉 ALL DONE! Winner posts successfully injected.');
    console.log('🤖 You can now open the app, navigate to the "Winners" feed or "Leaderboard" to see Rajesh Vaghela featured under Botad and State tabs.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error injecting winner:', error);
    process.exit(1);
  }
}

main();
