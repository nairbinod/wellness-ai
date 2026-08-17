"use client";

import { useActionState } from "react";
import { submitLead, type LeadFormState } from "./actions";

const initialState: LeadFormState = { status: "idle" };

const inputClass = "mt-1 w-full border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal";

export function LeadForm({
  businessId,
  businessName,
  sourcePage,
  utmSource,
  utmMedium,
  referrer,
}: {
  businessId: string;
  businessName: string;
  sourcePage: string;
  utmSource?: string;
  utmMedium?: string;
  referrer?: string;
}) {
  const [state, formAction, isPending] = useActionState(submitLead, initialState);

  if (state.status === "success") {
    return (
      <div className="border border-teal p-6 text-sm text-teal">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="business_id" value={businessId} />
      <input type="hidden" name="business_name" value={businessName} />
      <input type="hidden" name="source_page" value={sourcePage} />
      {utmSource ? <input type="hidden" name="utm_source" value={utmSource} /> : null}
      {utmMedium ? <input type="hidden" name="utm_medium" value={utmMedium} /> : null}
      {referrer ? <input type="hidden" name="referrer" value={referrer} /> : null}

      {/* Honeypot — off-screen (not display:none, some bots skip those), never
          seen or reachable by real users. Named/autocompleted specifically to
          avoid browser autofill (a field literally named "company_website"
          risks being auto-populated by saved address/company profiles, which
          would silently drop real submissions — "new-password" is the one
          autocomplete value browsers reliably respect as an opt-out signal).
          Anything filled here means a bot. */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
        <label htmlFor="hp_field">Leave this field blank</label>
        <input id="hp_field" name="hp_field" type="text" tabIndex={-1} autoComplete="new-password" />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="consumer_name">
          Name
        </label>
        <input id="consumer_name" name="consumer_name" required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="consumer_email">
          Email
        </label>
        <input id="consumer_email" name="consumer_email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="consumer_phone">
          Phone <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input id="consumer_phone" name="consumer_phone" type="tel" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="service_interest">
          Interested in <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input id="service_interest" name="service_interest" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="message">
          Message <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <textarea id="message" name="message" rows={3} className={inputClass} />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Request Information"}
      </button>
    </form>
  );
}
