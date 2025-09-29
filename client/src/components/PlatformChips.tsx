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
          <button
            key={p}
            type="button"
            className={clsx(
              "chip",
              p === "github" && "gh",
              p === "medium" && "md",
              p === "behance" && "be",
              p === "reddit" && "rd",
              active && "active"
            )}
            onClick={() => onToggle(p)}
            title={p}
            aria-pressed={active}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
