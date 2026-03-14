import Link from "next/link";

type Props = {
  page: number;
  hasMore: boolean;
  /** Existing search params to preserve when navigating. */
  searchParams?: Record<string, string | undefined>;
  /** Base path for the links (e.g. "/watches"). Defaults to current-page-relative. */
  basePath?: string;
  className?: string;
};

function buildHref(
  targetPage: number,
  searchParams: Record<string, string | undefined>,
  basePath?: string,
) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params.set(k, v);
  }
  if (targetPage > 1) {
    params.set("page", String(targetPage));
  } else {
    params.delete("page");
  }
  const qs = params.toString();
  const base = basePath ?? "";
  return qs ? `${base}?${qs}` : base || "?";
}

export function Pagination({
  page,
  hasMore,
  searchParams = {},
  basePath,
  className,
}: Props) {
  if (page <= 1 && !hasMore) return null;

  return (
    <div
      className={`flex items-center justify-between gap-4 ${className ?? ""}`}
    >
      {page > 1 ? (
        <Link
          href={buildHref(page - 1, searchParams, basePath)}
          className="text-xs uppercase tracking-[0.14em] text-graphite/65 transition hover:text-graphite"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs text-graphite/45">Page {page}</span>
      {hasMore ? (
        <Link
          href={buildHref(page + 1, searchParams, basePath)}
          className="text-xs uppercase tracking-[0.14em] text-graphite/65 transition hover:text-graphite"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
