import { Laptop, Moon, Sun } from 'lucide-react'
import { GlassSegmented, type GlassSegmentedOption } from '@/components/ui/GlassSegmented'
import { cn } from '@/lib/cn'
import { commonText } from '@/lib/ui-text'
import { useThemeStore } from '@/stores/theme'
import type { ThemeMode } from '@/stores/theme'

const themeOptions: ReadonlyArray<GlassSegmentedOption<ThemeMode>> = [
  { value: 'system', label: commonText.theme.modes.system, icon: <Laptop className="size-4" /> },
  { value: 'light', label: commonText.theme.modes.light, icon: <Sun className="size-4" /> },
  { value: 'dark', label: commonText.theme.modes.dark, icon: <Moon className="size-4" /> },
]

type ThemeSelectorProps = {
  className?: string
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  return (
    <div className={cn('grid gap-3.5', className)}>
      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-foreground">{commonText.theme.title}</h3>
        <p className="text-xs font-normal text-muted-foreground">{commonText.theme.description}</p>
      </div>
      <GlassSegmented
        value={mode}
        onChange={setMode}
        options={themeOptions}
        aria-label={commonText.theme.selectorLabel}
      />
    </div>
  )
}
