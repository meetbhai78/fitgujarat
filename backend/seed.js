/**
 * Seed Script - Gujarat Step Counter
 * Creates demo users, activity data, streaks, leaderboards, and winner posts
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');
const UserStreak = require('./models/UserStreak');
const Leaderboard = require('./models/Leaderboard');
const WinnerPost = require('./models/WinnerPost');
const FraudFlag = require('./models/FraudFlag');
const { GUJARAT_DISTRICTS } = require('./config/districts');
const { computeLeaderboards, getMonthStart, getMonthEnd } = require('./services/leaderboardService');
const { generateWinners } = require('./services/winnerService');

const DEMO_USERS = [
  { name: 'Meet Berani', email: 'meet@demo.com', phone: '9876543210', district: 'Ahmedabad', role: 'user' },
  { name: 'Priya Patel', email: 'priya@demo.com', phone: '9876543211', district: 'Ahmedabad', role: 'user' },
  { name: 'Rahul Shah', email: 'rahul@demo.com', phone: '9876543212', district: 'Surat', role: 'user' },
  { name: 'Anita Desai', email: 'anita@demo.com', phone: '9876543213', district: 'Surat', role: 'user' },
  { name: 'Vijay Kumar', email: 'vijay@demo.com', phone: '9876543214', district: 'Vadodara', role: 'user' },
  { name: 'Kavita Joshi', email: 'kavita@demo.com', phone: '9876543215', district: 'Rajkot', role: 'user' },
  { name: 'Arjun Mehta', email: 'arjun@demo.com', phone: '9876543216', district: 'Gandhinagar', role: 'user' },
  { name: 'Sonal Trivedi', email: 'sonal@demo.com', phone: '9876543217', district: 'Ahmedabad', role: 'user' },
  { name: 'Dharmesh Parmar', email: 'dharmesh@demo.com', phone: '9876543218', district: 'Surat', role: 'user' },
  { name: 'Neha Chauhan', email: 'neha@demo.com', phone: '9876543219', district: 'Vadodara', role: 'user' },
  // Admin users
  { name: 'Admin Ahmedabad', email: 'admin.ahm@demo.com', phone: '9900000001', district: 'Ahmedabad', role: 'district_admin' },
  { name: 'State Admin Gujarat', email: 'stateadmin@demo.com', phone: '9900000000', district: 'Gandhinagar', role: 'state_admin' },
  { name: 'Meet Berani (State Admin)', email: 'meetberani78@gmail.com', phone: '9999999999', district: 'Gandhinagar', role: 'state_admin', password: 'BeMeet@2007' },
];

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Starting seed process...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await ActivityLog.deleteMany({});
    await UserStreak.deleteMany({});
    await Leaderboard.deleteMany({});
    await WinnerPost.deleteMany({});
    await FraudFlag.deleteMany({});

    // Create users
    console.log('👥 Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('demo123', salt);

    const createdUsers = [];
    for (const userData of DEMO_USERS) {
      const passwordHash = userData.password 
        ? await bcrypt.hash(userData.password, salt)
        : defaultPasswordHash;

      const user = await User.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password_hash: passwordHash,
        district: userData.district,
        state: 'Gujarat',
        role: userData.role,
        is_verified: true,
        district_locked: true
      });
      createdUsers.push(user);
      console.log(`  ✅ ${user.name} (${user.district}) [${user.role}]`);
    }

    // Generate 30 days of activity data for each user
    console.log('\n📊 Generating 30 days of activity data...');
    const today = new Date();

    for (const user of createdUsers) {
      if (user.role !== 'user') continue; // Skip admin users for activity

      let currentStreak = 0;
      let longestStreak = 0;
      let lastActivityDate = '';

      // Each user gets different base step counts for variety
      const baseSteps = 4000 + Math.random() * 8000;
      const consistency = 0.7 + Math.random() * 0.25; // 70-95% days active

      for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
        // Skip some days randomly based on consistency
        if (Math.random() > consistency && daysAgo > 0) {
          currentStreak = 0;
          continue;
        }

        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];

        // Generate realistic step count with daily variation
        const dailyVariation = (Math.random() - 0.5) * 6000;
        const weekendBonus = [0, 6].includes(date.getDay()) ? 2000 : 0;
        const steps = Math.max(500, Math.round(baseSteps + dailyVariation + weekendBonus));

        // Calculate score (simplified version of scoring service)
        let score = Math.floor(steps / 100);
        score += Math.min(currentStreak, 30) * 10; // consistency bonus
        let multiplier = 1.0;
        if (currentStreak >= 100) multiplier = 1.5;
        else if (currentStreak >= 30) multiplier = 1.2;
        else if (currentStreak >= 7) multiplier = 1.1;
        score = Math.round(score * multiplier);

        // GPS coordinates around Gujarat cities
        const gpsOffsets = {
          'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
          'Surat': { lat: 21.1702, lng: 72.8311 },
          'Vadodara': { lat: 22.3072, lng: 73.1812 },
          'Rajkot': { lat: 22.3039, lng: 70.8022 },
          'Gandhinagar': { lat: 23.2156, lng: 72.6369 },
        };
        const gps = gpsOffsets[user.district] || { lat: 23.0, lng: 72.5 };

        await ActivityLog.create({
          user_id: user._id,
          date: dateStr,
          raw_value: steps,
          calculated_score: score,
          gps_lat: gps.lat + (Math.random() - 0.5) * 0.05,
          gps_lng: gps.lng + (Math.random() - 0.5) * 0.05,
          device_id: `demo-device-${user._id}`,
          is_flagged: false,
          timestamp: date
        });

        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        lastActivityDate = dateStr;
      }

      // Create streak record
      await UserStreak.create({
        user_id: user._id,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: lastActivityDate,
        freeze_available: 1,
        freeze_used_this_month: false
      });

      console.log(`  📈 ${user.name}: ${currentStreak}-day streak, longest: ${longestStreak}`);
    }

    // Add one fraudulent entry for demo
    console.log('\n⚠️  Creating sample fraud flag...');
    const fraudUser = createdUsers[2]; // Rahul Shah
    const fraudActivity = await ActivityLog.create({
      user_id: fraudUser._id,
      date: today.toISOString().split('T')[0],
      raw_value: 85000, // Impossibly high
      calculated_score: 850,
      gps_lat: 21.17,
      gps_lng: 72.83,
      device_id: `demo-device-${fraudUser._id}`,
      is_flagged: true,
      flagged_reason: 'Step count 85000 exceeds maximum plausible daily limit of 40000',
      timestamp: new Date()
    });

    await FraudFlag.create({
      activity_log_id: fraudActivity._id,
      user_id: fraudUser._id,
      reason: 'Step count 85000 exceeds maximum plausible daily limit of 40000',
      status: 'pending'
    });
    console.log('  ⚠️  Fraud flag created for Rahul Shah (85,000 steps)');

    // Compute leaderboards and winners for the previous calendar month
    console.log('\n🏆 Computing leaderboards and winners for the previous month...');
    const prevMonth = new Date(today);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevStart = getMonthStart(prevMonth);
    const prevEnd = getMonthEnd(prevMonth);
    await computeLeaderboards(prevStart, prevEnd);
    const prevWinners = await generateWinners(prevStart, prevEnd);
    console.log(`  ✅ Generated ${prevWinners.length} winner posts for the previous month.`);

    // Compute leaderboards and winners for the current calendar month
    console.log('\n🏆 Computing leaderboards and winners for the current month...');
    const cycleStart = getMonthStart(today);
    const cycleEnd = getMonthEnd(today);
    await computeLeaderboards(cycleStart, cycleEnd);
    const winners = await generateWinners(cycleStart, cycleEnd);
    console.log(`  ✅ Generated ${winners.length} winner posts for the current month.`);

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('  🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(50));
    console.log(`
  📊 Summary:
  • ${createdUsers.length} users created (${createdUsers.filter(u => u.role === 'user').length} regular + 2 admins)
  • 30 days of step count data per user
  • Leaderboards computed for all districts
  • ${winners.length} winner posts generated
  • 1 sample fraud flag

  🔑 Demo Login Credentials:
  ──────────────────────────────
  Regular User:   meet@demo.com / demo123
  District Admin: admin.ahm@demo.com / demo123
  State Admin:    stateadmin@demo.com / demo123
  ──────────────────────────────

  🚀 Start the app:  npm run dev
  🌐 Open:          http://localhost:5000
`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
