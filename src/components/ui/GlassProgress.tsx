import { cn } from '@/lib/cn'

type GlassProgressProps = {
  value: number
  label: string
  className?: string
  tone?: 'default' | 'warning'
}

function widthClass(value: number): string {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  if (percent === 0) return 'w-0'
  if (percent <= 8) return 'w-1/12'
  if (percent <= 17) return 'w-1/6'
  if (percent <= 25) return 'w-1/4'
  if (percent <= 33) return 'w-1/3'
  if (percent <= 42) return 'w-5/12'
  if (percent <= 50) return 'w-1/2'
  if (percent <= 58) return 'w-7/12'
  if (percent <= 67) return 'w-2/3'
  if (percent <= 75) return 'w-3/4'
  if (percent <= 83) return 'w-5/6'
  if (percent <= 92) return 'w-11/12'
  return 'w-full'
}

export function GlassProgress({
  value,
  label,
  className,
  tone = 'default',
}: GlassProgressProps) {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn('h-2 overflow-hidden rounded-full bg-glass-hover', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none',
          tone === 'warning' ? 'bg-expense' : 'bg-accent',
          widthClass(percent),
        )}
      />
    </div>
  )
}
