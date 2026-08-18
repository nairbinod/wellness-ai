"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { subscribe, getSnapshot, getServerSnapshot, clearCompare, MAX_COMPARE } from "@/lib/compare-store";

export function CompareBar() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!ids.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule-strong bg-paper px-6 py-3.5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs tracking-wider uppercase text-ink-soft">
          Comparing {ids.length} of {MAX_COMPARE}
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={clearCompare}
            className="font-mono text-xs tracking-wider uppercase text-ink-soft hover:text-ink"
          >
            Clear
          </button>
          {ids.length >= 2 ? (
            <Link
              href={`/compare?ids=${ids.join(",")}`}
              className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink"
            >
              Compare now
            </Link>
          ) : (
            <span className="font-mono text-xs tracking-wider uppercase text-ink-soft opacity-60">
              Pick 1 more to compare
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
