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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print bg-white p-3.5 sm:p-4 rounded-xl border border-davo-border">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              const range = getPresetRange(p.key);
              onChange(range.start, range.end);
            }}
            className="h-9 px-3.5 rounded-full border border-davo-border text-xs sm:text-sm font-medium text-davo-navy hover:bg-davo-blue hover:text-white hover:border-davo-blue transition-colors flex-shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:ml-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-davo-border/60">
        <input
          type="date"
          value={start}
          onChange={(e) => onChange(e.target.value, end)}
          className="h-9 px-3 rounded-xl sm:rounded-full border border-davo-border text-xs sm:text-sm text-davo-navy bg-davo-bg/50 outline-none focus:border-davo-blue focus:bg-white flex-1 sm:flex-initial min-w-[130px]"
        />
        <span className="text-davo-muted text-xs sm:text-sm">to</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onChange(start, e.target.value)}
          className="h-9 px-3 rounded-xl sm:rounded-full border border-davo-border text-xs sm:text-sm text-davo-navy bg-davo-bg/50 outline-none focus:border-davo-blue focus:bg-white flex-1 sm:flex-initial min-w-[130px]"
        />
        {(start || end) && (
          <button
            onClick={() => onChange("", "")}
            className="h-9 px-3 rounded-full text-xs sm:text-sm font-medium text-davo-muted hover:text-davo-danger transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
