import type { CheckResponse } from "./types";

// .env (Netlify) -> VITE_API_BASE_URL=https://tagarise.onrender.com
const RAW = import.meta.env.VITE_API_BASE_URL || "";
const API = RAW.replace(/\/+$/, ""); // sonda / varsa temizle

function api(path: string) {
  return `${API}${path}`;
}

export async function fetchPlatforms(): Promise<string[]> {
  const res = await fetch(api("/api/platforms"));
  if (!res.ok) throw new Error(`platforms ${res.status}`);
  const data = await res.json();
  return data.platforms ?? [];
}

export async function checkUsername(
  username: string,
  platforms: string[] = []
): Promise<CheckResponse> {
  const q = new URLSearchParams({ username });
  if (platforms.length) q.set("platforms", platforms.join(","));
  const res = await fetch(api(`/api/check?${q.toString()}`));
  if (!res.ok) throw new Error(`check ${res.status}`);
  return (await res.json()) as CheckResponse;
}
