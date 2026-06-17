const mongoose = require('mongoose');

const userStreakSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  current_streak: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  last_activity_date: { type: String, default: '' }, // YYYY-MM-DD
  freeze_available: { type: Number, default: 1 }, // 1 free freeze per month
  freeze_used_this_month: { type: Boolean, default: false },
  recovery_active: { type: Boolean, default: false },
  recovery_deadline: { type: Date, default: null },
  streak_before_break: { type: Number, default: 0 }
});

module.exports = mongoose.model('UserStreak', userStreakSchema);
