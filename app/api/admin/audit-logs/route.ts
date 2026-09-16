import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getAuditLogs } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '無管理員權限' },
        { status: 403 }
      );
    }

    const logs = getAuditLogs();
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取稽核日誌失敗' },
      { status: 500 }
    );
  }
}
