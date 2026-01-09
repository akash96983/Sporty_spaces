import jwt from 'jsonwebtoken';
import { connectDB } from './db';
import User from './models/User';

export type AuthUser = {
  id: string;
  _id: string;
  username: string;
  email: string;
};

function parseCookie(headerValue: string | null): Record<string, string> {
  if (!headerValue) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const part of headerValue.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = part.slice(0, index).trim();
    const val = part.slice(index + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer')) {
    return authHeader.split(' ')[1] || null;
  }

  const cookies = parseCookie(request.headers.get('cookie'));
  return cookies.token || null;
}

export function generateToken(id: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  const expiresIn = process.env.JWT_EXPIRE;
  if (expiresIn) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: expiresIn as any });
  }
  return jwt.sign({ id }, process.env.JWT_SECRET);
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const token = getTokenFromRequest(request);

  if (!token) {
    const err: any = new Error('Not authorized to access this route');
    err.status = 401;
    throw err;
  }

  if (!process.env.JWT_SECRET) {
    const err: any = new Error('JWT_SECRET is not set');
    err.status = 500;
    throw err;
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

    await connectDB();

    const userDoc: any = await User.findById(decoded.id).select('-password');
    if (!userDoc) {
      const err: any = new Error('User not found');
      err.status = 401;
      throw err;
    }

    userDoc.id = userDoc._id;

    return {
      id: String(userDoc._id),
      _id: String(userDoc._id),
      username: userDoc.username,
      email: userDoc.email,
    };
  } catch (error) {
    const err: any = new Error('Invalid or expired token');
    err.status = 401;
    throw err;
  }
}
