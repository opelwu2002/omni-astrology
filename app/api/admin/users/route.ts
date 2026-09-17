import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { addAuditLog } from '@/lib/db';
import {
  getAllAuthUsersAsync,
  createAuthUser,
  deleteAuthUserAsync,
  updateAuthUserTiers,
  findAuthUserByEmail,
  toSafeAuthUser,
} from '@/lib/auth-users';
import { commitUsersToGithub, fetchUsersFromGithub } from '@/lib/github-db';
import bcrypt from 'bcryptjs';

// 取得所有會員清單 (直通 GitHub 雲端儲存庫與認證存取層，單一事實來源)
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const cloudUsers = await getAllAuthUsersAsync();
    return NextResponse.json({ success: true, users: cloudUsers });
  } catch (error: any) {
    console.error('[admin/users] 取得會員清單失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '讀取會員清單失敗' },
      { status: 500 }
    );
  }
}

// 管理員直接新增會員 (強制真實寫入 GitHub 雲端資料庫)
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

    // 呼叫認證層建立會員（直通 GitHub 倉庫提交）
    const createdUser = await createAuthUser({
      email: cleanEmail,
      password,
      name: name?.trim() || cleanEmail.split('@')[0],
      phone: phone?.trim() || undefined,
      company: company?.trim() || undefined,
      taxId: taxId?.trim() || undefined,
      industry: industry?.trim() || undefined,
      address: address?.trim() || undefined,
    });

    // 若管理員有特別指定角色或解鎖方案
    if (role || status || unlockedTiers) {
      const targetUser = await findAuthUserByEmail(cleanEmail);
      if (targetUser) {
        if (role) targetUser.role = role;
        if (status) targetUser.status = status;
        if (unlockedTiers) targetUser.unlockedTiers = unlockedTiers;

        const allUsers = await getAllAuthUsersAsync();
        await commitUsersToGithub(
          allUsers,
          `chore(users): 管理員自訂新會員角色與權限 (${cleanEmail}) [skip ci]`
        );
      }
    }

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
      message: '新會員已成功建立並真實寫入 GitHub 雲端資料庫！',
    });
  } catch (error: any) {
    console.error('[admin/users] 新增會員失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '新增會員失敗' },
      { status: 500 }
    );
  }
}

// 修改會員資料與解鎖權限等級 (強制真實 commit 至 GitHub 雲端資料庫)
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
    const {
      targetUserId,
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

    // 1. 取得全體會員名單
    const { users: rawUsers } = await fetchUsersFromGithub(true);
    const target = targetUserId.trim().toLowerCase();

    let foundUser: any = null;
    const updatedUsers = rawUsers.map((u) => {
      if (
        u.id === targetUserId ||
        (u.id && u.id.toLowerCase() === target) ||
        (u.email && u.email.toLowerCase() === target)
      ) {
        foundUser = { ...u };
        if (name !== undefined) foundUser.name = name;
        if (role !== undefined) foundUser.role = role;
        if (status !== undefined) foundUser.status = status;
        if (phone !== undefined) foundUser.phone = phone;
        if (company !== undefined) foundUser.company = company;
        if (taxId !== undefined) foundUser.taxId = taxId;
        if (industry !== undefined) foundUser.industry = industry;
        if (address !== undefined) foundUser.address = address;
        if (unlockedTiers !== undefined) foundUser.unlockedTiers = unlockedTiers;
        if (password && password.trim().length >= 6) {
          foundUser.passwordHash = bcrypt.hashSync(password.trim(), 10);
        }
        return foundUser;
      }
      return u;
    });

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: '找不到指定目標會員' },
        { status: 404 }
      );
    }

    // 2. 提交更新至 GitHub 倉庫
    const commitRes = await commitUsersToGithub(
      updatedUsers,
      `chore(users): 管理員更新會員 ${foundUser.email} 資料與權限 [skip ci]`
    );

    if (!commitRes.success) {
      return NextResponse.json(
        { success: false, error: `GitHub 雲端儲存庫更新失敗：${commitRes.error}` },
        { status: 500 }
      );
    }

    // 3. 同步記憶體快取
    if (unlockedTiers) {
      updateAuthUserTiers(targetUserId, unlockedTiers);
    }

    const safeUser = toSafeAuthUser(foundUser);

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
      details: `更新會員 ${safeUser.email} 資料：${detailParts.join('、') || '無變更'}`,
    });

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: '會員資料與權限已成功儲存至 GitHub 雲端資料庫！',
    });
  } catch (error: any) {
    console.error('[admin/users] 更新會員失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '更新會員失敗' },
      { status: 500 }
    );
  }
}

// 刪除會員 (實體 data/users.json + GitHub 倉庫 commit 刪除)
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

    // 1. 執行刪除（同步 commit 至 GitHub 倉庫並更新記憶體）
    await deleteAuthUserAsync(targetUserId);

    // 2. 重新自 GitHub / 記憶體撈取最新名單回傳給前端
    const updatedUsers = await getAllAuthUsersAsync();

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'user_suspend',
      targetId: targetUserId,
      targetType: 'user',
      details: `永久自 GitHub 雲端資料庫刪除會員 ID/Email: ${targetUserId}`,
    });

    return NextResponse.json({
      success: true,
      message: '會員已成功自 GitHub 雲端資料庫永久刪除！',
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
