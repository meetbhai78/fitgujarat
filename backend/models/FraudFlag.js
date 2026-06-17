const mongoose = require('mongoose');

const fraudFlagSchema = new mongoose.Schema({
  activity_log_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityLog', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewed_at: { type: Date, default: null }
});

fraudFlagSchema.index({ status: 1 });

module.exports = mongoose.model('FraudFlag', fraudFlagSchema);
