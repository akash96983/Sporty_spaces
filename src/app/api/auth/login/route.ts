import { connectDB } from '@/server/db';
import User from '@/server/models/User';
import { generateToken } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return errorJson(request, 400, 'Please provide email and password');
    }

    const user: any = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorJson(request, 401, 'Invalid email or password');
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return errorJson(request, 401, 'Invalid email or password');
    }

    const token = generateToken(String(user._id));

    const res = json(
      request,
      {
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 },
    );

    res.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return errorJson(request, 500, 'Server error during login');
  }
}
