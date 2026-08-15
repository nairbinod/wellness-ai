"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";

const STORAGE_KEY = "pn-cookie-consent";

type Consent = "unset" | "accepted" | "declined";

function readStoredConsent(): Consent {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "accepted" || stored === "declined" ? stored : "unset";
}

function noopSubscribe() {
  return () => {};
}

function getServerSnapshot(): Consent {
  return "unset";
}

export function CookieConsent({ gaMeasurementId }: { gaMeasurementId?: string }) {
  // useSyncExternalStore (not an effect + setState) is React's recommended
  // way to read a client-only external source like localStorage without a
  // hydration mismatch — SSR/first paint always sees "unset", then syncs to
  // the real stored value right after hydration.
  const storedConsent = useSyncExternalStore(noopSubscribe, readStoredConsent, getServerSnapshot);
  const [override, setOverride] = useState<Consent | null>(null);
  const consent = override ?? storedConsent;

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setOverride(value);
  }

  return (
    <>
      {gaMeasurementId && consent === "accepted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');`}
          </Script>
        </>
      ) : null}

      {consent === "unset" ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-rule-strong bg-paper px-6 py-4">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <p className="max-w-[65ch] text-sm text-ink-soft">
              We use essential cookies to run the site, and — only if you accept — analytics
              cookies to understand traffic.{" "}
              <Link href="/cookie-policy" className="text-teal hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="flex flex-none gap-2.5">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="border border-rule-strong px-4 py-2 font-mono text-xs tracking-wider uppercase hover:border-ink"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="bg-teal px-4 py-2 font-mono text-xs tracking-wider uppercase text-teal-ink"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
