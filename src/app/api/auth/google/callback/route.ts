import { NextResponse } from 'next/server';
import { connectDB } from '@/server/db';
import { generateToken } from '@/server/auth';
import User from '@/server/models/User';
import { corsPreflight } from '@/server/cors';

export const runtime = 'nodejs';

function getBaseUrl(request: Request): string {
  const configured = process.env.FRONTEND_URL?.replace(/\/$/, '');
  if (configured) {
    return configured;
  }
  return new URL(request.url).origin;
}

function getGoogleCallbackUrl(request: Request): string {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  }
  return `${getBaseUrl(request)}/api/auth/google/callback`;
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const frontendURL = getBaseUrl(request);

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_failed`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_error`);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleCallbackUrl(request),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Google OAuth token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_error`);
    }

    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoRes.ok) {
      console.error('Google OAuth userinfo failed:', await userInfoRes.text());
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_error`);
    }

    const profile: any = await userInfoRes.json();

    await connectDB();

    let user: any = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.findOne({ email: profile.email });
      if (user) {
        user.googleId = profile.id;
        user.isOAuthUser = true;
        if (profile.picture) {
          user.avatar = profile.picture;
        }
        await user.save();
      } else {
        user = await User.create({
          username: profile.name || (profile.email ? profile.email.split('@')[0] : 'user'),
          email: profile.email,
          googleId: profile.id,
          avatar: profile.picture || null,
          isOAuthUser: true,
        });
      }
    }

    const jwtToken = generateToken(String(user._id));

    const res = NextResponse.redirect(frontendURL);

    res.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    res.cookies.set('token_client', 'authenticated', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${frontendURL}/login?error=oauth_failed`);
  }
}
