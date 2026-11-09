// Small fetch wrapper: browser-like UA, timeout, retries with backoff.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} url
 * @param {{method?:string, headers?:Record<string,string>, body?:string, timeoutMs?:number, retries?:number}} [opts]
 * @returns {Promise<Response>}
 */
export async function request(url, opts = {}) {
  const { method = 'GET', headers = {}, body, timeoutMs = 30_000, retries = 2 } = opts;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        body,
        redirect: 'follow',
        signal: ctrl.signal,
        headers: {
          'user-agent': UA,
          accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'accept-language': 'en-ZA,en;q=0.9',
          ...headers,
        },
      });
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(500 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

export async function fetchText(url, opts) {
  const res = await request(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export async function fetchJson(url, opts) {
  const res = await request(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}
