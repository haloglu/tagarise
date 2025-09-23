import type { PlatformResult } from "../types";
import ResultCard from "./ResultCard";

export default function ResultsGrid({ items }: { items: PlatformResult[] }) {
  if (!items.length) return null;
  return (
    <div className="row" style={{ marginTop: 16 }}>
      {items.map((r, i) => (
        <ResultCard key={r.platform + i} item={r} />
      ))}
    </div>
  );
}
