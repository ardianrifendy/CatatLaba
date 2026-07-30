import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

// `aria-label` is required: the only child is an icon, so the label is the
// button's entire accessible name.
type GlassIconButtonProps = ComponentPropsWithoutRef<'button'> & {
  'aria-label': string
}

export function GlassIconButton({
  className,
  type = 'button',
  ...props
}: GlassIconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'ios-pressable inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-glass-border bg-glass text-foreground transition-colors hover:bg-glass-hover active:bg-glass-strong',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
