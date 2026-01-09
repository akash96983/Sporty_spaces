import { NextResponse } from 'next/server';
import { corsPreflight } from '@/server/cors';

export const runtime = 'nodejs';

function getGitHubCallbackUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
  if (frontendUrl) {
    return `${frontendUrl}/api/auth/github/callback`;
  }
  if (process.env.GITHUB_CALLBACK_URL) {
    return process.env.GITHUB_CALLBACK_URL;
  }
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/github/callback`;
  }
  return 'http://localhost:3000/api/auth/github/callback';
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }

  const callbackUrl = getGitHubCallbackUrl();

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('scope', 'user:email');

  return NextResponse.redirect(url.toString());
}
