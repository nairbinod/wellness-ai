// A quick-glance $/$$/$$$ indicator, separate from the exact numbers shown
// on listing cards and in JSON-LD priceRange — this is deliberately coarse
// (based on the average price_min across a business's services), the same
// kind of signal Yelp/Google use, not a precise figure.
export function priceTier(prices: (number | null | undefined)[]): "$" | "$$" | "$$$" | null {
  const values = prices.filter((p): p is number => p != null);
  if (!values.length) return null;
  const avg = values.reduce((sum, p) => sum + p, 0) / values.length;
  if (avg < 150) return "$";
  if (avg <= 500) return "$$";
  return "$$$";
}
