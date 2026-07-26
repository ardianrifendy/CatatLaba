import { ChartColumn, Home, Package, ReceiptText, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GlassToastViewport } from '@/components/ui/GlassToast'
import { cn } from '@/lib/cn'
import { commonText } from '@/lib/ui-text'
import { useNavStore, type TabId } from '@/stores/nav'
import { ErrorBoundary } from './ErrorBoundary'
import { BerandaPage } from './pages/BerandaPage'
import { LaporanPage } from './pages/LaporanPage'
import { PengaturanPage } from './pages/PengaturanPage'
import { ProdukPage } from './pages/ProdukPage'
import { TransaksiPage } from './pages/TransaksiPage'

interface TabDef {
  readonly id: TabId
  readonly label: string
  readonly icon: LucideIcon
}

const tabs: readonly TabDef[] = [
  { id: 'beranda', label: commonText.tabs.beranda, icon: Home },
  { id: 'transaksi', label: commonText.tabs.transaksi, icon: ReceiptText },
  { id: 'produk', label: commonText.tabs.produk, icon: Package },
  { id: 'laporan', label: commonText.tabs.laporan, icon: ChartColumn },
  { id: 'pengaturan', label: commonText.tabs.pengaturan, icon: Settings },
]

function ActivePage({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'beranda':
      return <BerandaPage />
    case 'transaksi':
      return <TransaksiPage />
    case 'produk':
      return <ProdukPage />
    case 'laporan':
      return <LaporanPage />
    case 'pengaturan':
      return <PengaturanPage />
  }
}

// App layout: mobile-first floating glass bottom tab bar, desktop (lg:) left
// glass sidebar. The active page is keyed into its own ErrorBoundary so a crash
// on one tab never takes down the shell, and switching tabs resets the boundary.
export function AppShell() {
  const activeTab = useNavStore((s) => s.activeTab)
  const setActiveTab = useNavStore((s) => s.setActiveTab)

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl lg:flex">
        <h1 className="px-3 text-xl font-semibold tracking-tight">{commonText.appName}</h1>
        <nav aria-label={commonText.navLabel} className="mt-8 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent/15 text-accent'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content column */}
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] lg:hidden">
          <h1 className="text-xl font-semibold tracking-tight">{commonText.appName}</h1>
        </header>
        <main className="mx-auto w-full max-w-lg flex-1 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] lg:max-w-4xl lg:px-10 lg:pt-10 lg:pb-10">
          <ErrorBoundary key={activeTab} context={`page:${activeTab}`}>
            <ActivePage tab={activeTab} />
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile floating bottom tab bar */}
      <nav
        aria-label={commonText.navLabel}
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 lg:hidden"
      >
        <div className="flex items-stretch rounded-3xl border border-white/10 bg-white/5 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-colors',
                  active ? 'text-accent' : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <GlassToastViewport />
    </div>
  )
}
