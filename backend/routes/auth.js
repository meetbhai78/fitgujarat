const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v2: cloudinary } = require('cloudinary');
const User = require('../models/User');
const UserStreak = require('../models/UserStreak');
const UserReport = require('../models/UserReport');
const { GUJARAT_DISTRICTS } = require('../config/districts');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const upload = require('../middleware/upload');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with district selection
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, district, referredByCode } = req.body;

    // Validate required fields
    if (!name || !password || !district) {
      return res.status(400).json({ error: 'Name, password, and district are required.' });
    }

    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone is required.' });
    }

    // Validate district
    if (!GUJARAT_DISTRICTS.includes(district)) {
      return res.status(400).json({ error: 'Invalid district. Must be one of the 33 Gujarat districts.' });
    }

    // Check for existing user
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ error: 'Email already registered.' });
    }
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) return res.status(400).json({ error: 'Phone already registered.' });
    }

    // Validate referredByCode if provided
    let referredByUser = null;
    if (referredByCode) {
      referredByUser = await User.findOne({ referral_code: referredByCode.trim().toLowerCase() });
      if (!referredByUser) {
        return res.status(400).json({ error: 'Invalid referral code.' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      password_hash,
      district,
      state: 'Gujarat',
      referred_by: referredByUser ? referredByUser._id : null
    });

    // Award referral points to the referrer
    if (referredByUser) {
      referredByUser.referral_points = (referredByUser.referral_points || 0) + 100;
      referredByUser.referral_count = (referredByUser.referral_count || 0) + 1;
      await referredByUser.save();
    }

    // Create initial streak record
    await UserStreak.create({
      user_id: user._id,
      current_streak: 0,
      longest_streak: 0,
      freeze_available: 1
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        state: user.state,
        role: user.role,
        preferred_language: user.preferred_language,
        referral_code: user.referral_code,
        referral_points: user.referral_points,
        referral_count: user.referral_count
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/phone + password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
      return res.status(400).json({ error: 'Email/phone and password are required.' });
    }

    // Find user
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        state: user.state,
        role: user.role,
        preferred_language: user.preferred_language,
        profile_photo_url: user.profile_photo_url,
        referral_code: user.referral_code,
        referral_points: user.referral_points,
        referral_count: user.referral_count
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

/**
 * POST /api/auth/verify-district
 * Admin verification - lock user's district
 */
router.post('/verify-district', auth, roleGuard('district_admin', 'state_admin'), async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(userId, {
      is_verified: true,
      district_locked: true
    }, { new: true }).select('-password_hash');

    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ message: 'User district verified and locked.', user });
  } catch (error) {
    console.error('Verify district error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', auth, async (req, res) => {
  try {
    const streak = await UserStreak.findOne({ user_id: req.userId });
    res.json({
      user: req.user,
      streak
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * PUT /api/auth/language
 * Update language preference
 */
router.put('/language', auth, async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'gu'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language. Use "en" or "gu".' });
    }

    const user = await User.findByIdAndUpdate(req.userId, {
      preferred_language: language
    }, { new: true }).select('-password_hash');

    res.json({ message: 'Language updated.', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * PUT /api/auth/profile
 * Update own name
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name: name.trim() },
      { new: true }
    ).select('-password_hash');
    res.json({ message: 'Profile updated.', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * POST /api/auth/profile/photo
 * Upload own profile photo via Cloudinary
 */
router.post('/profile/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    // Upload to cloudinary — no transformation to avoid strict transformations block
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'stepcount/avatars' },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      stream.end(req.file.buffer);
    });

    // Use the plain secure_url (no transformation) — works with strict transformations enabled
    const photoUrl = uploadResult.secure_url;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profile_photo_url: photoUrl },
      { new: true }
    ).select('-password_hash');

    res.json({ message: 'Profile photo updated.', profile_photo_url: photoUrl, user });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo.' });
  }
});

/**
 * DELETE /api/auth/profile/photo
 * Remove own profile photo
 */
router.delete('/profile/photo', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profile_photo_url: '' },
      { new: true }
    ).select('-password_hash');
    res.json({ message: 'Profile photo removed.', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * POST /api/auth/report/:userId
 * Report another user
 */
router.post('/report/:userId', auth, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const reportedId = req.params.userId;

    if (reportedId === req.userId.toString()) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    const validReasons = ['fake_steps', 'inappropriate_content', 'harassment', 'spam', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason.' });
    }

    const reportedUser = await User.findById(reportedId);
    if (!reportedUser) return res.status(404).json({ error: 'User not found.' });

    // Upsert — prevent duplicate reports
    await UserReport.findOneAndUpdate(
      { reporter_id: req.userId, reported_id: reportedId },
      { reason, details: details || '', status: 'pending', reviewed_by: null, reviewed_at: null, created_at: new Date() },
      { upsert: true, new: true }
    );

    res.json({ message: 'Report submitted successfully.' });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
