import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS, CATEGORY_TAG_CLASS, type BusinessCategory } from "@/lib/categories";
import { TrustBadgePills } from "@/components/trust-badges";
import { formatDistance } from "@/lib/geo";

type CardBusiness = {
  name: string;
  city: string | null;
  state: string | null;
  category: BusinessCategory;
  verified: boolean;
  claimed_by: string | null;
  responds_to_inquiries: boolean;
  first_time_friendly: boolean;
};

export function ListingCard({
  business,
  href,
  photoUrl,
  priceLabel = "—",
  featured = false,
  distanceMiles,
}: {
  business: CardBusiness;
  href: string;
  photoUrl?: string;
  priceLabel?: string;
  featured?: boolean;
  distanceMiles?: number | null;
}) {
  const tag = CATEGORY_TAG_CLASS[business.category];

  return (
    <Link
      href={href}
      className={`block border border-rule-strong bg-paper hover:border-ink transition-colors border-b-[3px] ${
        tag.borderBottom
      } ${featured ? "border-t-[3px] border-t-gold" : ""}`}
    >
      <div className="relative aspect-[4/3] border-b border-rule bg-paper-raised">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={business.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null}
        <span
          className={`absolute top-2.5 left-2.5 font-mono text-[10px] tracking-wider uppercase px-2 py-1 bg-paper border border-rule-strong ${tag.text}`}
        >
          {CATEGORY_LABELS[business.category]}
        </span>
        {featured ? (
          <span className="absolute top-2.5 right-2.5 font-mono text-[10px] tracking-wider uppercase px-2 py-1 bg-gold text-paper">
            Featured
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="font-semibold text-[15px]">{business.name}</div>
        <div className="mt-0.5 text-xs text-ink-soft">
          {business.city}
          {business.state ? `, ${business.state}` : ""}
          {distanceMiles != null ? ` · ${formatDistance(distanceMiles)}` : ""}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1">
          <TrustBadgePills business={business} />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-rule">
        <span className="font-mono text-[13px]">{priceLabel}</span>
        <span className="font-mono text-[11px] tracking-wider uppercase text-teal">View →</span>
      </div>
    </Link>
  );
}
