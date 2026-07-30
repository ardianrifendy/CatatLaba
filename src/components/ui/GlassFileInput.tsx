import { Upload } from 'lucide-react'
import { cn } from '@/lib/cn'

interface GlassFileInputProps {
  accept: string
  label?: string
  disabled?: boolean
  onChange: (file: File | null) => void
}

export function GlassFileInput({ accept, label = 'Impor backup', disabled = false, onChange }: GlassFileInputProps) {
  return (
    <label
      className={cn(
        'ios-pressable inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-glass-border bg-glass px-4 text-sm font-medium transition-colors hover:bg-glass-hover focus-within:ring-2 focus-within:ring-accent disabled:pointer-events-none disabled:opacity-50',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {label}
      <input
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
      />
    </label>
  )
}
