import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import PlatformChips from "./components/PlatformChips";
import ResultsGrid from "./components/ResultsGrid";
import { useEffect, useMemo, useState } from "react";
import { fetchPlatforms, checkUsername } from "./api";
import type { PlatformResult, CheckResponse } from "./types";
import "./index.css";

export default function App() {
  const [all, setAll] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<PlatformResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "github",
    "reddit",
    "medium",
    "behance",
  ]);

  useEffect(() => {
    fetchPlatforms()
      .then((p) => {
        setAll(p);
        setSelected(p);
      })
      .catch(() => setError("Platform listesi çekilemedi"));
  }, []);

  const subtitle = useMemo(() => "Tag it. Rise with it.", []);

  const runCheck = async (username: string) => {
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const data: CheckResponse = await checkUsername(
        username,
        selected.length ? selected : all
      );
      setResults(data.results ?? []);
    } catch {
      setError("Kontrol sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="h1">Username Checker</div>
        <div className="sub">{subtitle}</div>

        <div className="search-row">
          <input
            className="input"
            placeholder="/"
            onKeyDown={(e) => {
              const t = e.target as HTMLInputElement;
              if (e.key === "Enter" && t.value.trim()) runCheck(t.value.trim());
            }}
          />
          <button
            className="btn"
            onClick={() => {
              const el = document.querySelector<HTMLInputElement>(".input");
              if (el?.value.trim()) runCheck(el.value.trim());
            }}
          >
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ marginRight: 8 }}
            />
            Kontrol Et
          </button>
        </div>

        <div className="label">Platformlar:</div>
        <PlatformChips all={all} selected={selected} onToggle={toggle} />

        <div className="section">Sonuçlar</div>
        <div className="hr"></div>

        {error && <div style={{ color: "#b54700", marginTop: 8 }}>{error}</div>}
        <ResultsGrid items={results} />
      </div>
    </>
  );
}
