// components/ResultsGrid.tsx
import type { PlatformResult } from "../types";
import ResultCard from "./ResultCard";

type Props = {
  items: PlatformResult[];
  isLoading?: boolean;
  skeletonCount?: number;
};

export default function ResultsGrid({
  items,
  isLoading = false,
  skeletonCount = 8,
}: Props) {
  // Yükleniyor: skeleton kartlar
  if (isLoading) {
    return (
      <div className="row" style={{ marginTop: 16 }} aria-busy="true">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={`sk-${i}`} />
        ))}
      </div>
    );
  }

  // Boş durum: küçük bir ipucu
  if (!items.length) {
    return (
      <div className="empty hint" style={{ marginTop: 16, opacity: 0.8 }}>
        Arama yapın veya platform seçin.
      </div>
    );
  }

  // Normal sonuçlar
  return (
    <div className="row" style={{ marginTop: 16 }}>
      {items.map((r, i) => (
        <ResultCard key={r.platform + i} item={r} />
      ))}
    </div>
  );
}

/* Basit skeleton kart — ResultCard’a dokunmadan yer tutucu gösterir.
   Not: İstersen önceki mesajımdaki CSS “shimmer” efektini ekleyip
   .sk-line’lara animasyon da kazandırabilirsin. */
function SkeletonCard() {
  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(255,255,255,.08)",
    background: "var(--card-bg, #0f172a)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 220,
    flex: 1,
    marginBottom: 12,
  };

  const line = (w = "100%", h = 14): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: 8,
    background: "#1f2937",
  });

  return (
    <div className="col" style={{ marginBottom: 12 }}>
      <div
        className="sk"
        style={{
          borderRadius: 12,
          padding: 12,
          border: "1px solid rgba(255,255,255,.08)",
          background: "var(--card-bg, #0f172a)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minWidth: 220,
        }}
        aria-hidden="true"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="sk-pill" />
          <span className="sk-dot" style={{ marginLeft: "auto" }} />
        </div>

        <span className="sk-line short" />
        <span className="sk-line" />
        <span className="sk-line" style={{ width: "40%" }} />
      </div>
    </div>
  );
}
