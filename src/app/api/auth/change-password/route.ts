import User from '@/server/models/User';
import { requireUser } from '@/server/auth';
import { corsPreflight } from '@/server/cors';
import { errorJson, json } from '@/server/http';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function PUT(request: Request) {
  try {
    const authUser = await requireUser(request);
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return errorJson(request, 400, 'Please provide current and new password');
    }

    const user: any = await User.findById(authUser.id).select('+password');

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return errorJson(request, 401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return json(request, {
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return errorJson(request, 500, 'Server error during password change');
  }
}
