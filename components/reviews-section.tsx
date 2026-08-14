type Review = {
  id: string;
  author_name: string | null;
  rating: number | null;
  review_text: string | null;
  review_date: string | null;
  source: string;
};

export function RatingTicks({ rating, small = false }: { rating: number; small?: boolean }) {
  const filled = Math.round(rating);
  return (
    <span className="inline-flex gap-[2px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`${small ? "h-2.5 w-[7px]" : "h-4 w-3"} border ${
            i < filled ? "border-gold bg-gold" : "border-rule-strong bg-transparent"
          }`}
        />
      ))}
    </span>
  );
}

export function averageRating(reviews: Review[]) {
  const rated = reviews.filter((r): r is Review & { rating: number } => r.rating != null);
  if (!rated.length) return null;
  return rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
}

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const avg = averageRating(reviews);

  return (
    <div className="mt-10">
      <h2 className="font-semibold">Reviews &amp; ratings</h2>
      {avg != null ? (
        <div className="mt-3 flex items-end gap-5">
          <div className="font-mono text-4xl font-bold leading-none">
            {avg.toFixed(1)}
            <span className="text-sm font-normal text-ink-soft">/5</span>
          </div>
          <div>
            <RatingTicks rating={avg} />
            <div className="mt-1.5 text-xs text-ink-soft">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 border-t border-rule-strong">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-rule py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">{review.author_name ?? "Anonymous"}</span>
              <span className="flex items-center gap-2.5">
                {review.rating != null ? <RatingTicks rating={review.rating} small /> : null}
                {review.review_date ? (
                  <span className="text-xs text-ink-soft">
                    {new Date(review.review_date).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                ) : null}
                <span className="border border-rule-strong px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase text-ink-soft">
                  {review.source}
                </span>
              </span>
            </div>
            {review.review_text ? (
              <p className="mt-2 max-w-[68ch] text-sm">{review.review_text}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
