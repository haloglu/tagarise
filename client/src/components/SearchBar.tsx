import { useState } from "react";

export default function SearchBar({
  onSubmit,
  loading,
}: {
  onSubmit: (u: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");
  const go = () => {
    if (value.trim()) onSubmit(value.trim());
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        marginTop: 16,
      }}
    >
      <input
        className="input"
        placeholder="Kullanıcı adı (ör. serlow)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") go();
        }}
      />
      <button className="btn" disabled={!value.trim() || loading} onClick={go}>
        {loading ? "Kontrol..." : "Kontrol Et"}
      </button>
    </div>
  );
}
