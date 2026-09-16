import { getCurrentUserFromRequest, createPrivateJsonResponse } from '@/lib/auth';
import { getUserProfiles, saveUserProfiles } from '@/lib/db';
import { UserProfile } from '@/types/profile';

// 取得雲端命盤 (嚴格按 userId 隔離且無快取)
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user) {
      return createPrivateJsonResponse({ success: false, error: '請先登入會員' }, { status: 401 });
    }

    const profiles = getUserProfiles(user.id);
    return createPrivateJsonResponse({ success: true, profiles });
  } catch (error: any) {
    return createPrivateJsonResponse(
      { success: false, error: error?.message || '讀取雲端命盤失敗' },
      { status: 500 }
    );
  }
}

// 儲存/同步雲端命盤
export async function POST(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user) {
      return createPrivateJsonResponse({ success: false, error: '請先登入會員' }, { status: 401 });
    }

    const { profiles } = (await request.json()) as { profiles: UserProfile[] };
    if (!Array.isArray(profiles)) {
      return createPrivateJsonResponse({ success: false, error: '資料格式不正確' }, { status: 400 });
    }

    saveUserProfiles(user.id, profiles);
    return createPrivateJsonResponse({ success: true, message: '雲端命盤同步成功！' });
  } catch (error: any) {
    return createPrivateJsonResponse(
      { success: false, error: error?.message || '同步雲端命盤失敗' },
      { status: 500 }
    );
  }
}
