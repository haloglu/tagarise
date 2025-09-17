// utils/cache.js
/**
 * TTLCache (LRU'ya yakın)
 * - FIFO yerine "touch" ile sık kullanılanları korur.
 * - İstatistik: hits, misses, evictions
 * - Temizlik: sweep timer (unref)
 * - API:
 *    get(platform, username) -> value | null (value içine _ttlLeftMs ekler)
 *    set(platform, username, value, ttlMs?)
 *    delete(platform, username)
 *    clear()
 *    size()
 *    stats()
 */

const DEFAULT_TTL_MS = parseInt(
  process.env.CACHE_TTL_MS || `${10 * 60 * 1000}`, // 10 dk
  10
);
const SWEEP_MS = parseInt(
  process.env.CACHE_SWEEP_MS || `${5 * 60 * 1000}`, // 5 dk
  10
);
const MAX_SIZE = parseInt(process.env.CACHE_MAX_SIZE || "5000", 10); // en fazla 5k kayıt

class TTLCache {
  /**
   * @param {{ defaultTtlMs?: number, sweepMs?: number, maxSize?: number }} [opts]
   */
  constructor(opts = {}) {
    this.defaultTtlMs = Number.isFinite(opts.defaultTtlMs)
      ? opts.defaultTtlMs
      : DEFAULT_TTL_MS;
    this.sweepMs = Number.isFinite(opts.sweepMs) ? opts.sweepMs : SWEEP_MS;
    this.maxSize = Number.isFinite(opts.maxSize) ? opts.maxSize : MAX_SIZE;

    /** @type {Map<string, { value: any, exp: number }>} */
    this.store = new Map();

    // Metrics
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;

    // Periyodik süpürme
    this.timer = setInterval(() => this.sweep(), this.sweepMs);
    // Node 16+ varsa event loop'u bloklamasın
    if (typeof this.timer.unref === "function") this.timer.unref();
  }

  key(platform, username) {
    return `${String(platform).toLowerCase()}:${String(
      username
    ).toLowerCase()}`;
  }

  /**
   * LRU touch: bulunduğunda anahtarı sona taşı.
   */
  get(platform, username) {
    const k = this.key(platform, username);
    const entry = this.store.get(k);
    if (!entry) {
      this.misses++;
      return null;
    }

    const ttlLeft = entry.exp - Date.now();
    if (ttlLeft <= 0) {
      // süresi dolmuş: sil ve miss say
      this.store.delete(k);
      this.misses++;
      return null;
    }

    // touch: sona taşı (LRU etkisi)
    this.store.delete(k);
    this.store.set(k, entry);

    this.hits++;
    // value kopyası + kalan süre
    return { ...entry.value, _ttlLeftMs: ttlLeft };
    // İstersen sadece entry.value döndürebilirsin.
  }

  /**
   * Kapasite doluysa en eski anahtarı at (eviction++)
   */
  set(platform, username, value, ttlMs = this.defaultTtlMs) {
    // Sınır aşımı: en eski ekleneni at
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.evictions++;
      }
    }

    const k = this.key(platform, username);
    this.store.set(k, { value, exp: Date.now() + Math.max(1, ttlMs) });
  }

  delete(platform, username) {
    const k = this.key(platform, username);
    return this.store.delete(k);
  }

  clear() {
    this.store.clear();
    // İstatistikleri sıfırlamak istemezsen bu satırları kaldır:
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Süresi dolanları temizler (evictions++ yapar)
   */
  sweep() {
    const now = Date.now();
    for (const [k, entry] of this.store.entries()) {
      if (now >= entry.exp) {
        this.store.delete(k);
        this.evictions++;
      }
    }
  }

  size() {
    return this.store.size;
  }

  stats() {
    return {
      size: this.size(),
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      defaultTtlMs: this.defaultTtlMs,
      sweepMs: this.sweepMs,
      maxSize: this.maxSize,
    };
  }

  /**
   * Opsiyonel: süreç sonlandırırken çağırmak istersen
   */
  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

// Tekil cache objesi (projede kullanılan)
export const cache = new TTLCache();

// İstersen test için sınıfı da export edelim:
export { TTLCache };
