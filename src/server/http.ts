import { NextResponse } from 'next/server';
import { withCors } from './cors';

export function json(request: Request, body: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(body, init);
  return withCors(request, res);
}

export function errorJson(request: Request, status: number, message: string, extra?: Record<string, unknown>): NextResponse {
  return json(
    request,
    {
      success: false,
      message,
      ...(extra ?? {}),
    },
    { status },
  );
}
