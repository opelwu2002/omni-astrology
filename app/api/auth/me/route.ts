import { getCurrentUserFromRequest, createPrivateJsonResponse } from '@/lib/auth';
import { getUserProfiles, findUserById, findUserByEmail, toSafeUser } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user) {
      return createPrivateJsonResponse({ success: false, user: null }, { status: 401 });
    }

    // 重新從資料庫取得最即時之會員資料（包含管理後台動態更新的 unlockedTiers）
    const dbUser = findUserById(user.id) || findUserByEmail(user.email);
    const freshUser = dbUser ? toSafeUser(dbUser) : user;

    // 若身分為管理員，強制保證全套權限開通
    if (freshUser.role === 'admin') {
      freshUser.unlockedTiers = ['free', 'level2', 'level3', 'synastry_addon'];
    }

    const cloudProfiles = getUserProfiles(user.id);

    return createPrivateJsonResponse({
      success: true,
      user: freshUser,
      cloudProfiles,
    });
  } catch (error: any) {
    return createPrivateJsonResponse(
      { success: false, error: error?.message || '讀取失敗' },
      { status: 500 }
    );
  }
}
