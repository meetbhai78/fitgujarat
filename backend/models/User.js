const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  password_hash: { type: String, required: true },
  state: { type: String, default: 'Gujarat', immutable: true },
  district: { type: String, default: '' },
  profile_photo_url: { type: String, default: '' },
  role: { type: String, enum: ['user', 'district_admin', 'state_admin'], default: 'user' },
  is_verified: { type: Boolean, default: false },
  district_locked: { type: Boolean, default: false },
  preferred_language: { type: String, enum: ['en', 'gu'], default: 'en' },
  created_at: { type: Date, default: Date.now },
  frozen_until: { type: Date, default: null }
});

// Ensure at least email or phone is provided
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    return next(new Error('Either email or phone is required'));
  }
  next();
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.name;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
