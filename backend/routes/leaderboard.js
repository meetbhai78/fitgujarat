const express = require('express');
const auth = require('../middleware/auth');
const { getLeaderboard, getUserRank } = require('../services/leaderboardService');

const router = express.Router();

/**
 * GET /api/leaderboard/district/:district/:type
 * Get district leaderboard
 * type = overall | streak | peak_day
 */
router.get('/district/:district/:type', auth, async (req, res) => {
  try {
    const { district, type } = req.params;

    // Visibility rule: users can only view their own district's leaderboard
    if (req.user.district !== district && req.user.role === 'user') {
      return res.status(403).json({ error: 'You can only view your own district leaderboard.' });
    }

    if (!['overall', 'streak', 'peak_day'].includes(type)) {
      return res.status(400).json({ error: 'Invalid leaderboard type.' });
    }

    const leaderboard = await getLeaderboard(district, type);
    if (leaderboard) {
      await leaderboard.populate('rankings.user_id', 'name profile_photo_url district');
      // Map it to flatten user_id fields
      leaderboard.rankings = leaderboard.rankings.map(r => ({
        user_id: r.user_id._id,
        name: r.user_id.name,
        profile_photo_url: r.user_id.profile_photo_url,
        district: r.user_id.district,
        value: r.value,
        secondary_value: r.secondary_value,
        rank: r.rank
      }));
    }

    // Find user's position
    const userRank = await getUserRank(req.userId, district, type);

    res.json({
      leaderboard,
      userRank,
      userId: req.userId
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * GET /api/leaderboard/state/:type
 * Get state-level leaderboard
 */
router.get('/state/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;

    if (!['overall', 'streak', 'peak_day'].includes(type)) {
      return res.status(400).json({ error: 'Invalid leaderboard type.' });
    }

    const leaderboard = await getLeaderboard('STATE', type);
    if (leaderboard) {
      await leaderboard.populate('rankings.user_id', 'name profile_photo_url district');
      // Map it to flatten user_id fields
      leaderboard.rankings = leaderboard.rankings.map(r => ({
        user_id: r.user_id._id,
        name: r.user_id.name,
        profile_photo_url: r.user_id.profile_photo_url,
        district: r.user_id.district,
        value: r.value,
        rank: r.rank
      }));
    }

    // Find user's position
    const userRank = await getUserRank(req.userId, 'STATE', type);

    res.json({
      leaderboard,
      userRank,
      userId: req.userId
    });
  } catch (error) {
    console.error('State leaderboard error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
