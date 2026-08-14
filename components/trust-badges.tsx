type BadgeableBusiness = {
  verified: boolean;
  claimed_by: string | null;
  responds_to_inquiries: boolean;
  first_time_friendly: boolean;
};

const badgeClass =
  "font-mono text-[10px] tracking-wider uppercase px-[7px] py-1 border whitespace-nowrap";

export function TrustBadgePills({ business }: { business: BadgeableBusiness }) {
  return (
    <>
      {business.verified ? (
        <span className={`${badgeClass} border-teal text-teal`}>Verified</span>
      ) : null}
      {business.claimed_by ? (
        <span className={`${badgeClass} border-gold text-gold`}>Owner Verified</span>
      ) : null}
      {business.responds_to_inquiries ? (
        <span className={`${badgeClass} border-rule-strong text-ink-soft`}>
          Responds to Inquiries
        </span>
      ) : null}
      {business.first_time_friendly ? (
        <span className={`${badgeClass} border-rule-strong text-ink-soft`}>
          First-Time Friendly
        </span>
      ) : null}
    </>
  );
}

export function FinancingAndConsultChips({
  business,
}: {
  business: { financing_options: string[] | null; consult_types: string[] | null };
}) {
  const financingOptions = business.financing_options ?? [];
  const consultTypes = business.consult_types ?? [];
  if (!financingOptions.length && !consultTypes.length) return null;

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {financingOptions.length ? (
        <div>
          <h3 className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
            Financing
          </h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {financingOptions.map((option) => (
              <span key={option} className={`${badgeClass} border-rule-strong text-ink-soft`}>
                {option}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {consultTypes.length ? (
        <div>
          <h3 className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
            Consultation
          </h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {consultTypes.map((type) => (
              <span key={type} className={`${badgeClass} border-rule-strong text-ink-soft`}>
                {type}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
