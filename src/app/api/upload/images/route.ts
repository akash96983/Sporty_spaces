import cloudinary from '@/server/cloudinary';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  try {
    await requireUser(request);

    const { images } = await request.json();

    if (!images || !Array.isArray(images)) {
      return errorJson(request, 400, 'Please provide images array');
    }

    if (images.length > 4) {
      return errorJson(request, 400, 'Maximum 4 images allowed');
    }

    const uploadPromises = images.map((image: string) =>
      cloudinary.uploader.upload(image, {
        folder: 'sportyspaces/turfs',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
        ],
      }),
    );

    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map((result: any) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    return json(request, {
      success: true,
      images: uploadedImages,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return errorJson(request, 500, 'Images upload failed');
  }
}
