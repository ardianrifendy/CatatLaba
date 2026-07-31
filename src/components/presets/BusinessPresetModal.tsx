import {
  Apple,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Coffee,
  Dog,
  Filter,
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
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { useRepos } from '@/app/providers'
import { applyBusinessPreset, getActivePresetMetadata } from '@/lib/presets/applier'
import { BUSINESS_PRESETS, type BusinessPreset, type PresetGroup } from '@/lib/presets/business-presets'
import { toast } from '@/stores/toast'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'

interface BusinessPresetModalProps {
  isOpen: boolean
  onClose: () => void
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

const GROUP_LABELS: Record<PresetGroup | 'all', string> = {
  all: 'Semua',
  retail: 'Retail & Toko',
  fnb: 'Kuliner (F&B)',
  service: 'Jasa & Servis',
  online: 'Online & Dropship',
  general: 'Umum',
}

export function BusinessPresetModal({ isOpen, onClose }: BusinessPresetModalProps) {
  const repos = useRepos()
  const queryClient = useQueryClient()
  const activeMeta = getActivePresetMetadata()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<PresetGroup | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return BUSINESS_PRESETS.filter((preset) => {
      const matchGroup = selectedGroup === 'all' || preset.group === selectedGroup
      if (!matchGroup) return false
      if (!q) return true

      const matchName = preset.name.toLowerCase().includes(q)
      const matchDesc = preset.description.toLowerCase().includes(q)
      const matchKeywords = preset.keywords.some((k) => k.toLowerCase().includes(q))
      return matchName || matchDesc || matchKeywords
    })
  }, [searchQuery, selectedGroup])

  async function handleApply(preset: BusinessPreset) {
    setPendingId(preset.id)
    try {
      const result = await applyBusinessPreset(repos, preset)
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      await queryClient.invalidateQueries({ queryKey: queryKeys.channels })
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets })

      toast.success(
        `Preset "${preset.name}" berhasil diterapkan! (+${result.addedCategories} Kategori, +${result.addedChannels} Saluran)`,
      )
      onClose()
    } catch {
      toast.error('Gagal menerapkan preset. Silakan coba lagi.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <GlassBottomSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <GlassBottomSheetContent
        aria-describedby={undefined}
        className="max-w-xl max-h-[85vh] flex flex-col p-4 sm:p-6"
      >
        {/* Title Header */}
        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Sparkles className="size-5" />
            </div>
            <div>
              <GlassBottomSheetTitle className="text-base font-semibold text-foreground">
                Preset Jenis Usaha
              </GlassBottomSheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Konfigurasi otomatis kategori & saluran untuk jenis usaha Anda
              </p>
            </div>
          </div>
          <GlassIconButton
            aria-label="Tutup"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </GlassIconButton>
        </div>

        {/* Search & Group Filters */}
        <div className="flex flex-col gap-3 mb-4 shrink-0">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
            <GlassInput
              type="text"
              placeholder="Cari jenis usaha (parfum, konter hp, laundry)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-11"
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

          {/* Group Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'retail', 'fnb', 'service', 'online', 'general'] as const).map((group) => {
              const active = selectedGroup === group
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={`ios-pressable px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors border ${
                    active
                      ? 'bg-accent text-white border-accent font-semibold'
                      : 'bg-glass border-glass-border text-muted-foreground hover:bg-glass-hover hover:text-foreground'
                  }`}
                >
                  {GROUP_LABELS[group]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preset Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
          {filteredPresets.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-glass border border-glass-border text-muted-foreground">
                <Filter className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Preset tidak ditemukan</p>
              <p className="text-xs text-muted-foreground">
                Coba gunakan kata kunci pencarian yang berbeda.
              </p>
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const IconComp = ICON_MAP[preset.icon] ?? Briefcase
              const isExpanded = expandedId === preset.id
              const isActive = activeMeta?.id === preset.id
              const isPending = pendingId === preset.id

              return (
                <GlassCard
                  key={preset.id}
                  className={`p-4 transition-colors ${
                    isActive ? 'border-accent ring-1 ring-accent/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent mt-0.5">
                      <IconComp className="size-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{preset.name}</h4>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-income/15 text-income text-[10px] font-semibold border border-income/30">
                            <Check className="size-3 stroke-[3]" /> Aktif
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {preset.description}
                      </p>

                      {/* Satuan list */}
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <span className="text-[11px] font-medium text-muted-foreground">Satuan:</span>
                        {preset.units.map((u) => (
                          <span
                            key={u}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-glass-strong text-foreground border border-glass-border"
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Setup Details */}
                  {isExpanded ? (
                    <div className="mt-3 pt-3 border-t border-glass-border text-xs space-y-3">
                      <div>
                        <span className="font-medium text-foreground block mb-1.5">
                          Kategori Pemasukan & Pengeluaran ({preset.categories.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {preset.categories.map((c) => (
                            <span
                              key={c.name}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
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

                      <div>
                        <span className="font-medium text-foreground block mb-1.5">
                          Saluran Penjualan ({preset.channels.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {preset.channels.map((ch) => (
                            <span
                              key={ch.name}
                              className="px-2 py-0.5 rounded-lg bg-glass-strong text-foreground-subtle text-[11px] font-medium border border-glass-border"
                            >
                              {ch.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Card Actions */}
                  <div className="mt-3 pt-3 border-t border-glass-border flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : preset.id)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Sembunyikan' : 'Rincian Setup'}</span>
                      <ChevronRight
                        className={`size-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>

                    <GlassButton
                      variant={isActive ? 'ghost' : 'primary'}
                      disabled={isPending}
                      onClick={() => void handleApply(preset)}
                      className="h-9 px-3.5 text-xs font-medium"
                    >
                      {isPending ? 'Menerapkan...' : isActive ? 'Terapkan Ulang' : 'Terapkan Preset'}
                    </GlassButton>
                  </div>
                </GlassCard>
              )
            })
          )}
        </div>
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}
