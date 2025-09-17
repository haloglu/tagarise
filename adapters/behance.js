const HEADERS = { "User-Agent": "tagarise/1.0", Accept: "text/html" };

export default {
  name: "behance",
  profileUrl: (u) => `https://www.behance.net/${encodeURIComponent(u)}`,
  async check(username) {
    const url = `https://www.behance.net/${encodeURIComponent(username)}`;
    const resp = await fetch(url, { headers: HEADERS, redirect: "manual" });
    if (resp.status === 404) return "free";
    if (resp.status === 200) return "taken";
    if (resp.status === 301 || resp.status === 302) return "taken";
    if (resp.status === 403 || resp.status === 429) return "unknown";
    return "unknown";
  },
};
