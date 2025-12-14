const Booking = require('../models/Booking');

/**
 * Backup cleanup for expired bookings
 * Primary cleanup is handled by MongoDB TTL index on expiresAt field
 * This is a fallback that runs less frequently
 */
const cleanupExpiredBookings = async () => {
  try {
    const now = new Date();
    console.log('🧹 Running backup booking cleanup...');
    console.log(`Current time: ${now.toLocaleString()}`);

    // Delete bookings where expiresAt has passed (backup for TTL index)
    const result = await Booking.deleteMany({
      expiresAt: { $lt: now },
      status: { $in: ['confirmed', 'completed'] }
    });

    if (result.deletedCount > 0) {
      console.log(`✅ Backup cleanup deleted ${result.deletedCount} expired booking(s)`);
    } else {
      console.log('✅ No expired bookings to delete (TTL index handling cleanup)');
    }

    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} expired booking(s)`
    };

  } catch (error) {
    console.error('❌ Error cleaning up expired bookings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = { cleanupExpiredBookings };
