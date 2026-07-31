import { cn } from '@/lib/cn'
import { useEffect, useState } from 'react'

type GlassProgressProps = {
  value: number
  label?: string
  className?: string
  tone?: 'default' | 'warning' | 'danger'
}

export function GlassProgress({
  value,
  label,
  className,
  tone = 'default',
}: GlassProgressProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const percent = Math.max(0, Math.min(100, Math.round(value)))

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percent), 50)
    return () => clearTimeout(timer)
  }, [percent])

  const isNearMax = percent >= 75 || tone === 'warning' || tone === 'danger'

  const progressBackground = isNearMax
    ? 'linear-gradient(90deg, #007AFF 0%, #007AFF 75%, #F43F5E 100%)'
    : 'linear-gradient(90deg, #007AFF 0%, #38BDF8 100%)'

  const glowShadow = isNearMax
    ? 'shadow-[0_0_10px_rgba(244,63,94,0.4)]'
    : 'shadow-[0_0_10px_rgba(0,122,255,0.3)]'

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full bg-glass-hover/80 border border-glass-border/50 p-[1.5px]',
        className,
      )}
    >
      <div
        style={{
          width: `${animatedWidth}%`,
          background: progressBackground,
        }}
        className={cn(
          'relative h-full rounded-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)',
          glowShadow,
        )}
      >
        {/* Subtle Frosted Shimmer Overlay */}
        <div
          className="absolute inset-0 w-full h-full opacity-30"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
            animation: 'glassShimmer 2.2s infinite ease-in-out',
          }}
        />
      </div>

      <style>{`
        @keyframes glassShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
