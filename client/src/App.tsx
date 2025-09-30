// App.tsx
import Header from "./components/Header";
import PlatformChips from "./components/PlatformChips";
import ResultsGrid from "./components/ResultsGrid";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPlatforms, checkUsername } from "./api";
import type { PlatformResult, CheckResponse } from "./types";
import "./index.css";

export default function App() {
  const [all, setAll] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<PlatformResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

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
    if (!username) return;
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

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const v = inputRef.current?.value.trim();
      if (v) runCheck(v);
    }
  };

  const handleClick = () => {
    const v = inputRef.current?.value.trim();
    if (v) runCheck(v);
  };

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="h1">Username Checker</div>
        <div className="sub">{subtitle}</div>

        <div className="search-row">
          <div className="input-wrap">
            <input
              ref={inputRef}
              className="input"
              placeholder="username" // ⬅︎ burada artık "/" YOK
              onKeyDown={handleEnter}
              aria-label="Kullanıcı adı girin"
              autoComplete="off"
            />
          </div>

          <button className="btn" onClick={handleClick} aria-label="Kontrol et">
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

        <ResultsGrid
          items={results}
          isLoading={loading}
          skeletonCount={selected.length || 8}
        />
      </div>
    </>
  );
}
