import { connectDB } from '@/server/db';
import Booking from '@/server/models/Booking';
import Space from '@/server/models/Space';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

type Params = { spaceId: string };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();

    const { spaceId } = await context.params;

    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return errorJson(request, 400, 'Please provide date');
    }

    const space: any = await Space.findById(spaceId);
    if (!space) {
      return errorJson(request, 404, 'Space not found');
    }

    const bookings: any[] = await Booking.find({
      space: spaceId,
      date: new Date(date),
      status: { $ne: 'cancelled' },
    }).select('startTime endTime');

    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes = 0] = time.split(':').map(Number);

      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      return hours;
    };

    const formatTime = (hour: number) => {
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    };

    const startHour = parseTime(space.operatingHours.opening);
    const endHour = parseTime(space.operatingHours.closing);

    const bookedSlots = bookings.map((booking) => ({
      start: parseTime(booking.startTime),
      end: parseTime(booking.endTime),
    }));

    const availableSlots: any[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      const nextHour = hour + 1;
      const isBooked = bookedSlots.some(
        (slot) =>
          (hour >= slot.start && hour < slot.end) ||
          (nextHour > slot.start && nextHour <= slot.end) ||
          (hour <= slot.start && nextHour >= slot.end),
      );

      if (!isBooked) {
        availableSlots.push({
          startTime: formatTime(hour),
          endTime: formatTime(nextHour),
          slot: `${formatTime(hour)} - ${formatTime(nextHour)}`,
        });
      }
    }

    return json(request, {
      success: true,
      availableSlots,
      bookedSlots: bookings.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return errorJson(request, 500, 'Server error while checking availability');
  }
}
