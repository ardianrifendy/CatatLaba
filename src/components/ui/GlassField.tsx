import type { ReactNode } from 'react'

type GlassFieldProps = {
  label: string
  htmlFor?: string
  error?: string | null
  hint?: string
  children: ReactNode
}

export function GlassField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: GlassFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {/*
        Persistent live region so screen readers announce validation errors as
        they appear; `empty:hidden` removes it from layout while there is none.
      */}
      <p aria-live="polite" className="mt-1.5 text-xs text-expense empty:hidden">
        {error}
      </p>
      {hint !== undefined && !error ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
