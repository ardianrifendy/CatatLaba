import { useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { controlsText } from '@/lib/ui-text/controls'
import { GlassInput } from '@/components/ui/GlassInput'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
  GlassBottomSheetTrigger,
} from '@/components/ui/GlassBottomSheet'

export interface GlassSelectOption {
  value: string
  label: string
  hint?: string
  icon?: ReactNode
}

type GlassSelectProps = {
  id?: string
  value: string | null
  onChange: (value: string) => void
  options: GlassSelectOption[]
  placeholder: string
  title: string
  searchable?: boolean
  disabled?: boolean
  error?: boolean
}

/**
 * Sheet-based picker — never a native <select>. The trigger looks like a
 * GlassInput; tapping it opens a bottom sheet listing the options, with an
 * optional case-insensitive search filter.
 */
export function GlassSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  title,
  searchable = false,
  disabled = false,
  error = false,
}: GlassSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find((option) => option.value === value) ?? null
  const query = search.trim().toLowerCase()
  const filtered =
    query === ''
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(query))

  function handleOpenChange(nextOpen: boolean): void {
    setOpen(nextOpen)
    // Reset the filter so the sheet reopens showing every option.
    if (!nextOpen) setSearch('')
  }

  function handleSelect(optionValue: string): void {
    onChange(optionValue)
    handleOpenChange(false)
  }

  return (
    <GlassBottomSheet open={open} onOpenChange={handleOpenChange}>
      <GlassBottomSheetTrigger
        id={id}
        type="button"
        disabled={disabled}
        className={cn(
          // Mirror GlassInput so the trigger reads as a form field.
          'ios-pressable flex h-11 w-full items-center gap-2 rounded-2xl border border-glass-border bg-glass px-4 text-left text-sm text-foreground transition-colors hover:bg-glass-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          'disabled:pointer-events-none disabled:opacity-50',
          error && 'border-expense',
        )}
      >
        {selected ? (
          <>
            {selected.icon !== undefined ? (
              <span
                aria-hidden
                className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
              >
                {selected.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{selected.label}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {placeholder}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </GlassBottomSheetTrigger>

      <GlassBottomSheetContent aria-describedby={undefined}>
        <GlassBottomSheetTitle className="mb-4 text-base font-medium text-foreground">
          {title}
        </GlassBottomSheetTitle>

        {searchable ? (
          <GlassInput
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={controlsText.search}
            autoComplete="off"
            className="mb-3"
          />
        ) : null}

        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {controlsText.noResults}
          </p>
        ) : (
          <div
            role="listbox"
            aria-label={title}
            className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto"
          >
            {filtered.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'ios-pressable flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-glass-hover',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    isSelected && 'bg-glass-strong',
                  )}
                >
                  {option.icon !== undefined ? (
                    <span
                      aria-hidden
                      className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
                    >
                      {option.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint !== undefined ? (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {option.hint}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <Check aria-hidden className="size-4 shrink-0 text-accent" />
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}
