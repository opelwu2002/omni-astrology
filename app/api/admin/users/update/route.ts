import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { addAuditLog } from '@/lib/db';
import { updateUser } from '@/lib/usersStorage';

// 處理會員資料更新 (PUT /api/admin/users/update)
export async function PUT(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const targetUserId = body.targetUserId || body.id || body.userId;
    const {
      name,
      role,
      status,
      password,
      unlockedTiers,
      phone,
      company,
      taxId,
      industry,
      address,
    } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: '缺少目標會員 ID 或電子郵件' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(targetUserId, {
      name,
      role,
      status,
      password,
      unlockedTiers,
      phone,
      company,
      taxId,
      industry,
      address,
    });

    // 紀錄操作日誌
    const detailParts: string[] = [];
    if (name) detailParts.push(`姓名更新為「${name}」`);
    if (role) detailParts.push(`角色變更為「${role}」`);
    if (status) detailParts.push(`狀態設為「${status}」`);
    if (password) detailParts.push('管理員直接重設登入密碼');
    if (unlockedTiers) detailParts.push(`解鎖權限調整為 [${unlockedTiers.join(', ')}]`);

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: password ? 'password_reset' : 'user_update',
      targetId: targetUserId,
      targetType: 'user',
      details: `更新會員 ${updatedUser.email} 資料：${detailParts.join('、') || '無變更'}`,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: '會員資料與權限已成功儲存至雲端資料庫！',
    });
  } catch (error: any) {
    console.error('[admin/users/update] 更新會員失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '更新會員失敗' },
      { status: 500 }
    );
  }
}

// 支援 POST 方法作為容錯相容
export async function POST(request: Request) {
  return PUT(request);
}
