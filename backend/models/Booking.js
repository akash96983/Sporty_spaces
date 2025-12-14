const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  space: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide booking date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time']
  },
  duration: {
    type: Number,
    required: true, // Duration in hours
    min: [1, 'Duration must be at least 1 hour']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'paid' // For now, assuming payment is handled externally
  },
  contactNumber: {
    type: String,
    required: false,
    default: '0000000000'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  expiresAt: {
    type: Date,
    index: { expires: 0 } // TTL index - MongoDB auto-deletes when this date passes
  }
}, {
  timestamps: true
});

// Create compound index for better query performance
BookingSchema.index({ space: 1, date: 1, startTime: 1 });

// Pre-save middleware to calculate expiresAt based on booking end time
BookingSchema.pre('save', async function() {
  try {
    if (this.isNew || this.isModified('date') || this.isModified('endTime')) {
      const bookingDate = new Date(this.date);
      
      // Parse end time (handles formats like "10 AM", "3 PM", "10:30 AM")
      const endTimeParts = this.endTime.split(' ');
      const period = endTimeParts[1] || '';
      const timePart = endTimeParts[0];
      let [hours, minutes = 0] = timePart.split(':').map(Number);
      
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Parse start time to check for overnight bookings
      const startTimeParts = this.startTime.split(' ');
      const startPeriod = startTimeParts[1] || '';
      const startTimePart = startTimeParts[0];
      let [startHours] = startTimePart.split(':').map(Number);
      
      if (startPeriod.toUpperCase() === 'PM' && startHours !== 12) {
        startHours += 12;
      } else if (startPeriod.toUpperCase() === 'AM' && startHours === 12) {
        startHours = 0;
      }
      
      // Set expiration to end time of booking
      bookingDate.setHours(hours, minutes, 0, 0);
      
      // If overnight booking (end time < start time), add a day
      if (hours < startHours) {
        bookingDate.setDate(bookingDate.getDate() + 1);
      }
      
      this.expiresAt = bookingDate;
    }
  } catch (error) {
    console.error('Error in Booking pre-save middleware:', error);
    throw error;
  }
});

// Method to check if booking conflicts with existing bookings
BookingSchema.statics.checkConflict = async function(spaceId, date, startTime, endTime, excludeBookingId = null) {
  // Parse time strings to compare properly
  const parseTimeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes = 0] = time.split(':').map(Number);
    
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period?.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  let newStartMinutes = parseTimeToMinutes(startTime);
  let newEndMinutes = parseTimeToMinutes(endTime);
  
  // Handle overnight bookings
  if (newEndMinutes < newStartMinutes) {
    newEndMinutes += 24 * 60; // Add 24 hours in minutes
  }

  // Get all bookings for the same space and date
  const existingBookings = await this.find({
    space: spaceId,
    date: new Date(date),
    status: { $ne: 'cancelled' },
    ...(excludeBookingId && { _id: { $ne: excludeBookingId } })
  });

  // Check for time conflicts
  for (const booking of existingBookings) {
    let existingStartMinutes = parseTimeToMinutes(booking.startTime);
    let existingEndMinutes = parseTimeToMinutes(booking.endTime);
    
    // Handle overnight bookings for existing bookings
    if (existingEndMinutes < existingStartMinutes) {
      existingEndMinutes += 24 * 60;
    }

    // Check if times overlap
    const hasConflict = (
      (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
      (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
      (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
    );

    if (hasConflict) {
      return true;
    }
  }

  return false;
};

module.exports = mongoose.model('Booking', BookingSchema);