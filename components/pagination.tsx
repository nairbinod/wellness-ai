import Link from "next/link";

export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
export const DEFAULT_PAGE_SIZE = 24;

export function resolvePageSize(value?: string) {
  const n = Number(value);
  return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE;
}

export function resolvePage(value?: string) {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function hrefForPage(basePath: string, params: Record<string, string | undefined>, page: number) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  usp.set("page", String(page));
  return `${basePath}?${usp.toString()}`;
}

export function Pagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-between gap-4 border-t border-rule pt-6">
      {page > 1 ? (
        <Link
          href={hrefForPage(basePath, params, page - 1)}
          className="border border-rule-strong px-4 py-2 font-mono text-xs tracking-wider uppercase hover:border-ink"
        >
          ← Prev
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-xs text-ink-soft">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefForPage(basePath, params, page + 1)}
          className="border border-rule-strong px-4 py-2 font-mono text-xs tracking-wider uppercase hover:border-ink"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
