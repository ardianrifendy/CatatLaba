import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

type GlassSegmentedProps<T extends string> = {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  disabled?: boolean
  'aria-label'?: string
}

/**
 * Segmented control (e.g. Pemasukan / Pengeluaran / Transfer). Radiogroup
 * semantics with roving tabindex + arrow-key selection; equal-width segments.
 * Container p-1 + h-9 segments = 44px total; each segment's before: pseudo
 * stretches its hit area over the full 44px band without changing visuals.
 */
export function GlassSegmented<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  'aria-label': ariaLabel,
}: GlassSegmentedProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  const activeIndex = options.findIndex((option) => option.value === value)
  // Roving tabindex: only the active segment is tabbable (first one when no
  // segment matches `value`), per the WAI-ARIA radio-group pattern.
  const tabbableIndex = activeIndex === -1 ? 0 : activeIndex

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0) return
    let delta: number
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      delta = 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      delta = -1
    } else {
      // Space/Enter keep native button activation (onClick).
      return
    }
    event.preventDefault()
    const nextIndex = (tabbableIndex + delta + options.length) % options.length
    const nextOption = options[nextIndex]
    if (nextOption === undefined) return
    // Arrow keys both select and move DOM focus (roving focus).
    if (nextOption.value !== value) onChange(nextOption.value)
    buttonRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl"
    >
      {options.map((option, index) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              buttonRefs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            tabIndex={index === tabbableIndex ? 0 : -1}
            // Radio semantics: re-activating the checked segment is a no-op.
            onClick={() => {
              if (!active) onChange(option.value)
            }}
            className={cn(
              'h-9 rounded-xl px-2 text-sm font-medium transition-colors',
              // Invisible band extending the tap target to the container's
              // full 44px height (h-9 segment + p-1 container padding).
              "relative before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              'disabled:pointer-events-none disabled:opacity-50',
              active ? 'bg-accent text-white' : 'text-zinc-300 hover:bg-white/5',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
