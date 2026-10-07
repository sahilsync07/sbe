import { useGitHubTokenModal, DEFAULT_GITHUB_TOKEN } from '@/composables/useGitHubTokenModal';
import axios from 'axios';

export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export const getGitHubToken = () => {
  return (
    localStorage.getItem('sbe_github_token') ||
    import.meta.env.VITE_GITHUB_TOKEN ||
    DEFAULT_GITHUB_TOKEN ||
    ''
  );
};

export const promptForToken = async (reason = 'missing') => {
  const { promptForToken: promptModal } = useGitHubTokenModal();
  return await promptModal(reason);
};

/**
 * Direct commit to GitHub repository via GitHub REST API with auto-retry on 409 SHA conflict
 */
export async function commitFileToGitHub(
  filePath,
  updatedContentString,
  commitMessage,
  tokenOverride = null
) {
  let token = tokenOverride || getGitHubToken();
  const owner = import.meta.env.VITE_GITHUB_OWNER || 'sahilsync07';
  const repo = import.meta.env.VITE_GITHUB_REPO || 'sbe';
  const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';

  if (!token) {
    token = await promptForToken('missing');
    if (!token) {
      const err = new Error('GitHub token required');
      err.status = 401;
      throw err;
    }
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  let retries = 3;
  while (retries > 0) {
    // 1. Fetch current file SHA
    const metaRes = await fetch(`${apiUrl}?ref=${branch}&_t=${Date.now()}`, { headers });
    if (metaRes.status === 401 || metaRes.status === 403) {
      const freshToken = await promptForToken('expired');
      if (freshToken) {
        token = freshToken;
        headers.Authorization = `Bearer ${token}`;
        retries--;
        continue;
      }
      const err = new Error(`GitHub authentication failed (${metaRes.status}): Bad credentials or token expired`);
      err.status = metaRes.status;
      throw err;
    }
    if (!metaRes.ok) {
      throw new Error(`Failed to fetch file SHA for ${filePath} (${metaRes.status})`);
    }
    const metaData = await metaRes.json();
    const currentSha = metaData.sha;

    // 2. Commit update
    const b64Content = utf8ToBase64(updatedContentString);
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        content: b64Content,
        sha: currentSha,
        branch,
      }),
    });

    if (putRes.status === 401 || putRes.status === 403) {
      const freshToken = await promptForToken('expired');
      if (freshToken) {
        token = freshToken;
        headers.Authorization = `Bearer ${token}`;
        retries--;
        continue;
      }
      const err = new Error(`GitHub commit authentication failed (${putRes.status}): Bad credentials or token expired`);
      err.status = putRes.status;
      throw err;
    }

    if (putRes.status === 409) {
      console.warn(`[GitHub Sync] SHA conflict on ${filePath}, retrying with fresh SHA...`);
      retries--;
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }

    if (!putRes.ok) {
      const errBody = await putRes.json().catch(() => ({}));
      throw new Error(errBody.message || `GitHub commit failed (${putRes.status})`);
    }

    const putData = await putRes.json();
    console.log(`[GitHub Sync] Successfully committed ${filePath}: ${putData.commit?.sha?.slice(0, 7)}`);
    return putData;
  }
  throw new Error(`Failed to commit ${filePath} to GitHub after retry attempts due to SHA conflict`);
}

/**
 * Universal dual-sync helper:
 * Tries local backend endpoint if available; otherwise commits directly to GitHub repository (dual frontend/sbe-hub paths).
 */
export async function syncDataDualPath({
  backendEndpoint,
  backendPayload,
  githubFilePathFrontend,
  githubFilePathHub,
  contentJsonString,
  commitMessage,
}) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  let backendSuccess = false;

  // 1. Try local backend first (if accessible within 2500ms)
  try {
    const res = await axios.post(`${backendUrl}${backendEndpoint}`, backendPayload, {
      timeout: 2500,
      validateStatus: (s) => s < 500,
    });
    if (res.status === 200 && res.data?.error === undefined) {
      backendSuccess = true;
      console.log(`[DualSync] Succeeded via local backend: ${backendEndpoint}`);
      return { success: true, via: 'backend', data: res.data };
    }
  } catch (backendErr) {
    console.log(`[DualSync] Local backend unavailable (${backendErr.message}), falling back to direct GitHub commit`);
  }

  // 2. Commit directly to GitHub
  try {
    const ghRes = await commitFileToGitHub(githubFilePathFrontend, contentJsonString, commitMessage);
    if (githubFilePathHub) {
      try {
        await commitFileToGitHub(githubFilePathHub, contentJsonString, commitMessage);
      } catch (hubErr) {
        console.warn(`[DualSync] Mirroring to hub path ${githubFilePathHub} had warning:`, hubErr.message);
      }
    }
    return { success: true, via: 'github', data: ghRes };
  } catch (ghErr) {
    console.error(`[DualSync] GitHub commit failed:`, ghErr);
    throw ghErr;
  }
}
