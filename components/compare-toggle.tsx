"use client";

import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, getServerSnapshot, toggleCompare, MAX_COMPARE } from "@/lib/compare-store";

export function CompareToggle({ businessId }: { businessId: string }) {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const selected = ids.includes(businessId);
  const full = !selected && ids.length >= MAX_COMPARE;

  return (
    <button
      type="button"
      disabled={full}
      title={full ? `Compare up to ${MAX_COMPARE} at a time` : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(businessId);
      }}
      className={`font-mono text-[10px] tracking-wider uppercase disabled:opacity-40 ${
        selected ? "text-teal" : "text-ink-soft hover:text-ink"
      }`}
    >
      {selected ? "✓ Comparing" : "+ Compare"}
    </button>
  );
}
