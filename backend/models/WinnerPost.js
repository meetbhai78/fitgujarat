const mongoose = require('mongoose');

const winnerPostSchema = new mongoose.Schema({
  level: { type: String, enum: ['district', 'state'], required: true },
  district: { type: String, default: null }, // null if level=state
  category: { type: String, enum: ['top_scorer', 'streak_leader', 'peak_performer', 'top_referrer'], required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true },
  badge_card_url: { type: String, default: '' },
  is_live: { type: Boolean, default: true },

  // ─── Cadence / Frequency ──────────────────────────────────────────────────
  frequency: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },

  // ─── Media Post (Instagram-style) ─────────────────────────────────────────
  media_url: { type: String, default: '' },          // S3 / local path to image or audio
  media_type: { type: String, enum: ['none', 'image', 'audio'], default: 'none' },
  caption: { type: String, default: '' },

  // ─── Approval Workflow ────────────────────────────────────────────────────
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'  // system-generated posts auto-approved; winner uploads = pending
  },

  // ─── Engagement ───────────────────────────────────────────────────────────
  view_count: { type: Number, default: 0 },
  share_count: { type: Number, default: 0 },
  like_count: { type: Number, default: 0 },
  viewed_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  cycle_start: { type: Date, required: true },
  cycle_end: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

winnerPostSchema.index({ level: 1, district: 1, is_live: 1 });
winnerPostSchema.index({ category: 1, is_live: 1 });
winnerPostSchema.index({ approval_status: 1, is_live: 1 });

module.exports = mongoose.model('WinnerPost', winnerPostSchema);
