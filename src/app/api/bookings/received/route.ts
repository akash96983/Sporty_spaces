import { connectDB } from '@/server/db';
import Booking from '@/server/models/Booking';
import Space from '@/server/models/Space';
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

    const ownedSpaces: any[] = await Space.find({ owner: authUser.id }).select('_id');
    const spaceIds = ownedSpaces.map((space) => space._id);

    if (spaceIds.length === 0) {
      return json(request, { success: true, bookings: [] });
    }

    const bookings: any[] = await Booking.find({ space: { $in: spaceIds } })
      .populate({
        path: 'space',
        select: 'name sportType address city state images pricePerHour operatingHours',
      })
      .populate({
        path: 'user',
        select: 'username email',
      })
      .sort({ date: 1, startTime: 1 });

    const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

    return json(request, { success: true, bookings: activeBookings });
  } catch (error: any) {
    console.error('❌ Error fetching received bookings:', error);
    console.error('Stack trace:', error?.stack);
    return json(
      request,
      {
        success: false,
        message: 'Server error while fetching received bookings',
        error: error?.message,
      },
      { status: 500 },
    );
  }
}
