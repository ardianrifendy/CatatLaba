import { Laptop, Moon, Sun, Check } from 'lucide-react'
import { GlassSegmented, type GlassSegmentedOption } from '@/components/ui/GlassSegmented'
import { cn } from '@/lib/cn'
import { commonText } from '@/lib/ui-text'
import { useThemeStore, ACCENT_PRESETS, type ThemeMode } from '@/stores/theme'

import { useLanguageStore } from '@/stores/language'

const themeOptions: ReadonlyArray<GlassSegmentedOption<ThemeMode>> = [
  { value: 'system', label: commonText.theme.modes.system, icon: <Laptop className="size-4" /> },
  { value: 'light', label: commonText.theme.modes.light, icon: <Sun className="size-4" /> },
  { value: 'dark', label: commonText.theme.modes.dark, icon: <Moon className="size-4" /> },
]

type ThemeSelectorProps = {
  className?: string
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const lang = useLanguageStore((state) => state.lang)
  const isEn = lang === 'en'
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)
  const accent = useThemeStore((state) => state.accent)
  const setAccent = useThemeStore((state) => state.setAccent)

  return (
    <div className={cn('grid gap-6', className)}>
      <div className="grid gap-3.5">
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

      <div className="grid gap-3">
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold text-foreground">
            {isEn ? 'Display Accent Color' : 'Warna Aksen Tampilan'}
          </h3>
          <p className="text-xs font-normal text-muted-foreground">
            {isEn ? 'Select primary highlight color for Light & Dark themes.' : 'Pilih warna sorotan utama untuk tema Terang & Gelap.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected = accent === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setAccent(preset.id)}
                className={cn(
                  'ios-pressable flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all',
                  isSelected
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-glass-border bg-glass hover:bg-glass-hover'
                )}
              >
                <div
                  className="size-5 rounded-full shrink-0 flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check className="size-3 text-white" />}
                </div>
                <span className="text-xs font-semibold text-foreground truncate">{preset.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
