import { NextResponse } from 'next/server';
import { upsertOAuthAuthUser } from '@/lib/auth-users';
import { signToken } from '@/lib/auth';

/**
 * Google OAuth 回調處理端點
 * 支援正式 Google OAuth Token 換發與沙盒模式，自動建立/登入會員並簽發 JWT
 */
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const code = requestUrl.searchParams.get('code');
    const isSandbox = requestUrl.searchParams.get('sandbox') === 'true';

    let email = '';
    let name = '';

    if (isSandbox) {
      email = requestUrl.searchParams.get('mock_email') || 'google.user@vip-omni.com';
      name = requestUrl.searchParams.get('mock_name') || 'Google命盤會員';
    } else if (code) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${origin}/api/auth/google/callback`;

      if (!clientId || !clientSecret) {
        throw new Error('伺服器尚未配置 Google OAuth 憑證');
      }

      // 1. 向 Google 換取 Token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || '換取 Google 授權憑證失敗');
      }

      // 2. 獲取使用者 Google 個人資料
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();
      email = userData.email;
      name = userData.name || email.split('@')[0];
    } else {
      return NextResponse.redirect(`${origin}/?auth_error=授權已取消或無效碼`);
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/?auth_error=無法取得 Google 電子郵件`);
    }

    // 3. 透過安全存取層取得或建立第三方會員 (記憶體 + Supabase，0 磁碟寫入)
    const safeUser = await upsertOAuthAuthUser({
      email,
      name,
      provider: 'google',
    });

    // 4. 簽發系統 JWT
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    // 5. 輸出中轉 HTML，將 Token 寫入 localStorage 並轉回首頁
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Google 登入驗證成功</title>
          <style>
            body {
              background-color: #0b0f19;
              color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(168, 85, 247, 0.2);
              border-top-color: #a855f7;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-bottom: 16px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>Google 帳號授權成功！</h2>
          <p>正在為您同步命盤雲端檔案與會員權益，請稍候...</p>
          <script>
            try {
              localStorage.setItem('auth_token', ${JSON.stringify(token)});
            } catch(e) {
              console.error(e);
            }
            window.location.replace('/?login_success=google');
          </script>
        </body>
      </html>
    `;

    const response = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

    // 寫入 Cookie 便於 SSR 解析
    response.cookies.set('auth_token', token, {
      path: '/',
      maxAge: 7 * 86400,
      httpOnly: false, // 允許前端讀取
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Google OAuth 回調失敗:', err);
    return NextResponse.redirect(
      `${new URL(request.url).origin}/?auth_error=${encodeURIComponent(
        err?.message || 'Google 登入授權失敗'
      )}`
    );
  }
}
