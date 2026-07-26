import { ArrowDownUp, ChevronRight, Cloud, Repeat, Store, Tags, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { CategoriesScreen } from '@/features/categories/CategoriesScreen'
import { ChannelsScreen } from '@/features/channels/ChannelsScreen'
import { WalletsScreen } from '@/features/wallets/WalletsScreen'
import { categoriesText, channelsText, commonText, walletsText } from '@/lib/ui-text'

type SubScreen = null | 'wallets' | 'categories' | 'channels'

interface SettingsRowProps {
  icon: LucideIcon
  label: string
  onClick: () => void
}

function SettingsRow({ icon: Icon, label, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Inset ring: the parent GlassCard is overflow-hidden, so an outset
      // ring/outline would be clipped.
      className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <Icon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
    </button>
  )
}

interface DisabledRowProps {
  icon: LucideIcon
  label: string
}

function DisabledRow({ icon: Icon, label }: DisabledRowProps) {
  return (
    <div aria-disabled="true" className="flex min-h-14 w-full items-center gap-3 px-5 py-3 opacity-50">
      <Icon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs font-light text-zinc-500">{commonText.actions.comingSoon}</span>
    </div>
  )
}

export function PengaturanPage() {
  const [subScreen, setSubScreen] = useState<SubScreen>(null)

  if (subScreen === 'wallets') return <WalletsScreen onBack={() => setSubScreen(null)} />
  if (subScreen === 'categories') return <CategoriesScreen onBack={() => setSubScreen(null)} />
  if (subScreen === 'channels') return <ChannelsScreen onBack={() => setSubScreen(null)} />

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{commonText.tabs.pengaturan}</h2>
      <GlassCard className="divide-y divide-white/5 overflow-hidden">
        <SettingsRow icon={Wallet} label={walletsText.title} onClick={() => setSubScreen('wallets')} />
        <SettingsRow icon={Tags} label={categoriesText.title} onClick={() => setSubScreen('categories')} />
        <SettingsRow icon={Store} label={channelsText.title} onClick={() => setSubScreen('channels')} />
      </GlassCard>
      <GlassCard className="divide-y divide-white/5 overflow-hidden">
        <DisabledRow icon={Repeat} label={commonText.settings.recurring} />
        <DisabledRow icon={Cloud} label={commonText.settings.accountSync} />
        <DisabledRow icon={ArrowDownUp} label={commonText.settings.exportImport} />
      </GlassCard>
    </section>
  )
}
