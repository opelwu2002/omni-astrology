import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getUsers,
  getUsersAsync,
  readUsersFromDisk,
  toSafeUser,
  adminCreateUser,
  adminUpdateUser,
  deleteUser,
  deleteUserAsync,
  addAuditLog,
} from '@/lib/db';
import { deleteAuthUser, deleteAuthUserAsync, updateAuthUserTiers } from '@/lib/auth-users';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';
import bcrypt from 'bcryptjs';

// 取得所有會員清單 (優先 100% 直通真實雲端 Supabase 資料庫)
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[admin/users] 雲端查詢會員失敗:', error);
        return NextResponse.json(
          { success: false, error: `雲端資料庫讀取異常：${error.message}` },
          { status: 500 }
        );
      }

      if (Array.isArray(data)) {
        // 檢測並自動抹除歷史幽靈測試帳號
        const ghostRows = data.filter((row) => {
          const clean = (row.email || '').toLowerCase();
          const cleanName = row.name || '';
          return (
            clean === 'admin@omni-astrology.com' ||
            clean.includes('huang.kl') ||
            clean.includes('omni-enterprise.tw') ||
            cleanName.includes('黃光隆') ||
            cleanName.includes('大隆精密')
          );
        });

        if (ghostRows.length > 0) {
          const ghostIds = ghostRows.map((r) => r.id);
          try {
            await supabase.from('users').delete().in('id', ghostIds);
            console.log('[admin/users] 背景抹除雲端幽靈帳號:', ghostIds);
          } catch {}
        }

        const cloudUsers = data
          .filter((row) => {
            const clean = (row.email || '').toLowerCase();
            const cleanName = row.name || '';
            if (clean === 'admin@omni-astrology.com') return false;
            if (
              clean.includes('huang.kl') ||
              clean.includes('omni-enterprise.tw') ||
              cleanName.includes('黃光隆') ||
              cleanName.includes('大隆精密')
            ) {
              return false;
            }
            return true;
          })
          .map((row) => {
            const isMaster = (row.email || '').toLowerCase() === 'opelwu2002@gmail.com';
            return {
              id: row.id,
              email: (row.email || '').toLowerCase(),
              name: isMaster ? '吳俊彥' : row.name || row.email?.split('@')[0],
              role: isMaster ? 'admin' : row.role === 'admin' ? 'admin' : 'user',
              status: row.status === 'suspended' ? 'suspended' : 'active',
              phone: row.phone || undefined,
              company: row.company || undefined,
              taxId: row.tax_id || undefined,
              industry: row.industry || undefined,
              address: row.address || undefined,
              unlockedTiers: isMaster
                ? ['free', 'level2', 'level3', 'synastry_addon']
                : Array.isArray(row.unlocked_tiers)
                ? row.unlocked_tiers
                : ['free'],
              createdAt: Number(row.created_at) || Date.now(),
              lastLoginAt: row.last_login_at ? Number(row.last_login_at) : undefined,
            };
          });

        // 確保系統最高管理員始終存在
        if (!cloudUsers.some((u) => u.email === 'opelwu2002@gmail.com')) {
          cloudUsers.unshift({
            id: 'admin-master-001',
            email: 'opelwu2002@gmail.com',
            name: '吳俊彥',
            role: 'admin',
            status: 'active',
            phone: undefined,
            company: undefined,
            taxId: undefined,
            industry: undefined,
            address: undefined,
            unlockedTiers: ['free', 'level2', 'level3', 'synastry_addon'],
            createdAt: 1786868793061,
            lastLoginAt: Date.now(),
          });
        }

        return NextResponse.json({ success: true, users: cloudUsers });
      }
    }

    // 本地離線降級 (僅在未配置 Supabase 時純讀取)
    const allUsers = (await getUsersAsync()).map(toSafeUser);
    return NextResponse.json({ success: true, users: allUsers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取會員清單失敗' },
      { status: 500 }
    );
  }
}

// 管理員直接新增會員 (強制真實寫入雲端資料庫)
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
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 1. 強制對雲端資料庫真實 await 執行 SQL INSERT
      const { error: dbError } = await supabase.from('users').insert({
        id: newUserId,
        email: cleanEmail,
        password_hash: passwordHash,
        name: name?.trim() || cleanEmail.split('@')[0],
        role: role || 'user',
        status: status || 'active',
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        tax_id: taxId?.trim() || null,
        industry: industry?.trim() || null,
        address: address?.trim() || null,
        unlocked_tiers: unlockedTiers || ['free'],
        provider: 'credentials',
        created_at: Date.now(),
        last_login_at: Date.now(),
      });

      if (dbError) {
        console.error('[admin/users] 雲端新增會員失敗:', dbError);
        return NextResponse.json(
          { success: false, error: `雲端資料庫新增失敗：${dbError.message}` },
          { status: 500 }
        );
      }

      const createdUser = {
        id: newUserId,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        role: role || 'user',
        status: status || 'active',
        phone: phone?.trim(),
        company: company?.trim(),
        taxId: taxId?.trim(),
        industry: industry?.trim(),
        address: address?.trim(),
        unlockedTiers: unlockedTiers || ['free'],
        createdAt: Date.now(),
      };

      addAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'user_create',
        targetId: newUserId,
        targetType: 'user',
        details: `管理員手動新增雲端會員：${createdUser.name} (${cleanEmail})，身分：${createdUser.role}`,
      });

      return NextResponse.json({
        success: true,
        user: createdUser,
        message: '新會員已成功建立並真實寫入雲端資料庫！',
      });
    }

    // 本地離線降級 (僅當未配置 Supabase 時)
    const newUser = adminCreateUser({
      email: cleanEmail,
      password,
      name: name?.trim() || cleanEmail.split('@')[0],
      phone: phone?.trim(),
      company: company?.trim(),
      taxId: taxId?.trim(),
      industry: industry?.trim(),
      address: address?.trim(),
      role: role || 'user',
      status: status || 'active',
      unlockedTiers: unlockedTiers || ['free'],
    });

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
      message: '新會員已成功建立！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '新增會員失敗' },
      { status: 400 }
    );
  }
}

// 修改會員資料與解鎖權限等級 (強制真實 await UPDATE 雲端資料庫)
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

    // 1. 若配置了雲端 Supabase 資料庫，必須真實 await 執行 SQL UPDATE！
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const updatePayload: any = {};
      if (name !== undefined) updatePayload.name = name;
      if (role !== undefined) updatePayload.role = role;
      if (status !== undefined) updatePayload.status = status;
      if (phone !== undefined) updatePayload.phone = phone;
      if (company !== undefined) updatePayload.company = company;
      if (taxId !== undefined) updatePayload.tax_id = taxId;
      if (industry !== undefined) updatePayload.industry = industry;
      if (address !== undefined) updatePayload.address = address;
      if (unlockedTiers !== undefined) updatePayload.unlocked_tiers = unlockedTiers;
      if (password && password.trim().length >= 6) {
        updatePayload.password_hash = bcrypt.hashSync(password.trim(), 10);
      }

      const { data: updatedRows, error: dbError } = await supabase
        .from('users')
        .update(updatePayload)
        .or(`id.eq.${targetUserId},email.eq.${targetUserId.toLowerCase()}`)
        .select();

      if (dbError) {
        console.error('[admin/users] Supabase UPDATE 失敗:', dbError);
        return NextResponse.json(
          { success: false, error: `雲端資料庫更新失敗：${dbError.message}` },
          { status: 500 }
        );
      }

      // 即時同步至認證層快取
      if (unlockedTiers) {
        updateAuthUserTiers(targetUserId, unlockedTiers);
      }

      const updatedRow = Array.isArray(updatedRows) && updatedRows.length > 0 ? updatedRows[0] : null;
      const safeUser = updatedRow
        ? {
            id: updatedRow.id,
            email: updatedRow.email,
            name: updatedRow.name,
            role: updatedRow.role,
            status: updatedRow.status,
            phone: updatedRow.phone || undefined,
            company: updatedRow.company || undefined,
            taxId: updatedRow.tax_id || undefined,
            industry: updatedRow.industry || undefined,
            address: updatedRow.address || undefined,
            unlockedTiers: Array.isArray(updatedRow.unlocked_tiers) ? updatedRow.unlocked_tiers : ['free'],
            createdAt: Number(updatedRow.created_at) || Date.now(),
            lastLoginAt: updatedRow.last_login_at ? Number(updatedRow.last_login_at) : undefined,
          }
        : {
            id: targetUserId,
            email: targetUserId,
            name: name || '會員',
            role: role || 'user',
            status: status || 'active',
            unlockedTiers: unlockedTiers || ['free'],
          };

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
        message: '會員資料與權限已成功儲存至雲端資料庫！',
      });
    }

    // 2. 本地離線降級 (僅當未配置 Supabase 時)
    const updatedUser = adminUpdateUser(targetUserId, {
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

    if (unlockedTiers) {
      updateAuthUserTiers(targetUserId, unlockedTiers);
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: '會員資料已儲存！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '更新會員失敗' },
      { status: 500 }
    );
  }
}

// 刪除會員 (實體 data/users.json 物理覆寫 + 雲端同步刪除)
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

    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 1. 強制對雲端資料庫真實 await 執行 SQL DELETE
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .or(`id.eq.${targetUserId},email.eq.${targetUserId.toLowerCase()}`);

      if (dbError) {
        console.error('[admin/users] 雲端刪除會員失敗:', dbError);
        return NextResponse.json(
          { success: false, error: `雲端資料庫刪除失敗：${dbError.message}` },
          { status: 500 }
        );
      }

      // 2. 清理認證快取
      await deleteAuthUserAsync(targetUserId);

      // 3. 重新自雲端撈取最新資料庫名單，回傳給前端保證畫面 100% 同步
      const { data: latestData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      const updatedUsers = (Array.isArray(latestData) ? latestData : [])
        .filter((r) => {
          const clean = (r.email || '').toLowerCase();
          return (
            clean !== 'admin@omni-astrology.com' &&
            !clean.includes('huang.kl') &&
            !clean.includes('omni-enterprise.tw')
          );
        })
        .map((r) => ({
          id: r.id,
          email: (r.email || '').toLowerCase(),
          name: r.name || r.email?.split('@')[0],
          role: r.role || 'user',
          status: r.status || 'active',
          phone: r.phone || undefined,
          company: r.company || undefined,
          taxId: r.tax_id || undefined,
          industry: r.industry || undefined,
          address: r.address || undefined,
          unlockedTiers: Array.isArray(r.unlocked_tiers) ? r.unlocked_tiers : ['free'],
          createdAt: Number(r.created_at) || Date.now(),
          lastLoginAt: r.last_login_at ? Number(r.last_login_at) : undefined,
        }));

      addAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'user_suspend',
        targetId: targetUserId,
        targetType: 'user',
        details: `永久自雲端資料庫刪除會員 ID/Email: ${targetUserId}`,
      });

      return NextResponse.json({
        success: true,
        message: '會員已成功自雲端資料庫永久刪除！',
        users: updatedUsers,
      });
    }

    // 本地離線降級 (僅當未配置 Supabase 時)
    await deleteAuthUserAsync(targetUserId);
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
      message: '會員已成功自實體檔案與系統永久刪除！',
      users: updatedUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '刪除失敗' },
      { status: 500 }
    );
  }
}
