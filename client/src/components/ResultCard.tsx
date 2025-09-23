import type { PlatformResult } from "../types";

const platformIcon = (p: string) => {
  switch (p) {
    case "github":
      return <i className="fa-brands fa-github"></i>;
    case "medium":
      return <i className="fa-brands fa-medium"></i>;
    case "behance":
      return <i className="fa-brands fa-behance"></i>;
    case "reddit":
      return <i className="fa-brands fa-reddit"></i>;
    default:
      return <i className="fa-solid fa-globe"></i>;
  }
};

export default function ResultCard({ item }: { item: PlatformResult }) {
  const { platform, status, url, ms } = item;
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4>
          <span>{platformIcon(platform)}</span>
          <span style={{ opacity: 0.9 }}>{platform}</span>
        </h4>
        {url && (
          <a className="ext" href={url} target="_blank" rel="noreferrer">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        )}
      </div>
      <div className={`status ${status}`}>
        {status.toUpperCase()}{" "}
        {typeof ms === "number" && (
          <span style={{ opacity: 0.7 }}>({ms} ms)</span>
        )}
      </div>
    </div>
  );
}
