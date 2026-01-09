import { connectDB } from '@/server/db';
import User from '@/server/models/User';
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

    const user: any = await User.findById(authUser.id);

    return json(request, {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    if (error?.status) {
      return errorJson(request, error.status, error.message);
    }
    return errorJson(request, 500, 'Server error');
  }
}
