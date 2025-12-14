const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Space = require('../models/Space');
const { protect } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { spaceId, date, startTime, endTime, contactNumber, notes } = req.body;

    // Validate required fields
    if (!spaceId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: spaceId, date, startTime, endTime'
      });
    }

    // Validate space exists
    const space = await Space.findById(spaceId);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    if (!space.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Space is currently not available for booking'
      });
    }

    // Parse time to calculate duration
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes = 0] = time.split(':').map(Number);
      
      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours + minutes / 60;
    };

    let startHour = parseTime(startTime);
    let endHour = parseTime(endTime);
    
    // Handle overnight bookings (e.g., 11 PM to 12 AM)
    if (endHour < startHour) {
      endHour += 24; // Add 24 hours to handle next day
    }
    
    if (endHour <= startHour) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const duration = endHour - startHour;

    // Check for conflicts
    const hasConflict = await Booking.checkConflict(spaceId, date, startTime, endTime);
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.'
      });
    }

    // Calculate total amount
    const totalAmount = duration * space.pricePerHour;

    // Validate that booking is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    // If booking is for today, check if time has passed
    if (bookingDate.toDateString() === today.toDateString()) {
      const currentHour = new Date().getHours();
      if (startHour <= currentHour) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book for past time slots'
        });
      }
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      space: spaceId,
      date: bookingDate,
      startTime,
      endTime,
      duration,
      totalAmount,
      contactNumber: contactNumber || '0000000000',
      notes: notes || ''
    });

    // Populate space and user details for response
    await booking.populate([
      {
        path: 'space',
        select: 'name sportType address city state images pricePerHour operatingHours'
      },
      {
        path: 'user',
        select: 'username email'
      }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Handle duplicate key error (double booking)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating booking'
    });
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get all bookings for the logged-in user
// @access  Private
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user.id,
      status: { $ne: 'cancelled' } // Exclude cancelled bookings
    })
      .populate({
        path: 'space',
        select: 'name sportType address city state images pricePerHour operatingHours'
      })
      .sort({ createdAt: -1 }); // Most recent first

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

// @route   GET /api/bookings/received
// @desc    Get all bookings received for spaces owned by the logged-in user
// @access  Private
router.get('/received', protect, async (req, res) => {
  try {
    // Find all spaces owned by the user
    const ownedSpaces = await Space.find({ owner: req.user.id }).select('_id');
    const spaceIds = ownedSpaces.map(space => space._id);

    if (spaceIds.length === 0) {
      return res.json({
        success: true,
        bookings: []
      });
    }

    // Get all bookings for these spaces
    const bookings = await Booking.find({ 
      space: { $in: spaceIds }
    })
      .populate({
        path: 'space',
        select: 'name sportType address city state images pricePerHour operatingHours'
      })
      .populate({
        path: 'user',
        select: 'username email'
      })
      .sort({ date: 1, startTime: 1 }); // Sort by date and time
    
    // Filter out cancelled bookings
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');

    res.json({
      success: true,
      bookings: activeBookings
    });

  } catch (error) {
    console.error('❌ Error fetching received bookings:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching received bookings',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get specific booking details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate([
        {
          path: 'space',
          select: 'name sportType address city state images pricePerHour operatingHours owner'
        },
        {
          path: 'user',
          select: 'username email'
        }
      ]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or owns the space
    if (booking.user._id.toString() !== req.user.id && 
        booking.space.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking'
    });
  }
});

// @route   DELETE /api/bookings/:id/cancel
// @desc    Cancel and delete a booking
// @access  Private
router.delete('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('space', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    // Delete the booking from database (makes slot available automatically)
    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Booking cancelled and removed successfully'
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking'
    });
  }
});

// @route   GET /api/bookings/space/:spaceId
// @desc    Get all bookings for a specific space (for space owners)
// @access  Private
router.get('/space/:spaceId', protect, async (req, res) => {
  try {
    // Check if user owns the space
    const space = await Space.findById(req.params.spaceId);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    if (space.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this space'
      });
    }

    const bookings = await Booking.find({ space: req.params.spaceId })
      .populate({
        path: 'user',
        select: 'username email'
      })
      .sort({ date: 1, startTime: 1 }); // Sort by date and time

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Error fetching space bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching space bookings'
    });
  }
});

// @route   GET /api/bookings/check-availability/:spaceId
// @desc    Check availability for a specific space and date
// @access  Public
router.get('/check-availability/:spaceId', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date'
      });
    }

    const space = await Space.findById(req.params.spaceId);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    // Get all bookings for the date
    const bookings = await Booking.find({
      space: req.params.spaceId,
      date: new Date(date),
      status: { $ne: 'cancelled' }
    }).select('startTime endTime');

    // Generate available time slots
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes = 0] = time.split(':').map(Number);
      
      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours;
    };

    const formatTime = (hour) => {
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    };

    const startHour = parseTime(space.operatingHours.opening);
    const endHour = parseTime(space.operatingHours.closing);
    
    const bookedSlots = bookings.map(booking => ({
      start: parseTime(booking.startTime),
      end: parseTime(booking.endTime)
    }));

    const availableSlots = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      const nextHour = hour + 1;
      const isBooked = bookedSlots.some(slot => 
        (hour >= slot.start && hour < slot.end) ||
        (nextHour > slot.start && nextHour <= slot.end) ||
        (hour <= slot.start && nextHour >= slot.end)
      );
      
      if (!isBooked) {
        availableSlots.push({
          startTime: formatTime(hour),
          endTime: formatTime(nextHour),
          slot: `${formatTime(hour)} - ${formatTime(nextHour)}`
        });
      }
    }

    res.json({
      success: true,
      availableSlots,
      bookedSlots: bookings.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime
      }))
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking availability'
    });
  }
});

// @route   DELETE /api/bookings/cleanup-cancelled
// @desc    Remove all cancelled bookings from database
// @access  Private
router.delete('/cleanup-cancelled', protect, async (req, res) => {
  try {
    const result = await Booking.deleteMany({ status: 'cancelled' });
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Removed ${result.deletedCount} cancelled booking(s)`
    });
  } catch (error) {
    console.error('Error cleaning up cancelled bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning up cancelled bookings'
    });
  }
});

module.exports = router;