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

// 嚴格確保檔案路徑無開頭斜線（杜絕 //data/users.json 或 /data/users.json 導致 404）
export const FILE_PATH = (process.env.GITHUB_USERS_PATH || 'data/users.json')
  .trim()
  .replace(/^\/+/, '');

export const BRANCH = (process.env.GITHUB_BRANCH || 'main').trim();

/**
 * 取得並正規化 Repository 擁有者與倉庫名（高容錯解析，杜絕雙重 owner 與 404 錯誤）
 */
export function getRepoInfo(): { owner: string; repo: string } {
  const rawRepo = (
    process.env.GITHUB_REPO ||
    process.env.GITHUB_REPOSITORY ||
    ''
  )
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');

  let owner = (process.env.GITHUB_OWNER || process.env.GITHUB_REPO_OWNER || '').trim();
  let repo = rawRepo;

  if (rawRepo.includes('/')) {
    const parts = rawRepo.split('/').filter(Boolean);
    owner = parts[0] || owner;
    repo = parts[1] || repo;
  }

  // 預設容錯：若仍缺少，預設使用專案本身的擁有者與名稱
  if (!owner) owner = 'opelwu2002';
  if (!repo || repo === 'opelwu2002') repo = 'omni-astrology';

  // 再次檢查防止 repo 仍包含多餘層級
  if (repo.includes('/')) {
    const parts = repo.split('/').filter(Boolean);
    owner = parts[0] || owner;
    repo = parts[1] || repo;
  }

  return { owner: owner.trim(), repo: repo.trim() };
}

/**
 * 取得共用標頭 (包含 User-Agent 與 Authorization)
 */
export function getHeaders(): Record<string, string> {
  const token = (
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GH_TOKEN ||
    ''
  ).trim();

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Omni-Astrology-App',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * 取得 GitHub 資料庫設定
 */
export function getGitHubDbConfig(): GitHubDbConfig {
  const token = (
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GH_TOKEN ||
    ''
  ).trim();
  const { owner, repo } = getRepoInfo();

  return {
    token,
    owner,
    repo,
    branch: BRANCH,
    filePath: FILE_PATH,
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
 * 歷史假資料過濾器（僅過濾特定舊版寫死之假 Email，絕不根據會員姓名誤殺真實會員）
 */
export function filterOutGhostUsers<T extends { email?: string; name?: string }>(users: T[]): T[] {
  if (!Array.isArray(users)) return [];
  return users.filter((u) => {
    const cleanEmail = (u.email || '').trim().toLowerCase();

    // 僅過濾歷史寫死之假 Email
    if (cleanEmail === 'admin@omni-astrology.com') return false;
    if (cleanEmail === 'huang.kl@omni-enterprise.tw' || cleanEmail.endsWith('@omni-enterprise.tw')) {
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

  const cleanPath = (config.filePath || FILE_PATH).replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${cleanPath}?ref=${encodeURIComponent(config.branch)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      // 若遠端檔案尚未建立 (404)，嘗試讀取本地檔案作為種子
      if (res.status === 404) {
        console.warn(`[github-db] 遠端 ${cleanPath} 尚未存在 (404)，使用本機預設值`);
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
 * 高容錯 GitHub API 寫入函式 (saveUsersToGitHub)
 * 嚴格去除前導斜線、自動抓取現有 SHA、支援首次新建與更新
 */
export async function saveUsersToGitHub(users: any[]) {
  const { owner, repo } = getRepoInfo();
  const headers = getHeaders();
  const token = (
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GH_TOKEN ||
    ''
  ).trim();

  const cleanUsers = filterOutGhostUsers(users);

  // 若未配置 Token，在本地開發/降級環境寫入本機
  if (!token) {
    console.warn('[GitHub DB] 未設定 GITHUB_TOKEN，寫入本機磁碟備份');
    writeUsersToLocalDisk(cleanUsers);
    return { success: true, isLocalFallback: true };
  }

  const cleanPath = FILE_PATH.replace(/^\/+/, '');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  console.log(`[GitHub DB] 正在讀取目標檔案 SHA: ${apiUrl}?ref=${BRANCH}`);

  // 1. 取得檔案現有 SHA
  let currentSha: string | undefined;
  const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(BRANCH)}`, {
    headers,
    cache: 'no-store',
  });

  if (getRes.ok) {
    const fileData = await getRes.json();
    currentSha = fileData.sha;
    console.log(`[GitHub DB] 目標檔案已存在，取得現有 SHA: ${currentSha}`);
  } else if (getRes.status !== 404) {
    const errorText = await getRes.text();
    throw new Error(`無法讀取 GitHub 檔案 (${getRes.status}): ${errorText}`);
  } else {
    console.log(`[GitHub DB] 遠端檔案尚不存在 (404)，將執行首次新建 commit`);
  }

  // 2. 將資料編碼為 Base64 (支援 UTF-8 中文)
  const jsonString = JSON.stringify(cleanUsers, null, 2);
  const contentBase64 = Buffer.from(jsonString, 'utf-8').toString('base64');

  // 3. 執行 Commit 更新檔案
  console.log(`[GitHub DB] 正在寫入更新至 GitHub: ${apiUrl}`);
  const payload: any = {
    message: `chore: 後台更新會員資料與權限 (${cleanUsers.length} 位會員) [skip ci]`,
    content: contentBase64,
    branch: BRANCH,
  };
  if (currentSha) {
    payload.sha = currentSha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  if (!putRes.ok) {
    const errJson = await putRes.json().catch(() => ({}));
    console.error('[GitHub DB] 寫入失敗詳情:', errJson);
    throw new Error(`GitHub API 錯誤 (${putRes.status}): ${JSON.stringify(errJson)}`);
  }

  const result = await putRes.json();
  const newSha = result.content?.sha || result.commit?.sha;

  // 更新快取
  latestCachedSha = newSha;
  latestCachedUsers = cleanUsers;
  lastFetchTime = Date.now();
  writeUsersToLocalDisk(cleanUsers);

  return result;
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

  const cleanPath = (config.filePath || FILE_PATH).replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${cleanPath}`;
  const message = commitMessage || `chore(users): 自動同步更新會員資料庫 (${cleanUsers.length} 位會員) [skip ci]`;
  const serialized = JSON.stringify(cleanUsers, null, 2);
  const base64Content = Buffer.from(serialized, 'utf-8').toString('base64');

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
      console.log(`[GitHub DB] 正在寫入更新至 GitHub (${currentRetry}/${maxRetries}): ${url}`);
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
        headers: getHeaders(),
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

/**
 * 通用讀取 GitHub 檔案（支援 orders.json、invoices.json、users.json 等）
 * 包含本機磁碟降級保護與高容錯 JSON 解析
 */
export async function getFileFromGitHub<T>(
  filePath: string,
  fallbackData: T
): Promise<{ data: T; sha?: string }> {
  const cleanPath = filePath.trim().replace(/^\/+/, '');
  const { owner, repo } = getRepoInfo();
  const headers = getHeaders();
  const token = (
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GH_TOKEN ||
    ''
  ).trim();

  // 靜態鎖定本機 data 目錄路徑，消除 Turbopack dynamic tracing 警示
  const getSafeLocalFile = (p: string) => path.join(process.cwd(), 'data', path.basename(p));

  // 若未配置 Token，直接嘗試讀取本機磁碟
  if (!token) {
    try {
      const localFile = getSafeLocalFile(cleanPath);
      if (fs.existsSync(localFile)) {
        const raw = fs.readFileSync(localFile, 'utf-8');
        return { data: JSON.parse(raw), sha: 'local-sha' };
      }
    } catch (err: any) {
      console.warn(`[github-db] 讀取本機 ${cleanPath} 失敗:`, err?.message);
    }
    return { data: fallbackData };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${encodeURIComponent(BRANCH)}`;

  try {
    const res = await fetch(apiUrl, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`[github-db] 遠端檔案尚未存在 (${cleanPath})，嘗試讀取本機種子...`);
        try {
          const localFile = getSafeLocalFile(cleanPath);
          if (fs.existsSync(localFile)) {
            const raw = fs.readFileSync(localFile, 'utf-8');
            return { data: JSON.parse(raw), sha: '' };
          }
        } catch {
          // 忽略本機錯誤
        }
      }
      return { data: fallbackData };
    }

    const file = await res.json();
    const content = Buffer.from(file.content || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(content);
    return { data: parsed, sha: file.sha };
  } catch (err: any) {
    console.error(`[github-db] getFileFromGitHub(${cleanPath}) 異常:`, err?.message);
    try {
      const localFile = getSafeLocalFile(cleanPath);
      if (fs.existsSync(localFile)) {
        const raw = fs.readFileSync(localFile, 'utf-8');
        return { data: JSON.parse(raw) };
      }
    } catch {
      // 忽略
    }
    return { data: fallbackData };
  }
}

/**
 * 通用寫入 GitHub 檔案（支援 orders.json、invoices.json 等任意資料結構）
 * 嚴格去除前導斜線、自動獲取 SHA、支援新建與更新、同步本機備份
 */
export async function saveFileToGitHub(
  filePath: string,
  data: any,
  commitMessage: string
): Promise<void> {
  const cleanPath = filePath.trim().replace(/^\/+/, '');
  const { owner, repo } = getRepoInfo();
  const headers = getHeaders();
  const token = (
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GH_TOKEN ||
    ''
  ).trim();

  // 本地磁碟同步寫入（非 serverless 環境）
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NOW_REGION) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (!isServerless) {
    try {
      const localFile = path.join(process.cwd(), 'data', path.basename(cleanPath));
      const dir = path.dirname(localFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[github-db] 本機同步備份寫入 ${cleanPath} 失敗:`, err?.message);
    }
  }

  // 若無 Token，已完成本機磁碟寫入，直接返回
  if (!token) {
    console.warn(`[github-db] 未設置 GITHUB_TOKEN，檔案已保存至本地磁碟: ${cleanPath}`);
    return;
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  // 1. 先取得目前檔案的 SHA
  let currentSha: string | undefined;
  const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(BRANCH)}`, {
    headers,
    cache: 'no-store',
  });

  if (getRes.ok) {
    const fileData = await getRes.json();
    currentSha = fileData.sha;
  }

  // 2. Base64 編碼 (支援 UTF-8 中文)
  const jsonString = JSON.stringify(data, null, 2);
  const contentBase64 = Buffer.from(jsonString, 'utf-8').toString('base64');

  // 3. PUT 更新 / 提交
  console.log(`[GitHub DB] 正在寫入更新至 GitHub: ${apiUrl} (${commitMessage})`);
  const payload: any = {
    message: `${commitMessage} [skip ci]`,
    content: contentBase64,
    branch: BRANCH,
  };
  if (currentSha) {
    payload.sha = currentSha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    console.error(`[github-db] saveFileToGitHub 寫入失敗:`, err);
    throw new Error(`GitHub 寫入失敗 (${putRes.status}): ${JSON.stringify(err)}`);
  }
}

