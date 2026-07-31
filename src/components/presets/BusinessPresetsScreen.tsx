import {
  Apple,
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Coffee,
  Dog,
  PackageCheck,
  Palette as PaletteIcon,
  Pill,
  Scissors,
  Search,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  Trophy,
  UtensilsCrossed,
  WashingMachine,
  Wrench,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassInput } from '@/components/ui/GlassInput'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'
import { useRepos } from '@/app/providers'
import { applyBusinessPreset, getActivePresetMetadata } from '@/lib/presets/applier'
import { BUSINESS_PRESETS, type BusinessPreset } from '@/lib/presets/business-presets'
import { toast } from '@/stores/toast'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'

interface BusinessPresetsScreenProps {
  onBack: () => void
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Smartphone,
  Sparkles,
  PackageCheck,
  Shirt,
  Coffee,
  UtensilsCrossed,
  Store,
  WashingMachine,
  Scissors,
  Wrench,
  Dog,
  Pill,
  Building2,
  Apple,
  Palette: PaletteIcon,
  Trophy,
  Briefcase,
}

import { useTranslation } from '@/lib/i18n'

export function BusinessPresetsScreen({ onBack }: BusinessPresetsScreenProps) {
  const { t } = useTranslation()
  const repos = useRepos()
  const queryClient = useQueryClient()
  const activeMeta = getActivePresetMetadata()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<BusinessPreset | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return BUSINESS_PRESETS

    return BUSINESS_PRESETS.filter((preset) => {
      const matchName = preset.name.toLowerCase().includes(q)
      const matchDesc = preset.description.toLowerCase().includes(q)
      const matchKeywords = preset.keywords.some((k) => k.toLowerCase().includes(q))
      return matchName || matchDesc || matchKeywords
    })
  }, [searchQuery])

  async function handleApply(preset: BusinessPreset) {
    setPendingId(preset.id)
    try {
      await applyBusinessPreset(repos, preset)
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      await queryClient.invalidateQueries({ queryKey: queryKeys.channels })
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets })

      toast.success(t('presetApplied'))
      setSelectedPreset(null)
    } catch {
      toast.error(t('error'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-8">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label="Kembali" onClick={onBack}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </GlassIconButton>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
            {t('businessPresets')}
          </h2>
        </div>
      </div>

      {/* Clean iOS Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
        <GlassInput
          type="text"
          placeholder={t('searchBusinessType')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-9 h-11 text-sm rounded-2xl"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Ultra Clean iOS Inset Grouped List */}
      <GlassCard className="p-0 overflow-hidden divide-y divide-glass-border/40 rounded-3xl border border-glass-border">
        {filteredPresets.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-1.5 px-4">
            <p className="text-sm font-medium text-foreground">Tidak ada preset ditemukan</p>
            <p className="text-xs text-muted-foreground">Coba kata kunci pencarian lainnya.</p>
          </div>
        ) : (
          filteredPresets.map((preset) => {
            const IconComp = ICON_MAP[preset.icon] ?? Briefcase
            const isActive = activeMeta?.id === preset.id

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset)}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-glass-hover transition-colors active:bg-glass-hover/80"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/20">
                    <IconComp className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground truncate">{preset.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-income/15 text-income text-xs font-bold border border-income/30">
                      <Check className="size-3 stroke-[3]" /> {t('active')}
                    </span>
                  ) : null}
                  <ChevronRight className="size-4 text-muted-foreground/50" />
                </div>
              </button>
            )
          })
        )}
      </GlassCard>

      {/* Preset Detail & Confirmation Sheet */}
      <GlassBottomSheet
        open={selectedPreset !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedPreset(null)
        }}
      >
        {selectedPreset ? (
          <GlassBottomSheetContent>
            <GlassBottomSheetTitle className="text-lg font-bold text-foreground mb-1">
              {selectedPreset.name}
            </GlassBottomSheetTitle>

            <div className="flex flex-col gap-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedPreset.description}
              </p>

              {/* Units */}
              <div>
                <span className="text-xs font-semibold text-foreground block mb-1.5">
                  Satuan Produk:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPreset.units.map((u) => (
                    <span
                      key={u}
                      className="px-2.5 py-0.5 text-xs font-medium rounded-xl bg-glass text-foreground border border-glass-border"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              {/* Auto-setup categories */}
              <div>
                <span className="text-xs font-semibold text-foreground block mb-1.5">
                  Kategori Auto-Setup ({selectedPreset.categories.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPreset.categories.map((c) => (
                    <span
                      key={c.name}
                      className={`px-2.5 py-0.5 rounded-xl text-xs font-medium border ${
                        c.type === 'income'
                          ? 'bg-income/10 text-income border-income/25'
                          : 'bg-expense/10 text-expense border-expense/25'
                      }`}
                    >
                      {c.type === 'income' ? '↗ ' : '↘ '}
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sales Channels */}
              <div>
                <span className="text-xs font-semibold text-foreground block mb-1.5">
                  Saluran Penjualan ({selectedPreset.channels.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPreset.channels.map((ch) => (
                    <span
                      key={ch.name}
                      className="px-2.5 py-0.5 rounded-xl bg-glass text-muted-foreground text-xs font-medium border border-glass-border"
                    >
                      {ch.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col gap-2">
                <GlassButton
                  variant="primary"
                  disabled={pendingId === selectedPreset.id}
                  onClick={() => void handleApply(selectedPreset)}
                  className="w-full h-12 text-sm font-bold"
                >
                  {pendingId === selectedPreset.id
                    ? t('applyingPreset')
                    : activeMeta?.id === selectedPreset.id
                      ? t('useThisPreset')
                      : t('useThisPreset')}
                </GlassButton>

                <GlassButton
                  variant="ghost"
                  onClick={() => setSelectedPreset(null)}
                  className="w-full h-10 text-xs font-medium text-muted-foreground"
                >
                  {t('cancel')}
                </GlassButton>
              </div>
            </div>
          </GlassBottomSheetContent>
        ) : null}
      </GlassBottomSheet>
    </section>
  )
}
