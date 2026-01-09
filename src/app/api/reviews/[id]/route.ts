import { connectDB } from '@/server/db';
import Review from '@/server/models/Review';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

type Params = { id: string };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

// GET /api/reviews/:spaceId
export async function GET(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();

    const { id: spaceId } = await context.params;

    const reviews: any[] = await Review.find({ space: spaceId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let totalRating = 0;
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((review: any) => {
      totalRating += review.rating;
      ratingCounts[review.rating]++;
    });

    const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

    return json(request, {
      success: true,
      reviews,
      stats: {
        totalReviews,
        avgRating: parseFloat(String(avgRating)),
        ratingCounts,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return errorJson(request, 500, 'Server error during reviews fetch');
  }
}

// PUT /api/reviews/:reviewId
export async function PUT(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { id: reviewId } = await context.params;
    const { rating, comment } = await request.json();

    const review: any = await Review.findById(reviewId);

    if (!review) {
      return errorJson(request, 404, 'Review not found');
    }

    if (review.user.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to update this review');
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    await review.populate('user', 'username');

    return json(request, {
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    return errorJson(request, 500, 'Server error during review update');
  }
}

// DELETE /api/reviews/:reviewId
export async function DELETE(request: Request, context: { params: Promise<Params> }) {
  try {
    await connectDB();
    const authUser = await requireUser(request);

    const { id: reviewId } = await context.params;

    const review: any = await Review.findById(reviewId);

    if (!review) {
      return errorJson(request, 404, 'Review not found');
    }

    if (review.user.toString() !== authUser.id) {
      return errorJson(request, 403, 'Not authorized to delete this review');
    }

    await Review.findByIdAndDelete(reviewId);

    return json(request, {
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return errorJson(request, 500, 'Server error during review deletion');
  }
}
