"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { nearestMetro } from "@/lib/geo";

type Metro = { slug: string; lat: number; lng: number };

// Two modes, sharing one geolocation flow:
// - "redirect-to-metro" (homepage): find the nearest of a known metro list
//   and jump straight to it with coordinates attached.
// - "refine-page" (metro/category/search pages): stay put, just attach
//   coordinates to the current URL so the page can re-render sorted by
//   distance.
type Props =
  | { mode: "redirect-to-metro"; metros: Metro[] }
  | { mode: "refine-page"; metros?: never };

export function UseLocationButton(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");

  function handleClick() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lat = latitude.toFixed(5);
        const lng = longitude.toFixed(5);

        if (props.mode === "redirect-to-metro") {
          const nearest = nearestMetro(props.metros, latitude, longitude);
          if (!nearest) {
            setStatus("error");
            return;
          }
          router.push(`/${nearest.slug}?lat=${lat}&lng=${lng}`);
          return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", lat);
        params.set("lng", lng);
        router.push(`${pathname}?${params.toString()}`);
      },
      () => setStatus("error"),
      { timeout: 10000 }
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "locating"}
        className="border border-rule-strong px-4 py-2 font-mono text-xs tracking-wider uppercase hover:border-ink disabled:opacity-50"
      >
        {status === "locating" ? "Locating…" : "Use my location"}
      </button>
      {status === "error" ? (
        <span className="text-xs text-red-600 dark:text-red-400">
          Couldn&apos;t get your location — check your browser&apos;s location permission.
        </span>
      ) : null}
    </div>
  );
}
