const $ = (q) => document.querySelector(q);
const usernameEl = $("#username");
const platformsEl = $("#platforms");
const resultsEl = $("#results");
const summaryEl = $("#summary");
const noteEl = $("#note");
const btn = $("#checkBtn");
const selectAll = $("#selectAll");
const clearAll = $("#clearAll");

let PLATFORM_LIST = [];

function setLoading(on) {
  btn.disabled = on;
  btn.textContent = on ? "Kontrol ediliyor…" : "Kontrol Et";
}

function badge(status) {
  const map = {
    free: "b-free",
    taken: "b-taken",
    error: "b-error",
    unknown: "b-unknown",
  };
  return `<span class="badge ${map[status] || "b-unknown"}">${status}</span>`;
}

async function fetchPlatforms() {
  try {
    const r = await fetch("/api/platforms");
    const j = await r.json();
    PLATFORM_LIST = j.platforms || [];
    platformsEl.innerHTML = PLATFORM_LIST.map(
      (p) => `
      <label class="chip">
        <input type="checkbox" value="${p}" checked />
        <span>${p}</span>
      </label>
    `
    ).join("");
  } catch (e) {
    platformsEl.innerHTML = `<span class="muted">platformlar alınamadı</span>`;
  }
}

function selectedPlatforms() {
  return [...platformsEl.querySelectorAll("input[type=checkbox]:checked")].map(
    (i) => i.value
  );
}

function renderResults(data) {
  resultsEl.innerHTML = data.results
    .map(
      (r) => `
    <div class="res">
      <h3>
        <span>${r.platform}</span>
        ${badge(r.status)}
      </h3>
      <div class="kvs">
        <span>kaynak: <b>${r.source}</b></span>
        <span>ms: <b>${r.ms}</b></span>
      </div>
      ${
        r.url
          ? `<div style="margin-top:8px"><a class="mono" href="${r.url}" target="_blank" rel="noopener">profil →</a></div>`
          : ""
      }
    </div>
  `
    )
    .join("");
}

function renderSummaryFromHeaders(h) {
  const items = [
    ["Request-Id", h.get("x-request-id")],
    ["Platforms", h.get("x-platforms-total")],
    ["Cache Hits", h.get("x-cache-hits")],
    ["Live Hits", h.get("x-live-hits")],
    ["Errors", h.get("x-errors")],
    ["Retries", h.get("x-retries")],
    ["Retry Avg Wait (ms)", h.get("x-retry-avg-wait-ms")],
    ["Took (ms)", h.get("x-took-total-ms")],
  ].filter(([, v]) => v !== null && v !== "null" && v !== undefined);
  summaryEl.innerHTML = items
    .map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`)
    .join("");
}

function showNote(msg, kind = "info") {
  const color =
    kind === "error"
      ? "var(--bad)"
      : kind === "warn"
      ? "var(--warn)"
      : "var(--muted)";
  noteEl.innerHTML = `<span style="color:${color}">${msg}</span>`;
}

async function onCheck() {
  const u = usernameEl.value.trim();
  const p = selectedPlatforms();
  if (!u) {
    showNote("Kullanıcı adı boş olamaz.", "warn");
    return;
  }
  if (p.length === 0) {
    showNote("En az bir platform seç.", "warn");
    return;
  }

  const qs = new URLSearchParams({
    username: u,
    platforms: p.join(","),
  }).toString();
  setLoading(true);
  showNote("Sorgulanıyor…");

  try {
    const r = await fetch(`/api/check?${qs}`);
    if (!r.ok) {
      if (r.status === 429) {
        const body = await r.json().catch(() => ({}));
        showNote(
          `Hız limiti (429). ${
            body?.retryAfterSec
              ? "Tekrar dene: " + body.retryAfterSec + " sn"
              : ""
          }`,
          "error"
        );
      } else if (r.status === 400) {
        const body = await r.json().catch(() => ({}));
        showNote(
          `Geçersiz istek (400): ${body?.error || "validation_failed"}`,
          "error"
        );
      } else {
        const body = await r.json().catch(() => ({}));
        showNote(
          `Sunucu hatası (${r.status}): ${body?.error || "internal_error"}`,
          "error"
        );
      }
      return;
    }

    renderSummaryFromHeaders(r.headers);
    const data = await r.json();
    renderResults(data);
    showNote(`Bitti • ${new Date().toLocaleTimeString()}`);
  } catch (e) {
    showNote("Ağ hatası: " + e.message, "error");
  } finally {
    setLoading(false);
  }
}

selectAll.addEventListener("click", (e) => {
  e.preventDefault();
  platformsEl.querySelectorAll("input").forEach((i) => (i.checked = true));
});
clearAll.addEventListener("click", (e) => {
  e.preventDefault();
  platformsEl.querySelectorAll("input").forEach((i) => (i.checked = false));
});
btn.addEventListener("click", onCheck);
usernameEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onCheck();
});

fetchPlatforms().then(() => showNote("Platformlar yüklendi."));
