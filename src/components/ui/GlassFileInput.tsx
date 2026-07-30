import { Upload } from 'lucide-react'
import { cn } from '@/lib/cn'

interface GlassFileInputProps {
  accept: string
  label?: string
  disabled?: boolean
  className?: string
  onChange: (file: File | null) => void
}

export function GlassFileInput({ accept, label = 'Impor backup', disabled = false, className, onChange }: GlassFileInputProps) {
  return (
    <label
      className={cn(
        'ios-pressable flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-glass-border/60 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 px-4 text-sm font-semibold text-foreground transition-all shadow-sm active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <Upload className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span>{label}</span>
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
