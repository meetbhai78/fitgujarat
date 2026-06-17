const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const FraudFlag = require('../models/FraudFlag');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const WinnerPost = require('../models/WinnerPost');
const UserStreak = require('../models/UserStreak');
const { generateWinners } = require('../services/winnerService');

const router = express.Router();

// ─── Fraud flags ───────────────────────────────────────────────────────────

router.get('/flags', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const flags = await FraudFlag.find({ status })
      .populate('user_id', 'name email district')
      .populate('activity_log_id', 'date raw_value calculated_score')
      .sort({ _id: -1 })
      .limit(100);
    res.json({ flags });
  } catch (error) {
    console.error('Admin flags error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/flags/:id/review', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approved" or "rejected".' });
    }
    const flag = await FraudFlag.findById(req.params.id);
    if (!flag) return res.status(404).json({ error: 'Flag not found.' });

    flag.status = action;
    flag.reviewed_by = req.userId;
    flag.reviewed_at = new Date();
    await flag.save();

    if (action === 'approved') {
      await ActivityLog.findByIdAndUpdate(flag.activity_log_id, {
        is_flagged: false,
        flagged_reason: ''
      });
    }
    res.json({ message: `Flag ${action} successfully.`, flag });
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── User management ───────────────────────────────────────────────────────

router.get('/users', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password_hash')
      .sort({ created_at: -1 })
      .limit(200);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/users/:id', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ error: 'User not found.' });

    await UserStreak.deleteOne({ user_id: req.params.id });
    await ActivityLog.deleteMany({ user_id: req.params.id });
    await FraudFlag.deleteMany({ user_id: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and all associated data deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error during user deletion.' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Edit user details (name, email, phone, district, role)
 */
router.put('/users/:id', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { name, email, phone, district, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Prevent demoting yourself
    if (req.params.id === req.userId.toString() && role && role !== user.role) {
      return res.status(400).json({ error: 'Cannot change your own role.' });
    }

    // Check for duplicate email/phone (exclude current user)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) return res.status(400).json({ error: 'Email already in use by another account.' });
    }
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (phoneExists) return res.status(400).json({ error: 'Phone already in use by another account.' });
    }

    if (name)     user.name     = name.trim();
    if (email)    user.email    = email.trim().toLowerCase();
    if (phone)    user.phone    = phone.trim();
    if (district) user.district = district;
    if (role && ['user', 'district_admin', 'state_admin'].includes(role)) user.role = role;

    await user.save();
    const updated = await User.findById(req.params.id).select('-password_hash');
    res.json({ message: 'User updated successfully.', user: updated });
  } catch (error) {
    console.error('Edit user error:', error);
    res.status(500).json({ error: 'Server error updating user.' });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset any user's password (admin only)
 */
router.post('/users/:id/reset-password', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: `Password for ${user.name} has been reset successfully.` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password.' });
  }
});



/**
 * POST /api/admin/users/:id/freeze
 * Freeze a user account for a specified number of days
 */
router.post('/users/:id/freeze', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { days, frozenUntil } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    let freezeUntil;
    if (frozenUntil) {
      freezeUntil = new Date(frozenUntil);
    } else if (days) {
      freezeUntil = new Date();
      freezeUntil.setDate(freezeUntil.getDate() + parseInt(days));
      freezeUntil.setHours(23, 59, 59, 999);
    } else {
      // Default fallback: 7 days
      freezeUntil = new Date();
      freezeUntil.setDate(freezeUntil.getDate() + 7);
      freezeUntil.setHours(23, 59, 59, 999);
    }

    if (isNaN(freezeUntil.getTime()) || freezeUntil <= new Date()) {
      return res.status(400).json({ error: 'Freeze target date must be a valid future date.' });
    }

    user.frozen_until = freezeUntil;
    await user.save();

    res.json({
      message: `User ${user.name} frozen successfully until ${freezeUntil.toLocaleString('en-IN')}.`,
      frozen_until: freezeUntil
    });
  } catch (error) {
    console.error('Freeze user error:', error);
    res.status(500).json({ error: 'Server error during user freeze.' });
  }
});

/**
 * POST /api/admin/users/:id/unfreeze
 * Unfreeze a user account immediately
 */
router.post('/users/:id/unfreeze', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.frozen_until = null;
    await user.save();

    res.json({ message: `User ${user.name} unfrozen successfully.` });
  } catch (error) {
    console.error('Unfreeze user error:', error);
    res.status(500).json({ error: 'Server error during user unfreeze.' });
  }
});

// ─── Winner post management ────────────────────────────────────────────────

/**
 * GET /api/admin/winner-posts
 * All winner posts with optional status filter: ?status=pending|approved|rejected|all
 */
router.get('/winner-posts', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status && status !== 'all') {
      filter.approval_status = status;
    }

    const posts = await WinnerPost.find(filter)
      .populate('user_id', 'name email district')
      .sort({ created_at: -1 })
      .limit(200);

    res.json({ posts });
  } catch (error) {
    console.error('Get admin winners error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * POST /api/admin/winner-posts/:id/approve
 * Approve a winner post — makes it visible in the public feed
 */
router.post('/winner-posts/:id/approve', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const post = await WinnerPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Winner post not found.' });

    post.approval_status = 'approved';
    await post.save();
    res.json({ message: 'Winner post approved successfully.', post });
  } catch (error) {
    console.error('Approve winner post error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * POST /api/admin/winner-posts/:id/reject
 * Reject a winner post — hidden from public feed
 */
router.post('/winner-posts/:id/reject', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const post = await WinnerPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Winner post not found.' });

    post.approval_status = 'rejected';
    await post.save();
    res.json({ message: 'Winner post rejected.', post });
  } catch (error) {
    console.error('Reject winner post error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * DELETE /api/admin/winner-posts/:id
 * Delete a winner post
 */
router.delete('/winner-posts/:id', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const post = await WinnerPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Winner post not found.' });
    await WinnerPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Winner post deleted successfully.' });
  } catch (error) {
    console.error('Delete winner post error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * GET /api/admin/dashboard
 * Detailed dashboard metrics and statistics
 */
router.get('/dashboard', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Core Counts
    const [
      totalUsers,
      totalWinners,
      pendingWinners,
      totalFlags,
      pendingFlags,
      totalStepsAllTimeResult
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      WinnerPost.countDocuments({}),
      WinnerPost.countDocuments({ approval_status: 'pending' }),
      FraudFlag.countDocuments({}),
      FraudFlag.countDocuments({ status: 'pending' }),
      ActivityLog.aggregate([
        { $match: { is_flagged: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$raw_value' } } }
      ])
    ]);

    const totalStepsAllTime = totalStepsAllTimeResult[0]?.total || 0;

    // 2. Today's active stats
    const todayLogs = await ActivityLog.find({ date: todayStr });
    const activeTodayCount = new Set(todayLogs.map(l => l.user_id.toString())).size;
    const totalStepsToday = todayLogs.reduce((sum, log) => sum + (log.is_flagged ? 0 : log.raw_value), 0);
    const avgStepsToday = activeTodayCount > 0 ? Math.round(totalStepsToday / activeTodayCount) : 0;

    // 3. User growth this week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      role: 'user',
      created_at: { $gte: sevenDaysAgo }
    });

    // Active this week (unique users in last 7 days)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const weeklyLogs = await ActivityLog.find({ date: { $gte: sevenDaysAgoStr } });
    const activeThisWeekCount = new Set(weeklyLogs.map(l => l.user_id.toString())).size;

    // 4. Last 7 Days Activity Trend
    const trendDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendDates.push(d.toISOString().split('T')[0]);
    }

    const activityTrend = await Promise.all(trendDates.map(async (dateStr) => {
      const logs = await ActivityLog.find({ date: dateStr });
      const uniqueUsers = new Set(logs.map(l => l.user_id.toString())).size;
      const stepSum = logs.reduce((sum, l) => sum + (l.is_flagged ? 0 : l.raw_value), 0);
      return {
        date: dateStr,
        steps: stepSum,
        activeUsers: uniqueUsers
      };
    }));

    // 5. District metrics (Group activity steps by district)
    const districtStatsAgg = await ActivityLog.aggregate([
      { $match: { is_flagged: { $ne: true } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.district',
          totalSteps: { $sum: '$raw_value' },
          userCount: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          district: '$_id',
          totalSteps: 1,
          userCount: { $size: '$userCount' },
          _id: 0
        }
      },
      { $sort: { totalSteps: -1 } },
      { $limit: 5 }
    ]);

    const topDistricts = districtStatsAgg.filter(d => d.district);

    // 6. Recent Fraud Flags
    const recentFlags = await FraudFlag.find({ status: 'pending' })
      .populate('user_id', 'name district')
      .populate('activity_log_id', 'date raw_value')
      .sort({ _id: -1 })
      .limit(3);

    res.json({
      summary: {
        totalUsers,
        newUsersThisWeek,
        activeToday: activeTodayCount,
        activeThisWeek: activeThisWeekCount,
        totalStepsAllTime,
        totalStepsToday,
        avgStepsToday,
        pendingWinners,
        pendingFlags,
        totalWinners,
        totalFlags
      },
      activityTrend,
      topDistricts,
      recentFlags,
      systemHealth: {
        database: mongoose.connection.readyState === 1 ? 'Connected' : mongoose.connection.readyState === 2 ? 'Connecting' : 'Disconnected',
        cronActive: global.cronTracker ? global.cronTracker.status : 'Inactive',
        serverUptime: process.uptime()
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Server error loading dashboard metrics.' });
  }
});

/**
 * POST /api/admin/trigger-winners
 * Manually trigger winner calculations (weekly / monthly / both)
 */
router.post('/trigger-winners', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { mode = 'both' } = req.body;
    const winners = await generateWinners(null, null, mode);
    res.json({
      message: `Successfully triggered and generated ${winners.length} winner posts!`,
      count: winners.length
    });
  } catch (error) {
    console.error('Trigger winners error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate winners.' });
  }
});

/**
 * GET /api/admin/stats
 * Quick dashboard stats
 */
router.get('/stats', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const [userCount, winnerCount, pendingCount, flagCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      WinnerPost.countDocuments({}),
      WinnerPost.countDocuments({ approval_status: 'pending' }),
      FraudFlag.countDocuments({ status: 'pending' })
    ]);
    res.json({ userCount, winnerCount, pendingCount, flagCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
