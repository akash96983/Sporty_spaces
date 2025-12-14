const express = require('express');
const router = express.Router();
const Space = require('../models/Space');
const { protect } = require('../middleware/auth');

// @route   POST /api/spaces
// @desc    Create a new space
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const spaceData = {
      ...req.body,
      owner: req.user.id
    };

    const space = await Space.create(spaceData);

    res.status(201).json({
      success: true,
      message: 'Space created successfully',
      space
    });
  } catch (error) {
    console.error('Create space error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create space'
    });
  }
});

// @route   GET /api/spaces/my-spaces
// @desc    Get spaces owned by logged in user
// @access  Private
router.get('/my-spaces', protect, async (req, res) => {
  try {
    const spaces = await Space.find({ owner: req.user.id }).sort('-createdAt');

    res.json({
      success: true,
      count: spaces.length,
      spaces
    });
  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spaces'
    });
  }
});

// @route   GET /api/spaces
// @desc    Get all active spaces
// @access  Public
router.get('/', async (req, res) => {
  try {
    const spaces = await Space.find({ isActive: true })
      .populate('owner', 'username email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: spaces.length,
      spaces
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spaces'
    });
  }
});

// @route   GET /api/spaces/:id
// @desc    Get single space
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id).populate('owner', 'username email');

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    res.json({
      success: true,
      space
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch space'
    });
  }
});

// @route   PUT /api/spaces/:id
// @desc    Update space
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    // Check ownership
    if (space.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this space'
      });
    }

    space = await Space.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Space updated successfully',
      space
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update space'
    });
  }
});

// @route   PATCH /api/spaces/:id/toggle-availability
// @desc    Toggle space availability
// @access  Private (Owner only)
router.patch('/:id/toggle-availability', protect, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    // Check ownership
    if (space.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this space'
      });
    }

    space.isActive = !space.isActive;
    await space.save();

    res.json({
      success: true,
      message: `Space is now ${space.isActive ? 'available' : 'unavailable'}`,
      space
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle space availability'
    });
  }
});

// @route   DELETE /api/spaces/:id
// @desc    Delete space
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    // Check ownership
    if (space.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this space'
      });
    }

    await space.deleteOne();

    res.json({
      success: true,
      message: 'Space deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete space'
    });
  }
});

module.exports = router;
