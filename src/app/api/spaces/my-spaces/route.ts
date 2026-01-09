import Space from '@/server/models/Space';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const authUser = await requireUser(request);

    const spaces = await Space.find({ owner: authUser.id }).sort('-createdAt');

    return json(request, {
      success: true,
      count: spaces.length,
      spaces,
    });
  } catch (error) {
    console.error('Get spaces error:', error);
    return errorJson(request, 500, 'Failed to fetch spaces');
  }
}
