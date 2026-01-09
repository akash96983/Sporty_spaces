import { NextResponse } from 'next/server';

const allowedOrigins = [
  'http://localhost:3000',
  'https://sporty-spaces-9lgf.vercel.app',
];

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return true;
  }
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  try {
    const url = new URL(origin);
    return url.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

export function withCors(request: Request, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');

  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Vary', 'Origin');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export function corsPreflight(request: Request): NextResponse {
  const origin = request.headers.get('origin');

  if (origin && !isOriginAllowed(origin)) {
    return NextResponse.json(
      { success: false, message: 'Not allowed by CORS' },
      { status: 403 },
    );
  }

  return withCors(request, new NextResponse(null, { status: 204 }));
}
