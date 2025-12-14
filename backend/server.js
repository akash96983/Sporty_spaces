const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const passport = require('passport');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with larger limit for images
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Initialize Passport (for OAuth)
app.use(passport.initialize());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Your Next.js frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware removed for cleaner output

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/spaces', require('./routes/spaces'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/bookings', require('./routes/bookings'));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Turf Rental API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.statusCode || 500).json({ 
    success: false, 
    message: err.message || 'Server error' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
