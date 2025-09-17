// utils/withTimeout.js

/** Özel hata tipi: timeout'u loglarda net ayırmak için */
export class TimeoutError extends Error {
  constructor(message = "timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * 1) Genel amaçlı: eldeki Promise'ı süre ile yarıştırır.
 *    NOT: Alttaki işlemi gerçek anlamda iptal etmez; sadece üst katmanı erken döndürür.
 *    - Her adapter'ı sarmak için güvenli varsayılan.
 *
 * @param {Promise<any>} promise - beklenen iş
 * @param {number} ms - zaman aşımı (ms)
 * @param {string} [label="timeout"] - hata mesaj etiketi
 */
export function withTimeout(promise, ms = 10_000, label = "timeout") {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new TimeoutError(label)), ms);
  });

  return Promise.race([promise.finally(() => clearTimeout(t)), timeout]);
}

/**
 * 2) Sinyalli sürüm: fonksiyonun kendisine AbortSignal verilir.
 *    İçeride fetch/axios(AbortController destekli) vb. varsa gerçekten iptal eder.
 *
 * @param {(signal: AbortSignal) => Promise<any>} fn - signal alan async fonksiyon
 * @param {number} ms - zaman aşımı (ms)
 * @param {string} [label="timeout"] - hata mesaj etiketi
 */
export function withTimeoutFn(fn, ms = 10_000, label = "timeout") {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);

  return Promise.resolve()
    .then(() => fn(ctrl.signal))
    .catch((err) => {
      // fetch AbortError -> TimeoutError'a çevir (daha anlamlı)
      if (err?.name === "AbortError") throw new TimeoutError(label);
      throw err;
    })
    .finally(() => clearTimeout(timer));
}
