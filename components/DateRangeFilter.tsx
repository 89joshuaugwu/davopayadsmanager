"use client";

import { getPresetRange } from "@/lib/utils";

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

const presets = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
] as const;

export default function DateRangeFilter({ start, end, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 no-print">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => {
            const range = getPresetRange(p.key);
            onChange(range.start, range.end);
          }}
          className="h-9 px-4 rounded-full border border-davo-border text-sm font-medium text-davo-navy hover:bg-davo-blue hover:text-white hover:border-davo-blue transition-colors"
        >
          {p.label}
        </button>
      ))}

      <div className="flex items-center gap-2 ml-auto">
        <input
          type="date"
          value={start}
          onChange={(e) => onChange(e.target.value, end)}
          className="h-9 px-3 rounded-full border border-davo-border text-sm text-davo-navy bg-white outline-none focus:border-davo-blue"
        />
        <span className="text-davo-muted text-sm">to</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onChange(start, e.target.value)}
          className="h-9 px-3 rounded-full border border-davo-border text-sm text-davo-navy bg-white outline-none focus:border-davo-blue"
        />
        <button
          onClick={() => onChange("", "")}
          className="h-9 px-3 rounded-full text-sm font-medium text-davo-muted hover:text-davo-danger transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
