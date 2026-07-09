// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['user', 'artist', 'admin'];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ROLES, default: 'user', required: true },
    phone: { type: String, default: '' },
    displayName: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    avatar: { type: String, default: '' },
    // Flutterwave subaccount id, set when user upgrades to artist
    subaccountId: { type: String, default: '' },
    // MMT = MTN MoMo, AIR = Airtel Money
    mobileProvider: { type: String, enum: ['MMT', 'AIR', ''], default: '' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    phone: this.phone,
    displayName: this.displayName,
    bio: this.bio,
    avatar: this.avatar,
    subaccountId: this.subaccountId,
    mobileProvider: this.mobileProvider,
    createdAt: this.createdAt,
  };
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
