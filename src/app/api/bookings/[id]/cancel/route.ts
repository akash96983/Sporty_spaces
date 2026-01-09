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

export async function DELETE(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { id } = await context.params;

    const booking: any = await Booking.findById(id).populate('space', 'name');

    if (!booking) {
      return errorJson(request, 404, 'Booking not found');
    }

    if (booking.user.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      return errorJson(request, 400, 'Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      return errorJson(request, 400, 'Cannot cancel a completed booking');
    }

    await Booking.findByIdAndDelete(id);

    return json(request, {
      success: true,
      message: 'Booking cancelled and removed successfully',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return errorJson(request, 500, 'Server error while cancelling booking');
  }
}
