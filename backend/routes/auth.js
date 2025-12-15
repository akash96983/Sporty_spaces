const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during signup' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Check for user (include password field using select)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if password matches
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user / clear token
// @access  Private
router.post('/logout', protect, (req, res) => {
  // Clear the cookie
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(0)
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile (username, email)
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide at least one field to update' 
      });
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const query = { _id: { $ne: req.user.id } };
      if (username && email) {
        query.$or = [{ username }, { email }];
      } else if (username) {
        query.username = username;
      } else if (email) {
        query.email = email;
      }

      const existingUser = await User.findOne(query);
      if (existingUser) {
        if (existingUser.username === username) {
          return res.status(400).json({ 
            success: false, 
            message: 'Username already exists' 
          });
        }
        if (existingUser.email === email) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email already exists' 
          });
        }
      }
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during profile update' 
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide current and new password' 
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during password change' 
    });
  }
});

// @route   DELETE /api/auth/delete-account
// @desc    Delete user account
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    // Clear auth cookies
    res.cookie('token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(0)
    });
    res.cookie('token_client', '', {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      expires: new Date(0)
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during account deletion' 
    });
  }
});

// ==================== OAuth Routes ====================
const passport = require('passport');
require('../config/passport'); // Initialize passport strategies

console.log('📍 Registering OAuth routes...');

// @route   GET /api/auth/google
// @desc    Redirect to Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google OAuth error:', err);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendURL}/login?error=oauth_error`);
    }
    if (!user) {
      console.error('Google OAuth failed - no user:', info);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }

    try {
      // Generate JWT token
      const token = generateToken(user._id);

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set a client-readable cookie for middleware
      res.cookie('token_client', 'authenticated', {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Redirect to frontend
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(frontendURL);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

// @route   GET /api/auth/github
// @desc    Redirect to GitHub OAuth
// @access  Public
router.get('/github', passport.authenticate('github', {
  scope: ['user:email'],
  session: false
}));

// @route   GET /api/auth/github/callback
// @desc    GitHub OAuth callback
// @access  Public
router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user, info) => {
    if (err) {
      console.error('GitHub OAuth error:', err);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendURL}/login?error=oauth_error`);
    }
    if (!user) {
      console.error('GitHub OAuth failed - no user:', info);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }

    try {
      // Generate JWT token
      const token = generateToken(user._id);

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set a client-readable cookie for middleware
      res.cookie('token_client', 'authenticated', {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Redirect to frontend
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(frontendURL);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

console.log('✅ OAuth routes registered (google, google/callback, github, github/callback)');

module.exports = router;
