/**
 * GitHub 倉庫雲端資料庫存取層 (lib/github-db.ts)
 * 功用：
 * 1. 直接將 GitHub 倉庫作為雲端資料庫，以 data/users.json 作為資料表
 * 2. 透過 GitHub REST API (Contents API) 實現讀取 (GET) 與提交 (PUT / commit)
 * 3. 內建 409 SHA 版本衝突自動重試機制 (最多 3 次)
 * 4. 內建幽靈測試帳號（黃光隆等）嚴格過濾
 * 5. 離線/未配置 Token 時自動安全降級為本機磁碟讀寫，保證開發與測試 100% 順暢
 */

import fs from 'fs';
import path from 'path';

export interface GitHubDbConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}

/**
 * 取得 GitHub 資料庫設定
 */
export function getGitHubDbConfig(): GitHubDbConfig {
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GH_TOKEN ||
    '';

  // 自動解析 GITHUB_REPOSITORY (例如 'opelwu2002/omni-astrology')
  let defaultOwner = 'opelwu2002';
  let defaultRepo = 'omni-astrology';
  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.includes('/')) {
    const parts = process.env.GITHUB_REPOSITORY.split('/');
    defaultOwner = parts[0];
    defaultRepo = parts[1];
  }

  const owner = process.env.GITHUB_OWNER || process.env.GITHUB_REPO_OWNER || defaultOwner;
  const repo = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY_NAME || defaultRepo;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = process.env.GITHUB_USERS_PATH || 'data/users.json';

  return {
    token: token.trim(),
    owner: owner.trim(),
    repo: repo.trim(),
    branch: branch.trim(),
    filePath: filePath.trim(),
  };
}

/**
 * 檢查 GitHub 資料庫環境變數是否已完整配置
 */
export function isGitHubDbConfigured(): boolean {
  const config = getGitHubDbConfig();
  return Boolean(config.token && config.owner && config.repo);
}

/**
 * 幽靈資料與測試假資料過濾器（保證黃光隆等測試資料絕對不進入儲存庫）
 */
export function filterOutGhostUsers<T extends { email?: string; name?: string }>(users: T[]): T[] {
  if (!Array.isArray(users)) return [];
  return users.filter((u) => {
    const cleanEmail = (u.email || '').trim().toLowerCase();
    const cleanName = (u.name || '').trim();

    if (cleanEmail === 'admin@omni-astrology.com') return false;
    if (
      cleanEmail.includes('huang.kl') ||
      cleanEmail.includes('omni-enterprise.tw') ||
      cleanName.includes('黃光隆') ||
      cleanName.includes('大隆精密')
    ) {
      return false;
    }
    return true;
  });
}

/**
 * 從本機磁碟讀取 data/users.json (離線/降級用)
 */
function readUsersFromLocalDisk(): any[] {
  try {
    const localPath = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf-8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? filterOutGhostUsers(data) : [];
    }
  } catch (err: any) {
    console.warn('[github-db] 讀取本機 users.json 失敗:', err?.message);
  }
  return [];
}

/**
 * 寫入本機磁碟 data/users.json (離線/降級用)
 */
function writeUsersToLocalDisk(users: any[]): void {
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NOW_REGION) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) return;

  try {
    const localDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(localDir, 'users.json');
    fs.writeFileSync(localPath, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[github-db] 寫入本機 users.json 失敗:', err?.message);
  }
}

/**
 * 快取最新的檔案 SHA 與資料，減少高頻 GET 請求
 */
let latestCachedSha: string | null = null;
let latestCachedUsers: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5000; // 5 秒快取

/**
 * 主動清除快取，強制下次讀取直讀最新資料
 */
export function invalidateGithubUsersCache(): void {
  latestCachedSha = null;
  latestCachedUsers = null;
  lastFetchTime = 0;
}

/**
 * 從 GitHub 倉庫讀取最新的 data/users.json
 */
export async function fetchUsersFromGithub(forceRefresh = false): Promise<{
  users: any[];
  sha: string;
  isRemote: boolean;
}> {
  const config = getGitHubDbConfig();
  const now = Date.now();

  // 若未配置 Token，自動降級直讀本地磁碟最新內容
  if (!config.token) {
    const localUsers = readUsersFromLocalDisk();
    latestCachedUsers = localUsers;
    latestCachedSha = 'local-disk-sha';
    lastFetchTime = now;
    return {
      users: localUsers,
      sha: 'local-disk-sha',
      isRemote: false,
    };
  }

  // 若未過 TTL 且非強制刷新，直接回傳記憶體快取
  if (
    !forceRefresh &&
    latestCachedUsers &&
    latestCachedSha &&
    now - lastFetchTime < CACHE_TTL_MS
  ) {
    return {
      users: [...latestCachedUsers],
      sha: latestCachedSha,
      isRemote: true,
    };
  }

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Omni-Astrology-App',
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      // 若遠端檔案尚未建立 (404)，嘗試讀取本地檔案作為種子
      if (res.status === 404) {
        console.warn('[github-db] 遠端 data/users.json 尚未存在，使用本機預設值');
        const localUsers = readUsersFromLocalDisk();
        return { users: localUsers, sha: '', isRemote: false };
      }
      throw new Error(`GitHub API 回傳錯誤狀態碼: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const sha = data.sha;
    const base64Content = (data.content || '').replace(/\n/g, '');
    const decodedStr = Buffer.from(base64Content, 'base64').toString('utf-8');
    const parsed = JSON.parse(decodedStr);

    const cleanUsers = Array.isArray(parsed) ? filterOutGhostUsers(parsed) : [];

    // 更新快取
    latestCachedSha = sha;
    latestCachedUsers = cleanUsers;
    lastFetchTime = now;

    // 非 serverless 環境下同步備份至本機
    writeUsersToLocalDisk(cleanUsers);

    return {
      users: cleanUsers,
      sha,
      isRemote: true,
    };
  } catch (error: any) {
    console.error('[github-db] fetchUsersFromGithub 失敗，降級至本機磁碟:', error?.message);
    const localUsers = readUsersFromLocalDisk();
    return {
      users: localUsers,
      sha: latestCachedSha || 'fallback-sha',
      isRemote: false,
    };
  }
}

/**
 * 提交更新會員資料至 GitHub 倉庫 (PUT Contents API)
 * 具備 409 SHA 版本衝突自動抓取最新 SHA 重試機制
 */
export async function commitUsersToGithub(
  users: any[],
  commitMessage?: string,
  maxRetries = 3
): Promise<{ success: boolean; sha?: string; error?: string }> {
  const cleanUsers = filterOutGhostUsers(users);
  const config = getGitHubDbConfig();

  // 若未配置 GitHub Token，走本機安全降級模式
  if (!config.token) {
    writeUsersToLocalDisk(cleanUsers);
    latestCachedUsers = cleanUsers;
    latestCachedSha = 'local-disk-sha';
    return {
      success: true,
      sha: 'local-disk-sha',
    };
  }

  const message = commitMessage || `chore(users): 自動同步更新會員資料庫 (${cleanUsers.length} 位會員) [skip ci]`;
  const serialized = JSON.stringify(cleanUsers, null, 2);
  const base64Content = Buffer.from(serialized, 'utf-8').toString('base64');
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;

  let currentRetry = 0;

  while (currentRetry < maxRetries) {
    currentRetry++;

    // 1. 取得當前遠端檔案的 SHA
    let targetSha = latestCachedSha;
    if (!targetSha || currentRetry > 1) {
      const remoteInfo = await fetchUsersFromGithub(true);
      targetSha = remoteInfo.sha;
    }

    try {
      const payload: any = {
        message,
        content: base64Content,
        branch: config.branch,
      };
      if (targetSha && targetSha !== 'local-disk-sha') {
        payload.sha = targetSha;
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Omni-Astrology-App',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        const newSha = resData.content?.sha || resData.commit?.sha;

        // 更新快取
        latestCachedSha = newSha;
        latestCachedUsers = cleanUsers;
        lastFetchTime = Date.now();

        // 同步寫入本機備份
        writeUsersToLocalDisk(cleanUsers);

        return {
          success: true,
          sha: newSha,
        };
      }

      // 若發生 409 Conflict（SHA 版本過期），重新抓取 SHA 重試
      if (res.status === 409) {
        console.warn(`[github-db] 遭遇 409 SHA 衝突，進行第 ${currentRetry} 次重試...`);
        latestCachedSha = null; // 清空舊 sha
        continue;
      }

      const errorText = await res.text();
      console.error(`[github-db] GitHub commit 失敗: ${res.status} ${res.statusText}`, errorText);
      return {
        success: false,
        error: `GitHub API 錯誤 (${res.status}): ${errorText}`,
      };
    } catch (err: any) {
      console.error('[github-db] commitUsersToGithub 網路或請求異常:', err?.message);
      if (currentRetry >= maxRetries) {
        return {
          success: false,
          error: `連線 GitHub 異常: ${err?.message}`,
        };
      }
    }
  }

  return {
    success: false,
    error: '已超過最大重試次數，提交失敗',
  };
}
