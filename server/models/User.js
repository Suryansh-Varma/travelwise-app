const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  name: { type: String },
  provider: { type: String, default: 'email' },
  providerId: { type: String },
  verified: { type: Boolean, default: false },
  verifyToken: { type: String },
  verifyTokenExpires: { type: Date },
  sessionToken: { type: String },
  sessionExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
