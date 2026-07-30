import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type GlassInputProps = ComponentPropsWithoutRef<'input'> & {
  error?: boolean
}

// Keep non-text native controls out of the shared primitive. Date inputs stay
// native so Android can provide the correct calendar picker and keyboard.
const forbiddenTypes = new Set([
  'checkbox',
  'radio',
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
        'h-11 w-full rounded-2xl border border-glass-border bg-glass px-4 text-sm text-foreground transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        error && 'border-expense',
        className,
      )}
      {...props}
    />
  )
}
