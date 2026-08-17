"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactFormState } from "./actions";

const initialState: ContactFormState = { status: "idle" };

const inputClass = "mt-1 w-full border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (state.status === "success") {
    return (
      <div className="border border-teal p-6 text-sm text-teal">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
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
        <label className="block text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="business_name">
          Business name <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input id="business_name" name="business_name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="phone">
          Phone <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input id="phone" name="phone" type="tel" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="message">
          Message
        </label>
        <textarea id="message" name="message" rows={5} required className={inputClass} />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
