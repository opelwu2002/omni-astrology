import { NextResponse } from 'next/server';

/**
 * 檢查目前環境變數中各第三方 OAuth Provider 是否已完成金鑰配置
 * 避免前端將使用者導向未配置的 OAuth 授權端點引發 401 invalid_client 錯誤
 */
export async function GET() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  const isGoogleConfigured = Boolean(
    googleClientId &&
      !googleClientId.includes('missing_') &&
      !googleClientId.includes('your-google') &&
      googleClientId.length > 10
  );

  const lineClientId = process.env.LINE_CLIENT_ID || '';
  const isLineConfigured = Boolean(
    lineClientId &&
      !lineClientId.includes('missing_') &&
      !lineClientId.includes('your-line') &&
      lineClientId.length > 5
  );

  const githubClientId =
    process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID || '';
  const isGithubConfigured = Boolean(
    githubClientId &&
      !githubClientId.includes('missing_') &&
      !githubClientId.includes('your-github') &&
      githubClientId.length > 5
  );

  return NextResponse.json(
    {
      success: true,
      providers: {
        google: isGoogleConfigured,
        line: isLineConfigured,
        github: isGithubConfigured,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
