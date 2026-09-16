import { NextResponse } from 'next/server';

/**
 * 產生 Google OAuth 授權登入跳轉 URL
 * 支援正式 Google OAuth 2.0 授權，並在未配置憑證時提供沙盒模擬授權通道
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (clientId) {
    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    return NextResponse.json({
      success: true,
      url: authUrl,
      mode: 'production',
    });
  }

  // 測試/展示沙盒模式（無需等待 Google Cloud 專案審核即可無縫體驗）
  const sandboxUrl = `${redirectUri}?sandbox=true&mock_email=google.user@vip-omni.com&mock_name=Google命主體驗用戶`;
  return NextResponse.json({
    success: true,
    url: sandboxUrl,
    mode: 'sandbox',
    notice: '當前處於 Google 快速授權體驗模式',
  });
}
