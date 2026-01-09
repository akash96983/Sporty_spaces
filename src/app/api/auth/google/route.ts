import { NextResponse } from 'next/server';
import { corsPreflight } from '@/server/cors';

export const runtime = 'nodejs';

function getGoogleCallbackUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
  if (frontendUrl) {
    return `${frontendUrl}/api/auth/google/callback`;
  }
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  }
  return 'http://localhost:3000/api/auth/google/callback';
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }

  const callbackUrl = getGoogleCallbackUrl();

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile email');

  return NextResponse.redirect(url.toString());
}
