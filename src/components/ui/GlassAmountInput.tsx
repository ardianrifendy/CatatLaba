import type { ChangeEvent } from 'react'
import { GlassInput } from '@/components/ui/GlassInput'

// 15 digits max: 999_999_999_999_999 stays below Number.MAX_SAFE_INTEGER, so
// integer IDR amounts are always exact — no floats anywhere (RULES.md).
const MAX_DIGITS = 15

/** Group a plain digit string with dots: '1234567' -> '1.234.567'. */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

type GlassAmountInputProps = {
  id?: string
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  error?: boolean
  autoFocus?: boolean
  disabled?: boolean
}

/**
 * Integer-IDR amount input. Shows a visual 'Rp' prefix and dot-grouped digits
 * while typing; emits an integer (or null when empty). Formatting is applied
 * on every change, so the caret sits at the end after each keystroke — the
 * simple, predictable behavior for amount entry.
 */
export function GlassAmountInput({
  id,
  value,
  onChange,
  placeholder,
  error = false,
  autoFocus = false,
  disabled = false,
}: GlassAmountInputProps) {
  const display = value === null ? '' : groupDigits(String(value))

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS)
    if (digits === '') {
      onChange(null)
      return
    }
    // Integer parse only — money is integer IDR; safe because of MAX_DIGITS.
    onChange(Number.parseInt(digits, 10))
  }

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-zinc-500"
      >
        Rp
      </span>
      <GlassInput
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        error={error}
        autoFocus={autoFocus}
        disabled={disabled}
        className="pl-11 font-medium tabular-nums"
      />
    </div>
  )
}
