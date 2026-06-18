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
  frozen_until: { type: Date, default: null },
  is_hidden: { type: Boolean, default: false },
  referral_code: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  referred_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referral_points: { type: Number, default: 0 },
  referral_count: { type: Number, default: 0 }
});

// Ensure at least email or phone is provided, and generate referral code if missing
userSchema.pre('validate', function(next) {
  if (!this.referral_code) {
    const cleanName = this.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.referral_code = `${cleanName || 'user'}${randomNum}`;
  }
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
