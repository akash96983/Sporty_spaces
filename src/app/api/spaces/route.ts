import { connectDB } from '@/server/db';
import Space from '@/server/models/Space';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

// GET /api/spaces
export async function GET(request: Request) {
  try {
    await connectDB();

    const spaces = await Space.find({ isActive: true })
      .populate('owner', 'username email')
      .sort('-createdAt');

    return json(request, {
      success: true,
      count: spaces.length,
      spaces,
    });
  } catch {
    return errorJson(request, 500, 'Failed to fetch spaces');
  }
}

// POST /api/spaces
export async function POST(request: Request) {
  try {
    const authUser = await requireUser(request);

    const body = await request.json();

    const spaceData = {
      ...body,
      owner: authUser.id,
    };

    const space = await Space.create(spaceData);

    return json(
      request,
      {
        success: true,
        message: 'Space created successfully',
        space,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Create space error:', error);
    return errorJson(request, 500, error?.message || 'Failed to create space');
  }
}
