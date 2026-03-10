export function formatEur(amount: number): string {
  return new Intl.NumberFormat("sq-XK", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
