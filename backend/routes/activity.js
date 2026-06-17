const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { calculateScore } = require('../services/scoringService');
const { checkForFraud, createFraudFlags } = require('../services/fraudService');
const { updateStreak } = require('../services/streakService');

const router = express.Router();

/**
 * POST /api/activity/log
 * Submit daily activity (step count)
 * Triggers AI scoring + fraud check + streak update
 */
router.post('/log', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Admins are not allowed to log steps
    if (user && (user.role === 'state_admin' || user.role === 'district_admin')) {
      return res.status(403).json({ error: 'Admins cannot log physical step activities.' });
    }

    // Check if user is temporarily frozen for suspicious/fraud activity
    if (user && user.frozen_until && new Date(user.frozen_until) > new Date()) {
      const remainingDays = Math.ceil((new Date(user.frozen_until) - new Date()) / (1000 * 60 * 60 * 24));
      return res.status(403).json({
        error: `Your account is temporarily suspended for suspicious activity. Unfreezes in ${remainingDays} day(s).`
      });
    }

    const { step_count, gps_lat, gps_lng, device_id } = req.body;

    if (!step_count || step_count < 0) {
      return res.status(400).json({ error: 'Valid step count is required.' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already logged today
    const existingLog = await ActivityLog.findOne({
      user_id: req.userId,
      date: today
    });

    if (existingLog) {
      // Update existing log with higher step count
      if (step_count > existingLog.raw_value) {
        // Recalculate score
        const scoreResult = await calculateScore(req.userId, step_count, today);
        
        existingLog.raw_value = step_count;
        existingLog.calculated_score = scoreResult.totalScore;
        existingLog.gps_lat = gps_lat || existingLog.gps_lat;
        existingLog.gps_lng = gps_lng || existingLog.gps_lng;
        existingLog.device_id = device_id || existingLog.device_id;
        existingLog.timestamp = new Date();
        await existingLog.save();

        return res.json({
          message: 'Activity updated with higher step count!',
          activity: existingLog,
          scoring: scoreResult
        });
      } else {
        return res.json({
          message: 'Activity already logged today with equal or higher step count.',
          activity: existingLog
        });
      }
    }

    // Calculate AI score
    const scoreResult = await calculateScore(req.userId, step_count, today);

    // Create activity log
    const activity = await ActivityLog.create({
      user_id: req.userId,
      date: today,
      raw_value: step_count,
      calculated_score: scoreResult.totalScore,
      gps_lat: gps_lat || null,
      gps_lng: gps_lng || null,
      device_id: device_id || '',
      timestamp: new Date()
    });

    // Run fraud detection
    const fraudFlags = await checkForFraud(req.userId, activity);
    if (fraudFlags.length > 0) {
      activity.is_flagged = true;
      activity.flagged_reason = fraudFlags.map(f => f.reason).join('; ');
      await activity.save();

      // Create fraud flag records
      await createFraudFlags(activity._id, req.userId, fraudFlags);
    }

    // Update streak
    const streakResult = await updateStreak(req.userId, today);

    res.status(201).json({
      message: 'Activity logged successfully!',
      activity,
      scoring: scoreResult,
      streak: streakResult.streak,
      newBadge: streakResult.badge,
      fraudWarning: fraudFlags.length > 0 ? 'Activity flagged for review' : null
    });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ error: 'Server error logging activity.' });
  }
});

/**
 * GET /api/activity/history/:user_id
 * Get activity history for a user
 */
router.get('/history/:user_id', auth, async (req, res) => {
  try {
    const userId = req.params.user_id === 'me' ? req.userId : req.params.user_id;

    // Users can only view their own history, unless they are an admin
    if (userId.toString() !== req.userId.toString() && req.user.role !== 'state_admin' && req.user.role !== 'district_admin') {
      return res.status(403).json({ error: 'Cannot view other user activity.' });
    }

    const { days = 365 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activities = await ActivityLog.find({
      user_id: userId,
      date: { $gte: startDate.toISOString().split('T')[0] }
    }).sort({ date: -1 });

    // Generate heatmap data (GitHub-style)
    const heatmapData = {};
    activities.forEach(a => {
      heatmapData[a.date] = {
        steps: a.raw_value,
        score: a.calculated_score,
        flagged: a.is_flagged
      };
    });

    // Stats
    const totalSteps = activities.reduce((sum, a) => sum + a.raw_value, 0);
    const totalScore = activities.reduce((sum, a) => sum + a.calculated_score, 0);
    const avgSteps = activities.length > 0 ? Math.round(totalSteps / activities.length) : 0;
    const maxSteps = activities.length > 0 ? Math.max(...activities.map(a => a.raw_value)) : 0;

    res.json({
      activities,
      heatmapData,
      stats: {
        totalSteps,
        totalScore,
        avgSteps,
        maxSteps,
        daysLogged: activities.length
      }
    });
  } catch (error) {
    console.error('Activity history error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * GET /api/activity/today
 * Get today's activity for current user
 */
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const activity = await ActivityLog.findOne({
      user_id: req.userId,
      date: today
    });

    res.json({ activity: activity || null });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
