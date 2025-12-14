const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { spaceId, rating, comment } = req.body;

    // Validate input
    if (!spaceId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already reviewed this space
    const existingReview = await Review.findOne({
      space: spaceId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this space'
      });
    }

    // Create review
    const review = await Review.create({
      space: spaceId,
      user: req.user.id,
      rating,
      comment
    });

    // Populate user data
    await review.populate('user', 'username');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during review creation'
    });
  }
});

// @route   GET /api/reviews/:spaceId
// @desc    Get reviews for a space
// @access  Public
router.get('/:spaceId', async (req, res) => {
  try {
    const { spaceId } = req.params;

    const reviews = await Review.find({ space: spaceId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    // Calculate rating statistics
    const totalReviews = reviews.length;
    let totalRating = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach(review => {
      totalRating += review.rating;
      ratingCounts[review.rating]++;
    });

    const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      reviews,
      stats: {
        totalReviews,
        avgRating: parseFloat(avgRating),
        ratingCounts
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during reviews fetch'
    });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private (only review owner)
router.put('/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    await review.populate('user', 'username');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during review update'
    });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private (only review owner)
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during review deletion'
    });
  }
});

module.exports = router;