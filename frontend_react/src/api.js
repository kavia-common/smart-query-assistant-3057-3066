/**
 * Centralized API client for Chat endpoint with environment-based configuration.
 */

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /**
   * Determine API base URL:
   * - Prefer REACT_APP_API_BASE_URL if provided (e.g., https://api.example.com)
   * - Otherwise, default to same-origin ('')
   *
   * Note: For CRA, env vars must be prefixed with REACT_APP_ and injected at build time.
   */
  const envBase = process.env.REACT_APP_API_BASE_URL;
  if (envBase && typeof envBase === 'string') {
    return envBase.replace(/\/+$/, ''); // trim trailing slash
  }
  return '';
}

/**
 * Basic fetch with timeout helper to fail fast and surface clear errors.
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 30000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(resource, { ...rest, signal: controller.signal });
    return res;
  } catch (err) {
    // Normalize abort error message
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// PUBLIC_INTERFACE
export async function sendChatRequest({ messages, prompt }) {
  /**
   * Sends chat request to backend.
   * Expects backend to return JSON: { reply: string }.
   *
   * Raises detailed errors for network failures and non-2xx responses.
   */
  const base = getApiBaseUrl();
  const url = `${base}/api/chat`;

  let response;
  try {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Keep payload minimal and aligned with backend expectations
      body: JSON.stringify({ messages, prompt }),
      timeout: 30000,
      // Include credentials if backend needs cookies; keep disabled by default
      // credentials: 'include',
    });
  } catch (err) {
    // Network/connection-level errors
    const hint = buildConnectionHint();
    const detail = err?.message || 'Unknown network error';
    throw new Error(`Failed to reach assistant API. ${hint} (detail: ${detail})`);
  }

  if (!response.ok) {
    // Try to extract error detail body for clarity
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      bodyText = '';
    }
    const snippet = bodyText ? ` Response body: ${bodyText.slice(0, 200)}` : '';
    throw new Error(
      `Assistant API error ${response.status}. Check backend logs or configuration.${snippet}`
    );
  }

  // Parse JSON
  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error('Assistant API returned invalid JSON.');
  }

  // Expect { reply: string }
  if (!json || typeof json.reply !== 'string') {
    throw new Error('Assistant API payload missing "reply" field.');
  }

  return json.reply;
}

function buildConnectionHint() {
  const base = getApiBaseUrl() || '(same-origin)';
  return `Verify backend is running and reachable at ${base}/api/chat. If using a different host/port, set REACT_APP_API_BASE_URL in the environment (e.g., "REACT_APP_API_BASE_URL=https://api.example.com"). Also ensure CORS/proxy are configured.`;
}
