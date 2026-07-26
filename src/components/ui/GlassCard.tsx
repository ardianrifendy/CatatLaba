import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type GlassCardProps = ComponentPropsWithoutRef<'div'>

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  )
}
