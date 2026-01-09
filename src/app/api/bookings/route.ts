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

// POST /api/bookings
export async function POST(request: Request) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { spaceId, date, startTime, endTime, contactNumber, notes } = await request.json();

    if (!spaceId || !date || !startTime || !endTime) {
      return errorJson(
        request,
        400,
        'Please provide all required fields: spaceId, date, startTime, endTime',
      );
    }

    const space: any = await Space.findById(spaceId);
    if (!space) {
      return errorJson(request, 404, 'Space not found');
    }

    if (!space.isActive) {
      return errorJson(request, 400, 'Space is currently not available for booking');
    }

    const parseTime = (timeStr: string) => {
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

    if (endHour < startHour) {
      endHour += 24;
    }

    if (endHour <= startHour) {
      return errorJson(request, 400, 'End time must be after start time');
    }

    const duration = endHour - startHour;

    const hasConflict = await (Booking as any).checkConflict(spaceId, date, startTime, endTime);
    if (hasConflict) {
      return errorJson(request, 400, 'This time slot is already booked. Please choose a different time.');
    }

    const totalAmount = duration * space.pricePerHour;

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return errorJson(request, 400, 'Cannot book for past dates');
    }

    if (bookingDate.toDateString() === today.toDateString()) {
      const currentHour = new Date().getHours();
      if (startHour <= currentHour) {
        return errorJson(request, 400, 'Cannot book for past time slots');
      }
    }

    const booking: any = await Booking.create({
      user: authUser.id,
      space: spaceId,
      date: bookingDate,
      startTime,
      endTime,
      duration,
      totalAmount,
      contactNumber: contactNumber || '0000000000',
      notes: notes || '',
    });

    await booking.populate([
      {
        path: 'space',
        select: 'name sportType address city state images pricePerHour operatingHours',
      },
      {
        path: 'user',
        select: 'username email',
      },
    ]);

    return json(
      request,
      {
        success: true,
        message: 'Booking created successfully',
        booking,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);

    if (error?.code === 11000) {
      return errorJson(request, 400, 'This time slot is already booked. Please choose a different time.');
    }

    return errorJson(request, 500, 'Server error while creating booking');
  }
}
