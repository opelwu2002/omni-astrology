import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getUsers,
  toSafeUser,
  adminCreateUser,
  adminUpdateUser,
  deleteUser,
  addAuditLog,
} from '@/lib/db';
import { deleteAuthUser, updateAuthUserTiers } from '@/lib/auth-users';

// 取得所有會員清單
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const allUsers = getUsers().map(toSafeUser);
    return NextResponse.json({ success: true, users: allUsers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取會員清單失敗' },
      { status: 500 }
    );
  }
}

// 管理員直接新增會員
export async function POST(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, role, status, unlockedTiers } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '請提供完整的電子郵件與密碼' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密碼長度至少需為 6 碼' },
        { status: 400 }
      );
    }

    const newUser = adminCreateUser({
      email,
      password,
      name,
      role: role || 'user',
      status: status || 'active',
      unlockedTiers: unlockedTiers || ['free'],
    });

    // 記錄稽核日誌
    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'user_create',
      targetId: newUser.id,
      targetType: 'user',
      details: `管理員手動新增會員：${newUser.name} (${newUser.email})，身分：${newUser.role}`,
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: '新會員建立成功！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '新增會員失敗' },
      { status: 400 }
    );
  }
}

// 修改會員資料（包含狀態、角色、密碼重設、解鎖方案）
export async function PATCH(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId, name, role, status, password, unlockedTiers } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: '缺少目標會員 ID' },
        { status: 400 }
      );
    }

    const updatedUser = adminUpdateUser(targetUserId, {
      name,
      role,
      status,
      password,
      unlockedTiers,
    });

    // 即時同步至認證層快取
    if (unlockedTiers) {
      updateAuthUserTiers(targetUserId, unlockedTiers);
    }

    // 判斷日誌類型
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
      message: '會員資料更新成功！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '更新會員失敗' },
      { status: 400 }
    );
  }
}

// 刪除會員
export async function DELETE(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('id');

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: '缺少會員 ID' },
        { status: 400 }
      );
    }

    // 防止管理員刪除自己或系統最高管理者
    if (targetUserId === user.id || targetUserId === 'admin-master-001') {
      return NextResponse.json(
        { success: false, error: '無法刪除當前登入或系統最高管理員帳號' },
        { status: 400 }
      );
    }

    // 同步自所有儲存庫（記憶體、檔案、雲端）徹底移除
    deleteAuthUser(targetUserId);
    const updatedUsers = deleteUser(targetUserId);

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'user_suspend',
      targetId: targetUserId,
      targetType: 'user',
      details: `永久刪除會員 ID/Email: ${targetUserId}`,
    });

    return NextResponse.json({
      success: true,
      message: '會員已成功刪除！',
      users: updatedUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '刪除失敗' },
      { status: 500 }
    );
  }
}
