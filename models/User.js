const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'library', 'admin'],
    default: 'student'
  },
  avatar: {
    url: String
  },
  // Student specific fields
  // college: {
  //   type: String,
  //   required: function () { return this.role === 'student'; }
  // },
  academicInterests: [String],

  // Library specific fields
  libraryName: {
    type: String,
    required: function () { return this.role === 'library'; }
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  gstNumber: {
    type: String,
    required: function () { return this.role === 'library'; }
  },

  // KYC Verification
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  kycDocuments: [{
    type: String,
    url: String
  }],

  // Ratings
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Social login
  googleId: String,
  facebookId: String,
  linkedinId: String
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.updateRating = function (newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
};

module.exports = mongoose.model('User', userSchema);