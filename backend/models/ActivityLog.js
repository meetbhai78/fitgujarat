const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  raw_value: { type: Number, required: true }, // step count
  calculated_score: { type: Number, default: 0 },
  gps_lat: { type: Number, default: null },
  gps_lng: { type: Number, default: null },
  device_id: { type: String, default: '' },
  is_flagged: { type: Boolean, default: false },
  flagged_reason: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

// Compound index for efficient queries
activityLogSchema.index({ user_id: 1, date: -1 });
activityLogSchema.index({ date: -1, calculated_score: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
