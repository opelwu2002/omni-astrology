import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getSystemStats } from '@/lib/db';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const stats = getSystemStats();
    let totalUsers = 0;
    let activeUsers = 0;
    let adminCount = 0;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, role, status');

        if (!error && Array.isArray(data)) {
          totalUsers = data.length;
          activeUsers = data.filter((u) => u.status === 'active').length;
          adminCount = data.filter((u) => u.role === 'admin').length;
        }
      } catch (err: any) {
        console.warn('[admin/stats] 讀取 Supabase 用戶統計失敗:', err?.message);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        totalUsers,
        activeUsers,
        adminCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取數據失敗' },
      { status: 500 }
    );
  }
}
