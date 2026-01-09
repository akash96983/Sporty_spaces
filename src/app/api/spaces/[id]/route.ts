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

export async function GET(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const space = await Space.findById(id).populate('owner', 'username email');

    if (!space) {
      return errorJson(request, 404, 'Space not found');
    }

    return json(request, { success: true, space });
  } catch {
    return errorJson(request, 500, 'Failed to fetch space');
  }
}

export async function PUT(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { id } = await context.params;
    let space: any = await Space.findById(id);

    if (!space) {
      return errorJson(request, 404, 'Space not found');
    }

    if (space.owner.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to update this space');
    }

    const body = await request.json();

    space = await Space.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    return json(request, {
      success: true,
      message: 'Space updated successfully',
      space,
    });
  } catch {
    return errorJson(request, 500, 'Failed to update space');
  }
}

export async function DELETE(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { id } = await context.params;
    const space: any = await Space.findById(id);

    if (!space) {
      return errorJson(request, 404, 'Space not found');
    }

    if (space.owner.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to delete this space');
    }

    await space.deleteOne();

    return json(request, {
      success: true,
      message: 'Space deleted successfully',
    });
  } catch {
    return errorJson(request, 500, 'Failed to delete space');
  }
}
