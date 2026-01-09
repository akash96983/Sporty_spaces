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
    const { username, email } = await request.json();

    if (!username && !email) {
      return errorJson(request, 400, 'Please provide at least one field to update');
    }

    if (username || email) {
      const query: any = { _id: { $ne: authUser.id } };
      if (username && email) {
        query.$or = [{ username }, { email }];
      } else if (username) {
        query.username = username;
      } else if (email) {
        query.email = email;
      }

      const existingUser: any = await User.findOne(query);
      if (existingUser) {
        if (existingUser.username === username) {
          return errorJson(request, 400, 'Username already exists');
        }
        if (existingUser.email === email) {
          return errorJson(request, 400, 'Email already exists');
        }
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user: any = await User.findByIdAndUpdate(authUser.id, updateData, {
      new: true,
      runValidators: true,
    });

    return json(request, {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return errorJson(request, 500, 'Server error during profile update');
  }
}
