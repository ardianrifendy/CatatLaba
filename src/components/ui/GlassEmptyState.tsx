import type { ReactNode } from 'react'

type GlassEmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function GlassEmptyState({
  icon,
  title,
  description,
  action,
}: GlassEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon !== undefined ? (
        <div
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400"
        >
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-zinc-100">{title}</p>
        {description !== undefined ? (
          <p className="text-sm font-light text-zinc-400">{description}</p>
        ) : null}
      </div>
      {action !== undefined ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
