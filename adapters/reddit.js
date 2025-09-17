// adapters/reddit.js
const HEADERS = { "User-Agent": "tagarise/1.0" };

export default {
  name: "reddit",
  profileUrl: (u) => `https://www.reddit.com/user/${encodeURIComponent(u)}`,
  async check(username) {
    const url = `https://www.reddit.com/user/${encodeURIComponent(
      username
    )}/about.json`;
    const resp = await fetch(url, { headers: HEADERS });
    if (resp.status === 404) return "free";
    if (resp.ok) return "taken";
    return "unknown";
  },
};
