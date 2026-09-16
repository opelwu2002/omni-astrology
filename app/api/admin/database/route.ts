import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getDbContent, updateDbContent } from '@/lib/db';

const ALLOWED_FILES = [
  'numerology_db.json',
  'astrology_planets_db.json',
  'bazi_db.json',
  'ziwei_stars_db.json',
];

export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無管理員權限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file || !ALLOWED_FILES.includes(file)) {
      return NextResponse.json(
        { success: false, error: '無效的資料庫檔案名稱' },
        { status: 400 }
      );
    }

    const content = getDbContent(file);
    return NextResponse.json({ success: true, file, content });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取資料庫失敗' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無管理員權限' }, { status: 403 });
    }

    const { file, content } = await request.json();

    if (!file || !ALLOWED_FILES.includes(file)) {
      return NextResponse.json(
        { success: false, error: '無效的資料庫檔案名稱' },
        { status: 400 }
      );
    }

    updateDbContent(file, content);
    return NextResponse.json({
      success: true,
      message: `資料庫檔案【${file}】已成功更新！`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '更新失敗' },
      { status: 400 }
    );
  }
}
