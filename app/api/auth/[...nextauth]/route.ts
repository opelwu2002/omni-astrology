import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import LineProvider from 'next-auth/providers/line';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyUserCredentials, upsertOAuthAuthUser } from '@/lib/auth-users';

function getAuthProviders(): any[] {
  const providers: any[] = [];

  // 1. Google OAuth 2.0 (僅在已配置真實 Client ID 時掛載，絕不向 Google 發送假值)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (
    googleClientId &&
    googleClientSecret &&
    !googleClientId.includes('missing_') &&
    !googleClientId.includes('your-google') &&
    googleClientId.length > 10
  ) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      })
    );
  }

  // 2. GitHub OAuth
  const githubId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
  const githubSecret =
    process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;
  if (
    githubId &&
    githubSecret &&
    !githubId.includes('missing_') &&
    !githubId.includes('your-github')
  ) {
    providers.push(
      GithubProvider({
        clientId: githubId,
        clientSecret: githubSecret,
      })
    );
  }

  // 3. LINE Login (台灣在地普及第三方登入)
  const lineId = process.env.LINE_CLIENT_ID;
  const lineSecret = process.env.LINE_CLIENT_SECRET;
  if (
    lineId &&
    lineSecret &&
    !lineId.includes('missing_') &&
    !lineId.includes('your-line')
  ) {
    providers.push(
      LineProvider({
        clientId: lineId,
        clientSecret: lineSecret,
      })
    );
  }

  // 4. 傳統帳號/密碼憑證登入 (Credentials，永遠啟用並相容舊會員與管理員)
  providers.push(
    CredentialsProvider({
      name: 'OmniCredentials',
      credentials: {
        email: { label: '帳號或電子郵件', type: 'text' },
        password: { label: '密碼', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('請輸入帳號與密碼');
        }

        const inputUser = credentials.email.trim();
        const inputPass = credentials.password.trim();

        // 透過 auth-users 安全存取層驗證（含管理員放行、舊會員相容、0 磁碟寫入）
        const result = await verifyUserCredentials(inputUser, inputPass);
        if (!result.success || !result.user) {
          throw new Error(result.error || '帳號或密碼錯誤');
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        };
      },
    })
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: getAuthProviders(),

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 天
  },

  callbacks: {
    // 當使用者透過第三方 OAuth 或憑證登入時觸發
    async signIn({ user, account }) {
      if (account && account.provider !== 'credentials' && user.email) {
        try {
          // 自動同步至雲端資料庫並維護會員資格 (記憶體 + Supabase，0 本機磁碟寫入)
          await upsertOAuthAuthUser({
            email: user.email,
            name: user.name || undefined,
            provider: account.provider as any,
            providerId: account.providerAccountId,
          });
        } catch (err) {
          console.warn('[NextAuth signIn callback warning]:', err);
        }
      }
      return true;
    },

    // JWT 權杖簽署回調
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';
      }
      return token;
    },

    // Session 獲取回調
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
    error: '/',
  },

  secret: process.env.NEXTAUTH_SECRET || 'omni-astrology-nextauth-super-secret-2026',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
