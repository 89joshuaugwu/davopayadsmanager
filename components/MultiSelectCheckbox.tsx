"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  searchable?: boolean;
  defaultOpen?: boolean;
}

export default function MultiSelectCheckbox({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function toggleAll() {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  }

  return (
    <div className="border-b border-davo-border pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left mb-2"
      >
        <span className="text-xs font-semibold text-davo-navy uppercase tracking-wide">
          {label} {selected.length > 0 && <span className="text-davo-blue">({selected.length})</span>}
        </span>
        <ChevronDown
          size={14}
          className={`text-davo-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div>
          {searchable && (
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-davo-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-8 pl-7 pr-2 rounded-lg border border-davo-border text-xs outline-none focus:border-davo-blue"
              />
            </div>
          )}

          <button
            onClick={toggleAll}
            className="text-[11px] font-medium text-davo-blue hover:underline mb-2"
          >
            {selected.length === options.length ? "Clear all" : "Select all"}
          </button>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {filtered.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggle(opt.id)}
                  className="w-4 h-4 rounded accent-davo-blue flex-shrink-0"
                />
                <span className="text-xs text-davo-navy group-hover:text-davo-blue truncate">
                  {opt.label}
                  {opt.sublabel && <span className="text-davo-muted"> · {opt.sublabel}</span>}
                </span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-[11px] text-davo-muted italic">No matches.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
