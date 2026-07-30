import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type GlassCardProps = ComponentPropsWithoutRef<'div'>

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-glass-border/70 bg-glass shadow-glass backdrop-blur-xl transition-all duration-200 hover:border-glass-border',
        className,
      )}
      {...props}
    />
  )
}
