import { NextResponse } from 'next/server';
import { corsPreflight } from '@/server/cors';
import { json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const res = json(request, {
    success: true,
    message: 'Logged out successfully',
  });

  res.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
