// adapters/reddit.js
const HEADERS = {
  "User-Agent": "Tagarise/1.0 (+https://tagarise)",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.8",
};

const NAME_RE = /^[A-Za-z0-9_]{3,20}$/;

async function ping(u, signal) {
  const url = `https://www.reddit.com/user/${encodeURIComponent(
    u
  )}/about.json?raw_json=1`;
  return fetch(url, { headers: HEADERS, redirect: "follow", signal });
}

export default {
  name: "reddit",
  profileUrl: (u) => `https://www.reddit.com/user/${encodeURIComponent(u)}`,
  async check(username) {
    const u = String(username).trim().toLowerCase();
    if (!NAME_RE.test(u)) return "unknown"; // istersen 'invalid' da yapabilirsin

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 3500);

    try {
      let res = await ping(u, ac.signal);

      if (res.status === 200) return "taken";
      if (res.status === 404) return "free";

      // 403/429 (rate-limit/erişim) için 1 kez retry (küçük jitter ile)
      if (res.status === 403 || res.status === 429) {
        await new Promise((r) => setTimeout(r, 150 + Math.random() * 250));
        res = await ping(u, ac.signal);
        if (res.status === 200) return "taken";
        if (res.status === 404) return "free";
      }

      return "unknown";
    } catch {
      return "unknown";
    } finally {
      clearTimeout(t);
    }
  },
};
