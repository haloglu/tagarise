// adapters/github.js
import { withTimeout } from "../utils/withTimeout.js";
const HEADERS = {
  "User-Agent": "tagarise/1.0",
  Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN && {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  }),
};

export default {
  name: "github",
  profileUrl: (u) => `https://github.com/${encodeURIComponent(u)}`,
  async check(username) {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}`;
    const resp = await fetch(url, { headers: HEADERS });

    // Rate limit / yasaklı durumları “unknown” yap (veya özel durum)
    if (resp.status === 404) return "free";
    if (resp.status === 200) return "taken";
    if (resp.status === 403 || resp.status === 429) return "unknown"; // istersen "rate_limited"
    return "unknown";
  },
};
