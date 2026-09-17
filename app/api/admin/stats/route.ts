import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getSystemStats, getUsersAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const allUsers = await getUsersAsync();
    const stats = getSystemStats();

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u) => u.status === 'active').length;
    const adminCount = allUsers.filter((u) => u.role === 'admin').length;

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
