import Booking from '@/server/models/Booking';
import Space from '@/server/models/Space';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

type Params = { spaceId: string };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request, context: { params: Promise<Params> }) {
  try {
    const authUser = await requireUser(request);

    const { spaceId } = await context.params;

    const space: any = await Space.findById(spaceId);
    if (!space) {
      return errorJson(request, 404, 'Space not found');
    }

    if (space.owner.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to view bookings for this space');
    }

    const bookings = await Booking.find({ space: spaceId })
      .populate({
        path: 'user',
        select: 'username email',
      })
      .sort({ date: 1, startTime: 1 });

    return json(request, { success: true, bookings });
  } catch (error) {
    console.error('Error fetching space bookings:', error);
    return errorJson(request, 500, 'Server error while fetching space bookings');
  }
}
