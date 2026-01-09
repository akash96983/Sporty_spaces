import cloudinary from '@/server/cloudinary';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request, context: { params: Promise<{ publicId: string }> }) {
  try {
    await requireUser(request);

    const { publicId } = await context.params;

    const decodedPublicId = publicId.replace(/--/g, '/');
    await cloudinary.uploader.destroy(decodedPublicId);

    return json(request, {
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return errorJson(request, 500, 'Image deletion failed');
  }
}
