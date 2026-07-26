import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type GlassInputProps = ComponentPropsWithoutRef<'input'> & {
  error?: boolean
}

// Native form controls are banned (RULES.md). This component must never render
// as one of these types — if a caller passes one, we coerce back to text.
const forbiddenTypes = new Set([
  'checkbox',
  'radio',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  'file',
  'color',
  'range',
])

export function GlassInput({
  className,
  error = false,
  type = 'text',
  ...props
}: GlassInputProps) {
  const safeType = typeof type === 'string' && forbiddenTypes.has(type) ? 'text' : type
  return (
    <input
      type={safeType}
      className={cn(
        'h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 backdrop-blur-xl transition-colors',
        'placeholder:text-zinc-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        error && 'border-expense',
        className,
      )}
      {...props}
    />
  )
}
