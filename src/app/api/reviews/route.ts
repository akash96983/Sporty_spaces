import Review from '@/server/models/Review';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

// POST /api/reviews
export async function POST(request: Request) {
  try {
    const authUser = await requireUser(request);

    const { spaceId, rating, comment } = await request.json();

    if (!spaceId || !rating || !comment) {
      return errorJson(request, 400, 'Please provide all required fields');
    }

    const existingReview = await Review.findOne({
      space: spaceId,
      user: authUser.id,
    });

    if (existingReview) {
      return errorJson(request, 400, 'You have already reviewed this space');
    }

    const review: any = await Review.create({
      space: spaceId,
      user: authUser.id,
      rating,
      comment,
    });

    await review.populate('user', 'username');

    return json(
      request,
      {
        success: true,
        message: 'Review created successfully',
        review,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create review error:', error);
    return errorJson(request, 500, 'Server error during review creation');
  }
}
