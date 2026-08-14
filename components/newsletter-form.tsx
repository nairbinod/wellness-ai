"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/newsletter-actions";

const initialState: NewsletterState = { status: "idle" };

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribeNewsletter, initialState);

  if (state.status === "success") {
    return (
      <div className="flex-1 min-w-[280px] border border-rule-strong px-4 py-3.5 text-sm text-teal">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex-1 min-w-[280px] max-w-[480px]">
      <div className="flex border border-rule-strong bg-paper">
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          className="flex-1 bg-transparent px-3.5 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="border-l border-rule-strong bg-teal px-5 font-mono text-[11px] tracking-wider uppercase text-teal-ink disabled:opacity-60"
        >
          {isPending ? "…" : "Subscribe"}
        </button>
      </div>
      {state.status === "error" ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
    </form>
  );
}
