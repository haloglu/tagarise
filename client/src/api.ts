import type { CheckResponse } from "./types";

export async function fetchPlatforms(): Promise<string[]> {
  const res = await fetch("/api/platforms");
  if (!res.ok) throw new Error("platforms failed");
  const data = await res.json();
  return data.platforms ?? [];
}

export async function checkUsername(username: string, platforms: string[]) {
  const q = new URLSearchParams({
    username,
    platforms: platforms.join(","),
  });
  const res = await fetch(`/api/check?${q}`);
  if (!res.ok) throw new Error("check failed");
  const data: CheckResponse = await res.json();
  return data;
}
