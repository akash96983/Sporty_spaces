import { NextResponse } from 'next/server';
import { corsPreflight } from '@/server/cors';

export const runtime = 'nodejs';

function getBaseUrl(request: Request): string {
  const configured = process.env.FRONTEND_URL?.replace(/\/$/, '');
  if (configured) {
    return configured;
  }
  return new URL(request.url).origin;
}

function getGitHubCallbackUrl(request: Request): string {
  if (process.env.GITHUB_CALLBACK_URL) {
    return process.env.GITHUB_CALLBACK_URL;
  }
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/github/callback`;
  }
  return `${getBaseUrl(request)}/api/auth/github/callback`;
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }

  const callbackUrl = getGitHubCallbackUrl(request);

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('scope', 'user:email');

  return NextResponse.redirect(url.toString());
}
