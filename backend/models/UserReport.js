const mongoose = require('mongoose');

const userReportSchema = new mongoose.Schema({
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: {
    type: String,
    enum: ['fake_steps', 'inappropriate_content', 'harassment', 'spam', 'other'],
    required: true
  },
  details:  { type: String, default: '', maxlength: 500 },
  status:   { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewed_at: { type: Date, default: null },
  created_at:  { type: Date, default: Date.now }
});

// One user can only report another user once (prevent spam)
userReportSchema.index({ reporter_id: 1, reported_id: 1 }, { unique: true });

module.exports = mongoose.model('UserReport', userReportSchema);
