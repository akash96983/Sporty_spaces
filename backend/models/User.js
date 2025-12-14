const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide valid email address']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not using OAuth
      return !this.isOAuthUser;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default in queries
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values, but unique when set
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values, but unique when set
  },
  avatar: {
    type: String,
    default: null
  },
  isOAuthUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: false,
  versionKey: false
});

// Hash password before saving to database
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
