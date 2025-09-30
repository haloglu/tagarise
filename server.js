// server.js
import "dotenv/config";
// import "undici/register"; // global fetch/Headers/Request/Response

import { withTimeout, TimeoutError } from "./utils/withTimeout.js";
import { retryOnce } from "./utils/retry.js";

import express from "express";
import favicon from "serve-favicon";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import crypto from "node:crypto";
import pLimit from "p-limit";

import path from "node:path";
import fs from "node:fs"; // ⬅️ EKLE

import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import adapters from "./adapters/index.js";
import { cache } from "./utils/cache.js";
import { validateCheck } from "./utils/validate.js";
import { requestTimeout } from "./utils/requestTimeout.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

// ---- App & config
const app = express();
const PORT = process.env.PORT || 4000;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "4", 10);
const limit = pLimit(CONCURRENCY);
const startedAt = Date.now();
const ADAPTER_TIMEOUT_MS = parseInt(
  process.env.ADAPTER_TIMEOUT_MS || "10000",
  10
); // 10 sn

app.set("trust proxy", 1);

// favicon middleware
const favCandidates = [
  path.join(__dirname, "public", "favicon.ico"), // monorepo root/public
  path.join(__dirname, "client", "public", "favicon.ico"), // client/public
  path.join(__dirname, "client", "favicon.ico"), // olası build çıktısı
];

const favPath = favCandidates.find((p) => fs.existsSync(p));
if (favPath) {
  console.log("[favicon] using:", favPath);
  app.use(favicon(favPath));
} else {
  console.warn("[favicon] not found, skipping serve-favicon");
}
// ---- Global middlewares (sıra önemli)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: CORS_ORIGIN })); // preflight öncesi

// app.use(helmet()); // temel güvenlik header’ları

const isDev = process.env.NODE_ENV !== "production";

app.use(
  helmet({
    contentSecurityPolicy: isDev
      ? false
      : {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"], // inline yok -> güvenli
            connectSrc: ["'self'"], // fetch /api
            imgSrc: ["'self'", "data:"],
            styleSrc: ["'self'", "'unsafe-inline'"], // inline style yoksa bunu da kaldırabilirsin
          },
        },
    crossOriginEmbedderPolicy: false, // devtools sorun çıkarmasın
  })
);

app.use(compression()); // gzip/brotli

// ---- Rate limit (sadece /api altında)
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_SEC || "60", 10) * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "60", 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      ok: false,
      error: "rate_limited",
      statusCode: 429,
      retryAfterSec: 60,
    }),
});
app.use("/api", apiLimiter);

// ---- Request logger
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const tookMs = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "info",
        reqId: req.id,
        ip: req.ip,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        tookMs: Math.round(tookMs),
        username: req.query?.username || null,
        platforms: req.query?.platforms || null,
      })
    );
  });
  next();
});

// ---- Health & basit endpoints
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "tagarise-api",
    version: pkg.version,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    time: new Date().toISOString(),
  });
});

app.get("/api/hello", (_req, res) => {
  res.json({
    status: "ok",
    message: "hello",
    version: pkg.version,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    time: new Date().toISOString(),
  });
});

app.get("/api/platforms", (_req, res) =>
  res.json({ platforms: Object.keys(adapters) })
);

// ---- /api/check — validation + p-limit + cache + summary
app.get(
  "/api/check",
  requestTimeout(parseInt(process.env.REQ_TIMEOUT_MS || "20000", 10)),
  validateCheck(adapters),
  async (req, res) => {
    const { username, platforms } = req.validated;
    const list = platforms?.length ? platforms : Object.keys(adapters);
    const overallStart = Date.now();

    const tasks = list.map((platform) =>
      limit(async () => {
        const adapter = adapters[platform];
        if (!adapter || typeof adapter.check !== "function") {
          return { platform, status: "unknown", url: "", ms: 0, source: "n/a" };
        }

        const cached = cache.get(platform, username);
        if (cached) return { ...cached, platform, source: "cache" };

        const start = Date.now();
        try {
          // ESKİ HALİ:
          // const status = await adapter.check(username);

          // YENİ HALİ (A şıkkı: sinyalsiz withTimeout):
          const {
            result: status,
            retries,
            waitedMs,
          } = await retryOnce(
            () =>
              withTimeout(
                adapter.check(username),
                ADAPTER_TIMEOUT_MS,
                `adapter_timeout:${platform}`
              ),
            {
              baseMs: 300,
              jitterMs: 300,
              onlyIf: (err) => {
                if (err instanceof TimeoutError) return true;
                const msg = String(err?.message || "");
                return msg.startsWith("5") || msg.includes("ECONNRESET");
              },
            }
          );

          const url = adapter.profileUrl?.(username) || "";
          const result = {
            platform,
            status,
            url,
            ms: Date.now() - start,
            source: "live",
            retries: retries || 0,
            waitedMs,
          };

          if (status === "taken" || status === "free") {
            cache.set(platform, username, result);
          }
          return result;
        } catch (err) {
          console.error(
            JSON.stringify({
              ts: new Date().toISOString(),
              level: "warn",
              reqId: req.id,
              platform,
              msg: "adapter_failed",
              err: err?.message,
            })
          );
          return {
            platform,
            status: "error",
            url: "",
            ms: Date.now() - start,
            source: "live",
          };
        }
      })
    );

    const results = await Promise.all(tasks);

    // Summary
    const total = results.length;
    const cacheHits = results.filter((r) => r.source === "cache").length;
    const liveHits = results.filter((r) => r.source === "live").length;
    const errors = results.filter((r) => r.status === "error").length;
    const takenCnt = results.filter((r) => r.status === "taken").length;
    const freeCnt = results.filter((r) => r.status === "free").length;
    const retryCount = results.reduce((n, r) => n + (r.retries || 0), 0);
    const tookTotalMs = Date.now() - overallStart;

    const waitedList = results.map((r) => (r.retries ? r.waitedMs || 0 : 0));
    const avgRetryWaitMs =
      waitedList.filter(Boolean).reduce((a, b) => a + b, 0) /
      Math.max(1, waitedList.filter(Boolean).length || 1);

    res.setHeader("X-Request-Id", req.id);
    res.setHeader("X-Platforms-Total", String(total));
    res.setHeader("X-Cache-Hits", String(cacheHits));
    res.setHeader("X-Live-Hits", String(liveHits));
    res.setHeader("X-Errors", String(errors));
    res.setHeader("X-Retries", String(retryCount));
    res.setHeader("X-Retry-Avg-Wait-Ms", String(Math.round(avgRetryWaitMs)));
    res.setHeader("X-Took-Total-Ms", String(tookTotalMs));

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "info",
        type: "request_summary",
        reqId: req.id,
        username,
        totalPlatforms: total,
        cacheHits,
        liveHits,
        errors,
        taken: takenCnt,
        free: freeCnt,
        retryCount,
        tookTotalMs,
      })
    );

    res.json({ username, checkedAt: new Date().toISOString(), results });
  }
);

// ---- Static UI (client/)
app.use(express.static(path.join(__dirname, "client")));
app.get("/", (_req, res) =>
  res.sendFile(path.join(__dirname, "client", "index.html"))
);

// ---- 404 (API)
app.use("/api", (req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ ok: false, error: "not_found" });
});

// ---- Global error handler
app.use((err, req, res, _next) => {
  const reqId = req?.id || crypto.randomUUID();
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      reqId,
      message: err?.message,
      stack: err?.stack?.split("\n")[0],
    })
  );
  if (!res.headersSent)
    res.status(500).json({ ok: false, error: "internal_error", reqId });
});

// ---- Start + graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 Tagarise API running on port ${PORT}`);
});

function shutdown(sig) {
  console.log(`[${sig}] graceful shutdown...`);
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
