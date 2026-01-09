import { connectDB } from '@/server/db';
import Space from '@/server/models/Space';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

type Params = { id: string };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { id } = await context.params;
    const space: any = await Space.findById(id);

    if (!space) {
      return errorJson(request, 404, 'Space not found');
    }

    if (space.owner.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to modify this space');
    }

    space.isActive = !space.isActive;
    await space.save();

    return json(request, {
      success: true,
      message: `Space is now ${space.isActive ? 'available' : 'unavailable'}`,
      space,
    });
  } catch {
    return errorJson(request, 500, 'Failed to toggle space availability');
  }
}
