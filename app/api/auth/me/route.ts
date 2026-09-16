import { getCurrentUserFromRequest, createPrivateJsonResponse } from '@/lib/auth';
import { getUserProfiles } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user) {
      return createPrivateJsonResponse({ success: false, user: null }, { status: 401 });
    }

    const cloudProfiles = getUserProfiles(user.id);

    return createPrivateJsonResponse({
      success: true,
      user,
      cloudProfiles,
    });
  } catch (error: any) {
    return createPrivateJsonResponse(
      { success: false, error: error?.message || '讀取失敗' },
      { status: 500 }
    );
  }
}
