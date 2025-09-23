import clsx from "clsx";

export default function PlatformChips({
  all,
  selected,
  onToggle,
}: {
  all: string[];
  selected: string[];
  onToggle: (n: string) => void;
}) {
  return (
    <div className="chips" style={{ marginTop: 12 }}>
      {all.map((p) => {
        const active = selected.includes(p);
        return (
          <div
            key={p}
            className={`chip ${
              p === "github"
                ? "gh"
                : p === "medium"
                ? "md"
                : p === "behance"
                ? "be"
                : p === "reddit"
                ? "rd"
                : ""
            }`}
            onClick={() => onToggle(p)}
            title={p}
          >
            {p}
          </div>
        );
      })}
    </div>
  );
}
