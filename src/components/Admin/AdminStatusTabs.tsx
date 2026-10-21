"use client";

/** Consistent WordPress-style status summary, filtering client-side only. */
export default function AdminStatusTabs({ value, onChange, items }: {
  value: string;
  onChange: (value: string) => void;
  items: { status?: string }[];
}) {
  const counts = {
    all: items.length,
    published: items.filter(item => item.status === "published").length,
    draft: items.filter(item => !item.status || item.status === "draft").length,
    retired: items.filter(item => item.status === "retired").length,
  };
  return <nav className="admin-status-tabs" role="group" aria-label="Filter by publishing status">
    {(["all", "published", "draft", "retired"] as const).map(key =>
      <button type="button" key={key} className={key === value ? "is-active" : ""} aria-pressed={key === value} onClick={() => onChange(key)}>
        {key === "all" ? "All" : key === "published" ? "Published" : key === "draft" ? "Draft" : "Deleted"}
        <span>{counts[key]}</span>
      </button>
    )}
  </nav>;
}
