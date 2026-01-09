import { connectDB } from '@/server/db';
import Booking from '@/server/models/Booking';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    await requireUser(request);

    const result: any = await Booking.deleteMany({ status: 'cancelled' });

    return json(request, {
      success: true,
      deletedCount: result.deletedCount,
      message: `Removed ${result.deletedCount} cancelled booking(s)`,
    });
  } catch (error) {
    console.error('Error cleaning up cancelled bookings:', error);
    return errorJson(request, 500, 'Server error while cleaning up cancelled bookings');
  }
}
