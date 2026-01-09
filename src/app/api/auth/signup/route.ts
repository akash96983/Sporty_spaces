import { NextResponse } from 'next/server';
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

    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return errorJson(request, 400, 'Please provide all required fields');
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return errorJson(request, 400, 'User with this email or username already exists');
    }

    const user: any = await User.create({ username, email, password });

    const token = generateToken(String(user._id));

    const res = json(
      request,
      {
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 },
    );

    res.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error('Signup error:', error);
    return errorJson(request, 500, error?.message || 'Server error during signup');
  }
}
