const mongoose = require('mongoose');

const rankingEntrySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  value: { type: Number, default: 0 },
  rank: { type: Number, default: 0 }
}, { _id: false });

const leaderboardSchema = new mongoose.Schema({
  district: { type: String, required: true }, // district name or "STATE"
  type: { type: String, enum: ['overall', 'streak', 'peak_day'], required: true },
  cycle_start: { type: Date, required: true },
  cycle_end: { type: Date, required: true },
  rankings: [rankingEntrySchema],
  updated_at: { type: Date, default: Date.now }
});

// Compound index for fast lookups
leaderboardSchema.index({ district: 1, type: 1, cycle_end: -1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
