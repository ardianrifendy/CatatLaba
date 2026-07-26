/**
 * Format an integer IDR amount as `Rp1.234.567` (no decimals), per DESIGN.md.
 * Money is always integer IDR (RULES.md); fractional input is truncated.
 */
export function formatIDR(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const digits = Math.abs(Math.trunc(amount)).toString()
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}Rp${grouped}`
}
