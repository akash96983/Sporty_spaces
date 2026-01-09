import { NextResponse } from 'next/server';
import { connectDB } from '@/server/db';
import User from '@/server/models/User';
import { generateToken } from '@/server/auth';
import { corsPreflight } from '@/server/cors';

export const runtime = 'nodejs';

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

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
  const frontendURL = getFrontendUrl();

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_failed`);
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_error`);
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: getGitHubCallbackUrl(),
      }),
    });

    if (!tokenRes.ok) {
      console.error('GitHub token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_error`);
    }

    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!profileRes.ok) {
      console.error('GitHub profile fetch failed:', await profileRes.text());
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_error`);
    }

    const profile: any = await profileRes.json();

    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    let email: string | null = null;
    if (emailsRes.ok) {
      const emails: any[] = await emailsRes.json();
      const primary = emails.find((e) => e.primary) || emails[0];
      email = primary?.email ?? null;
    }

    if (!email) {
      console.error('No email found from GitHub');
      return NextResponse.redirect(`${frontendURL}/login?error=oauth_error`);
    }

    await connectDB();

    let user: any = await User.findOne({ githubId: String(profile.id) });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.githubId = String(profile.id);
        user.isOAuthUser = true;
        if (profile.avatar_url) {
          user.avatar = profile.avatar_url;
        }
        await user.save();
      } else {
        user = await User.create({
          username: profile.login || profile.name || email.split('@')[0],
          email,
          githubId: String(profile.id),
          avatar: profile.avatar_url || null,
          isOAuthUser: true,
        });
      }
    }

    const jwtToken = generateToken(String(user._id));

    const res = NextResponse.redirect(frontendURL);

    res.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    res.cookies.set('token_client', 'authenticated', {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(`${frontendURL}/login?error=oauth_failed`);
  }
}
