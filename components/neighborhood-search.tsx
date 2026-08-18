"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CityMatch = { city: string; metroSlug: string; metroName: string; state: string | null };

export function NeighborhoodSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CityMatch[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Nothing to fetch for a too-short query — just skip scheduling a fetch.
    // Stale matches are left in state but gated out of the render below by
    // the same length check, so nothing stale ever shows.
    if (query.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setMatches(data.cities ?? []);
        setOpen(true);
      } catch {
        setMatches([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function select(match: CityMatch) {
    setOpen(false);
    setQuery("");
    router.push(`/search?metro=${match.metroSlug}&city=${encodeURIComponent(match.city)}`);
  }

  return (
    <div className="relative max-w-xs">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && matches.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search any city (Frisco, Marietta…)"
        className="w-full border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
      />
      {open && query.trim().length >= 2 && matches.length ? (
        <ul className="absolute z-10 mt-1 w-full border border-rule-strong bg-paper shadow-sm">
          {matches.map((match) => (
            <li key={`${match.city}-${match.metroSlug}`}>
              <button
                type="button"
                onClick={() => select(match)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-paper-raised"
              >
                {match.city}
                <span className="ml-1.5 text-xs text-ink-soft">
                  {match.metroName}, {match.state}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
