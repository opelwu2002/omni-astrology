import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { addAuditLog } from '@/lib/db';
import {
  findAuthUserByEmail,
  toSafeAuthUser,
  updateAuthUserTiers,
  updateAuthUserData,
} from '@/lib/auth-users';
import { fetchUsersFromGithub, commitUsersToGithub } from '@/lib/github-db';
import bcrypt from 'bcryptjs';

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

    // 1. 取得全體會員名單 (強制刷新快取)
    const { users: rawUsers } = await fetchUsersFromGithub(true);
    const target = String(targetUserId).trim().toLowerCase();

    let foundUser: any = null;
    const updatedUsers = rawUsers.map((u) => {
      if (
        u.id === targetUserId ||
        (u.id && String(u.id).toLowerCase() === target) ||
        (u.email && String(u.email).toLowerCase() === target)
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
        if (password && String(password).trim().length >= 6) {
          foundUser.passwordHash = bcrypt.hashSync(String(password).trim(), 10);
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
    updateAuthUserData(targetUserId, {
      name: foundUser.name,
      role: foundUser.role,
      status: foundUser.status,
      phone: foundUser.phone,
      company: foundUser.company,
      taxId: foundUser.taxId,
      industry: foundUser.industry,
      address: foundUser.address,
      unlockedTiers: foundUser.unlockedTiers,
      passwordHash: foundUser.passwordHash,
    });

    const safeUser = toSafeAuthUser(foundUser);

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
      details: `更新會員 ${safeUser.email} 資料：${detailParts.join('、') || '無變更'}`,
    });

    return NextResponse.json({
      success: true,
      user: safeUser,
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
