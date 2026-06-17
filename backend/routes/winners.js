const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const upload = require('../middleware/upload');
const WinnerPost = require('../models/WinnerPost');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (fileBuffer, mimeType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'fitgujarat_winners',
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};
const {
  getDistrictWinners,
  getStateWinners,
  registerView,
  registerShare,
  registerLike,
  generateWinners,
  generateWinnerCardData,
  getWinnersHistory
} = require('../services/winnerService');
const { generateAIRecommendations } = require('../services/aiService');

const router = express.Router();

// ─── Public feed endpoints ─────────────────────────────────────────────────

/**
 * GET /api/winners/district/:district
 * Weekly district winners (approved only, same district)
 */
router.get('/district/:district', auth, async (req, res) => {
  try {
    const { district } = req.params;
    if (req.user.district !== district && req.user.role === 'user') {
      return res.status(403).json({ error: 'You can only view your own district winners.' });
    }
    const winners = await getDistrictWinners(district);
    const cards = winners.map(w => generateWinnerCardData(w, w.user_id));
    res.json({ winners: cards });
  } catch (error) {
    console.error('District winners error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * GET /api/winners/state
 * Monthly state winners (approved only, visible to all)
 */
router.get('/state', auth, async (req, res) => {
  try {
    const winners = await getStateWinners();
    const cards = winners.map(w => generateWinnerCardData(w, w.user_id));
    res.json({ winners: cards });
  } catch (error) {
    console.error('State winners error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

/**
 * GET /api/winners/history
 * Past (not live) winner posts — approved only for users
 */
router.get('/history', auth, async (req, res) => {
  try {
    const { level, district } = req.query;
    const isAdmin = req.user.role !== 'user';

    if (level === 'district' && district && req.user.district !== district && !isAdmin) {
      return res.status(403).json({ error: 'You can only view your own district winners.' });
    }

    const winners = await getWinnersHistory(level, district, isAdmin);

    const filtered = winners.filter(w => {
      if (w.level === 'state') return true;
      if (w.level === 'district') {
        if (isAdmin) return true;
        return w.district === req.user.district;
      }
      return false;
    });

    const cards = filtered.map(w => generateWinnerCardData(w, w.user_id));
    res.json({ winners: cards });
  } catch (error) {
    console.error('Winners history error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Engagement ─────────────────────────────────────────────────────────────

router.post('/:id/view', auth, async (req, res) => {
  try {
    const post = await registerView(req.params.id, req.userId);
    if (!post) return res.status(404).json({ error: 'Winner post not found.' });
    res.json({ view_count: post.view_count, share_count: post.share_count });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/:id/share', auth, async (req, res) => {
  try {
    const post = await registerShare(req.params.id);
    if (!post) return res.status(404).json({ error: 'Winner post not found.' });
    res.json({ view_count: post.view_count, share_count: post.share_count });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await registerLike(req.params.id, req.userId);
    if (!post) return res.status(404).json({ error: 'Winner post not found.' });
    const isLiked = post.liked_by.includes(req.userId);
    res.json({
      view_count: post.view_count,
      share_count: post.share_count,
      like_count: post.like_count,
      liked: isLiked
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Media Upload (winner posts their celebration) ─────────────────────────

/**
 * POST /api/winners/:id/media
 * Winner uploads media (image/audio) + caption to their own post
 * The post moves to approval_status = 'pending' after upload
 */
router.post('/:id/media', auth, upload.single('media'), async (req, res) => {
  try {
    const post = await WinnerPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Winner post not found.' });

    // Only the winner themselves can upload
    if (String(post.user_id) !== String(req.userId)) {
      return res.status(403).json({ error: 'Only the winner can upload media for this post.' });
    }

    const { caption } = req.body;

    if (req.file) {
      // Determine media type from mimetype
      const isImage = req.file.mimetype.startsWith('image/');
      
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      
      post.media_url = uploadResult.secure_url;
      post.media_type = isImage ? 'image' : 'audio';
      post.approval_status = 'pending'; // needs admin approval after media upload
    }

    if (caption !== undefined) {
      post.caption = caption.substring(0, 500); // max 500 chars
      if (!req.file && post.caption) {
        // Caption-only update also needs approval
        post.approval_status = 'pending';
      }
    }

    await post.save();
    res.json({
      message: 'Media uploaded successfully. Awaiting admin approval.',
      post: {
        postId: post._id,
        media_url: post.media_url,
        media_type: post.media_type,
        caption: post.caption,
        approval_status: post.approval_status
      }
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ error: error.message || 'Server error during media upload.' });
  }
});

// ─── System trigger ─────────────────────────────────────────────────────────

/**
 * POST /api/winners/generate
 * Admin-triggered or cron-triggered winner generation
 */
router.post('/generate', auth, roleGuard('state_admin'), async (req, res) => {
  try {
    const { cycle_start, cycle_end, mode } = req.body;
    const winners = await generateWinners(
      cycle_start ? new Date(cycle_start) : undefined,
      cycle_end ? new Date(cycle_end) : undefined,
      mode || 'both'
    );
    res.json({
      message: `Generated ${winners.length} winner posts.`,
      count: winners.length
    });
  } catch (error) {
    console.error('Winner generation error:', error);
    res.status(500).json({ error: 'Server error generating winners.' });
  }
});

// ─── AI Recommendations ─────────────────────────────────────────────────────

router.get('/recommendations', auth, async (req, res) => {
  try {
    const recommendations = await generateAIRecommendations(req.userId);
    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
