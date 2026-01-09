import { connectDB } from '@/server/db';
import Booking from '@/server/models/Booking';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

type Params = { id: string };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { id } = await context.params;

    const booking: any = await Booking.findById(id).populate([
      {
        path: 'space',
        select: 'name sportType address city state images pricePerHour operatingHours owner',
      },
      {
        path: 'user',
        select: 'username email',
      },
    ]);

    if (!booking) {
      return errorJson(request, 404, 'Booking not found');
    }

    if (booking.user._id.toString() !== authUser.id && booking.space.owner.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to view this booking');
    }

    return json(request, { success: true, booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return errorJson(request, 500, 'Server error while fetching booking');
  }
}
