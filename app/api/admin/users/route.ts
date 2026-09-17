import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { addAuditLog } from '@/lib/db';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '@/lib/usersStorage';

// 取得所有會員清單 (100% 直通全站單一資料存取核心 lib/usersStorage.ts)
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const users = await getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('[admin/users] 取得會員清單失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '讀取會員清單失敗' },
      { status: 500 }
    );
  }
}

// 管理員直接新增會員 (強制真實寫入單一資料核心)
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
    const {
      email,
      password,
      name,
      role,
      status,
      unlockedTiers,
      phone,
      company,
      taxId,
      industry,
      address,
    } = body;

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

    const cleanEmail = email.trim().toLowerCase();

    const createdUser = await createUser({
      email: cleanEmail,
      password,
      name: name?.trim() || cleanEmail.split('@')[0],
      role: role || 'user',
      status: status || 'active',
      unlockedTiers: unlockedTiers || ['free'],
      phone: phone?.trim() || undefined,
      company: company?.trim() || undefined,
      taxId: taxId?.trim() || undefined,
      industry: industry?.trim() || undefined,
      address: address?.trim() || undefined,
    });

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'user_create',
      targetId: createdUser.id,
      targetType: 'user',
      details: `管理員手動新增會員：${createdUser.name} (${cleanEmail})，身分：${role || 'user'}`,
    });

    return NextResponse.json({
      success: true,
      user: createdUser,
      message: '新會員已成功建立並真實寫入資料庫！',
    });
  } catch (error: any) {
    console.error('[admin/users] 新增會員失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '新增會員失敗' },
      { status: 500 }
    );
  }
}

// 修改會員資料與解鎖權限等級 (強制真實 commit 至儲存核心)
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
    const targetUserId = body.targetUserId || body.id;
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
        { success: false, error: '缺少目標會員 ID' },
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
      message: '會員資料與權限已成功儲存至雲端資料庫！',
    });
  } catch (error: any) {
    console.error('[admin/users] 更新會員失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '更新會員失敗' },
      { status: 500 }
    );
  }
}

// 支援 PUT 方法映射至 PATCH
export const PUT = PATCH;

// 刪除會員 (100% 直連單一核心刪除)
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
    if (
      targetUserId === user.id ||
      targetUserId === 'admin-master-001' ||
      targetUserId.toLowerCase() === 'opelwu2002@gmail.com'
    ) {
      return NextResponse.json(
        { success: false, error: '無法刪除當前登入或系統最高管理員帳號' },
        { status: 400 }
      );
    }

    const updatedUsers = await deleteUser(targetUserId);

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'user_suspend',
      targetId: targetUserId,
      targetType: 'user',
      details: `永久自資料庫刪除會員 ID/Email: ${targetUserId}`,
    });

    return NextResponse.json({
      success: true,
      message: '會員已成功自雲端資料庫永久刪除！',
      users: updatedUsers,
    });
  } catch (error: any) {
    console.error('[admin/users] 刪除失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '刪除失敗' },
      { status: 500 }
    );
  }
}
