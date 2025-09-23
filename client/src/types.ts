// client/src/types.ts

// Tek bir platform sonucu
export interface PlatformResult {
  platform: string; // örn: "github"
  status: "taken" | "free" | "unknown" | "error";
  url: string;
  ms: number;
}

// /api/check response
export interface CheckResponse {
  username: string;
  checkedAt: string;
  results: PlatformResult[];
}

// /api/platforms response
export interface PlatformsResponse {
  platforms: string[];
}
