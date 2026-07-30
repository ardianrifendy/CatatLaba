import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type GlassSegmentedOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
}

type GlassSegmentedProps<T extends string> = {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<GlassSegmentedOption<T>>
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

/**
 * Segmented control (e.g. Pemasukan / Pengeluaran / Transfer). Radiogroup
 * semantics with roving tabindex + arrow-key selection; equal-width segments.
 */
export function GlassSegmented<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  'aria-label': ariaLabel,
  className,
}: GlassSegmentedProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const tabbableIndex = activeIndex === -1 ? 0 : activeIndex

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0) return
    let delta: number
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      delta = 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      delta = -1
    } else {
      return
    }
    event.preventDefault()
    const nextIndex = (tabbableIndex + delta + options.length) % options.length
    const nextOption = options[nextIndex]
    if (nextOption === undefined) return
    if (nextOption.value !== value) onChange(nextOption.value)
    buttonRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative w-full grid auto-cols-fr grid-flow-col gap-1.5 rounded-2xl border border-glass-border/70 bg-glass/60 p-1.5 backdrop-blur-xl shadow-glass overflow-hidden',
        className,
      )}
    >
      {/* Liquid Glass Sliding Active Indicator Pill */}
      {options.length > 0 && activeIndex >= 0 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-xl bg-accent shadow-md shadow-accent/35 backdrop-blur-md transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `calc((100% - 0.75rem - ${(options.length - 1) * 0.375}rem) / ${options.length})`,
            left: '0.375rem',
            transform: `translate3d(calc(${activeIndex} * (100% + 0.375rem)), 0, 0)`,
          }}
        />
      ) : null}

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
            onClick={() => {
              if (!active) onChange(option.value)
            }}
            className={cn(
              'ios-pressable relative z-10 flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              'disabled:pointer-events-none disabled:opacity-50',
              active
                ? 'text-white font-bold'
                : 'text-muted-foreground hover:bg-glass-hover hover:text-foreground font-semibold',
            )}
          >
            {option.icon !== undefined ? (
              <span className="shrink-0">{option.icon}</span>
            ) : null}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
