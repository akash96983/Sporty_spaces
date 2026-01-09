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

    return json(request, {
      success: true,
      user: {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
      },
    });
  } catch (error: any) {
    if (error?.status) {
      return errorJson(request, error.status, error.message);
    }
    return errorJson(request, 500, 'Server error');
  }
}
