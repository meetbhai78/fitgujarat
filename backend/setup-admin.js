/**
 * Admin Setup Script
 * Creates or updates the state admin account with the specified credentials.
 * Run: node setup-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const UserStreak = require('./models/UserStreak');

const ADMIN_EMAIL    = 'meetberani78@gmail.com';
const ADMIN_PASSWORD = 'BeMeet@2007';
const ADMIN_NAME     = 'Meet Berani (State Admin)';
const ADMIN_DISTRICT = 'Gandhinagar';

async function setupAdmin() {
  try {
    await connectDB();
    console.log('\n🔑 Setting up State Admin account...\n');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    let admin = await User.findOne({ email: ADMIN_EMAIL });

    if (admin) {
      // Update existing admin
      admin.name          = ADMIN_NAME;
      admin.password_hash = password_hash;
      admin.role          = 'state_admin';
      admin.district      = ADMIN_DISTRICT;
      admin.is_verified   = true;
      admin.district_locked = true;
      await admin.save();
      console.log(`✅ Admin account UPDATED: ${ADMIN_EMAIL}`);
    } else {
      // Create new admin
      admin = await User.create({
        name:            ADMIN_NAME,
        email:           ADMIN_EMAIL,
        phone:           '9999999999',
        password_hash,
        district:        ADMIN_DISTRICT,
        state:           'Gujarat',
        role:            'state_admin',
        is_verified:     true,
        district_locked: true
      });

      // Create streak record for admin
      await UserStreak.create({
        user_id:               admin._id,
        current_streak:        0,
        longest_streak:        0,
        freeze_available:      1,
        freeze_used_this_month: false
      });

      console.log(`✅ Admin account CREATED: ${ADMIN_EMAIL}`);
    }

    console.log(`
╔══════════════════════════════════════════════╗
║  ✅ Admin Setup Complete!                    ║
╠══════════════════════════════════════════════╣
║  Email    : meetberani78@gmail.com           ║
║  Password : BeMeet@2007                      ║
║  Role     : State Admin                      ║
║  District : Gandhinagar                      ║
╚══════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Admin setup error:', error.message);
    process.exit(1);
  }
}

setupAdmin();
