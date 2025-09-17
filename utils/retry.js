// utils/retry.js
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Tek denemelik, jitter'lı backoff retry.
 * onlyIf(err, result) true dönerse retry yapılır.
 */
export async function retryOnce(
  fn,
  { baseMs = 300, jitterMs = 200, onlyIf } = {}
) {
  // 1. deneme
  try {
    return { result: await fn(), retries: 0 };
  } catch (err) {
    if (!onlyIf?.(err, null)) throw err;
  }
  // backoff + jitter
  const wait = baseMs + Math.floor(Math.random() * jitterMs);
  await sleep(wait);

  // 2. deneme (son)
  try {
    return { result: await fn(), retries: 1, waitedMs: wait };
  } catch (err) {
    // ikinci de de olmadı → hatayı yükselt
    err._retried = true;
    err._waitedMs = wait;
    throw err;
  }
}
