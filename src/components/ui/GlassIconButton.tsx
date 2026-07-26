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
        'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-100 backdrop-blur-xl transition-colors hover:bg-white/10 active:bg-white/15',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
