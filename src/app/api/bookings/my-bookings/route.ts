import { connectDB } from '@/server/db';
import Booking from '@/server/models/Booking';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const bookings = await Booking.find({
      user: authUser.id,
      status: { $ne: 'cancelled' },
    })
      .populate({
        path: 'space',
        select: 'name sportType address city state images pricePerHour operatingHours',
      })
      .sort({ createdAt: -1 });

    return json(request, { success: true, bookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return errorJson(request, 500, 'Server error while fetching bookings');
  }
}
