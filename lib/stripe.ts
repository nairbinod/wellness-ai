import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const FEATURED_PRICE_ID = process.env.STRIPE_FEATURED_PRICE_ID;
