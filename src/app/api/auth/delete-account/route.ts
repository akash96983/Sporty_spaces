import { connectDB } from '@/server/db';
import { requireUser } from '@/server/auth';
import Space from '@/server/models/Space';
import Booking from '@/server/models/Booking';
import User from '@/server/models/User';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request) {
  try {
    await connectDB();

    const authUser = await requireUser(request);

    const userSpaces: any[] = await Space.find({ owner: authUser.id });
    const userSpaceIds = userSpaces.map((space) => space._id);

    if (userSpaceIds.length > 0) {
      await Booking.deleteMany({ space: { $in: userSpaceIds } });
    }

    await Space.deleteMany({ owner: authUser.id });
    await Booking.deleteMany({ user: authUser.id });
    await User.findByIdAndDelete(authUser.id);

    const res = json(request, {
      success: true,
      message: 'Account deleted successfully',
    });

    res.cookies.set('token', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.cookies.set('token_client', '', {
      httpOnly: false,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Delete account error:', error);
    return errorJson(request, 500, 'Server error during account deletion');
  }
}
