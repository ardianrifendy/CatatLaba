import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'danger'

type GlassButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90 active:bg-accent/80',
  ghost:
    'border border-white/10 bg-white/5 text-zinc-100 backdrop-blur-xl hover:bg-white/10',
  danger: 'bg-expense text-white hover:bg-expense/90 active:bg-expense/80',
}

export function GlassButton({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: GlassButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
