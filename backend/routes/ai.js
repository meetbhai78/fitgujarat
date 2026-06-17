const express = require('express');
const auth = require('../middleware/auth');
const {
  generateAIRecommendations,
  generateAIChatResponse,
  aiCalculateScore,
  aiFraudCheck
} = require('../services/aiService');

const router = express.Router();

/**
 * ==========================================
 * AI Services (Internal Microservice - Section 6)
 * ==========================================
 */

/**
 * POST /ai/score
 * Calculate score for an activity log entry
 */
router.post('/ai/score', async (req, res) => {
  try {
    const { userId, steps, date } = req.body;
    if (!userId || steps === undefined || !date) {
      return res.status(400).json({ error: 'userId, steps, and date are required.' });
    }
    const scoreResult = await aiCalculateScore(userId, steps, date);
    res.json({ scoring: scoreResult });
  } catch (error) {
    console.error('AI Score service error:', error);
    res.status(500).json({ error: 'AI scoring service error: ' + error.message });
  }
});

/**
 * POST /ai/fraud-check
 * Analyze activity log for fraud signals
 */
router.post('/ai/fraud-check', async (req, res) => {
  try {
    const { userId, activity } = req.body;
    if (!userId || !activity) {
      return res.status(400).json({ error: 'userId and activity are required.' });
    }
    const flags = await aiFraudCheck(userId, activity);
    res.json({ flags, is_flagged: flags.length > 0 });
  } catch (error) {
    console.error('AI Fraud check service error:', error);
    res.status(500).json({ error: 'AI fraud check service error: ' + error.message });
  }
});

/**
 * GET /ai/recommendations/:user_id
 * Return personalized tips (complies with Section 6)
 */
router.get('/ai/recommendations/:user_id', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const recommendations = await generateAIRecommendations(userId);
    res.json({ recommendations });
  } catch (error) {
    console.error('AI Recommendations service error:', error);
    res.status(500).json({ error: 'AI recommendations service error: ' + error.message });
  }
});

/**
 * ==========================================
 * User-facing AI API Endpoint
 * ==========================================
 */

/**
 * POST /api/ai/chat
 * Interactive chat with AI Health Coach (requires JWT auth)
 */
router.post('/api/ai/chat', auth, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    
    const response = await generateAIChatResponse(req.userId, message, history || []);
    res.json(response);
  } catch (error) {
    console.error('AI Chat endpoint error:', error);
    res.status(500).json({ error: 'AI Health Coach is temporarily offline.' });
  }
});

module.exports = router;
