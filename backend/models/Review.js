const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  space: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Please provide review comment'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews from same user for same space
ReviewSchema.index({ space: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);