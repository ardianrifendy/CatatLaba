import type { ComponentType } from 'react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Plus } from 'lucide-react'
import { useGlobalActionStore } from '@/stores/action'
import { GlassToastViewport } from '@/components/ui/GlassToast'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import {
  IosChartIcon,
  IosHomeIcon,
  IosPackageIcon,
  IosReceiptIcon,
  IosSettingsIcon,
  type IosIconProps,
} from '@/components/ui/IosIcons'
import { cn } from '@/lib/cn'
import { commonText } from '@/lib/ui-text'
import { useNavStore, type TabId } from '@/stores/nav'
import { ErrorBoundary } from './ErrorBoundary'

const BerandaPage = lazy(() => import('./pages/BerandaPage').then((module) => ({ default: module.BerandaPage })))
const LaporanPage = lazy(() => import('./pages/LaporanPage').then((module) => ({ default: module.LaporanPage })))
const PengaturanPage = lazy(() => import('./pages/PengaturanPage').then((module) => ({ default: module.PengaturanPage })))
const ProdukPage = lazy(() => import('./pages/ProdukPage').then((module) => ({ default: module.ProdukPage })))
const TransaksiPage = lazy(() => import('./pages/TransaksiPage').then((module) => ({ default: module.TransaksiPage })))

interface TabDef {
  readonly id: TabId
  readonly label: string
  readonly icon: ComponentType<IosIconProps>
}

const tabs: readonly TabDef[] = [
  { id: 'beranda', label: commonText.tabs.beranda, icon: IosHomeIcon },
  { id: 'transaksi', label: commonText.tabs.transaksi, icon: IosReceiptIcon },
  { id: 'produk', label: commonText.tabs.produk, icon: IosPackageIcon },
  { id: 'laporan', label: commonText.tabs.laporan, icon: IosChartIcon },
  { id: 'pengaturan', label: commonText.tabs.pengaturan, icon: IosSettingsIcon },
]

function ActivePage({ tab }: { tab: TabId }) {
  if (tab === 'beranda') return <BerandaPage />
  if (tab === 'transaksi') return <TransaksiPage />
  if (tab === 'produk') return <ProdukPage />
  if (tab === 'laporan') return <LaporanPage />
  return <PengaturanPage />
}

function PageLoading() {
  return (
    <div className="flex h-48 w-full items-center justify-center">
      <div className="size-8 rounded-full border-2 border-accent border-t-transparent motion-safe:animate-spin" />
    </div>
  )
}

export function AppShell() {
  const activeTab = useNavStore((state) => state.activeTab)
  const setActiveTab = useNavStore((state) => state.setActiveTab)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const triggerAction = useGlobalActionStore((s) => s.triggerAction)

  const handleFabClick = () => {
    if (activeTab === 'produk') {
      triggerAction('create-product')
    } else {
      if (activeTab !== 'transaksi') {
        setActiveTab('transaksi')
      }
      triggerAction('create-transaction')
    }
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let disposed = false
    let listener: PluginListenerHandle | undefined

    void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const openDialog = document.querySelector<HTMLElement>('[role="dialog"][data-state="open"]')
      if (openDialog !== null) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
        return
      }

      const navigation = useNavStore.getState()
      if (navigation.activeTab !== 'beranda') {
        navigation.setActiveTab('beranda')
        return
      }

      if (canGoBack) {
        window.history.back()
        return
      }

      setShowExitConfirm(true)
    }).then((registeredListener) => {
      if (disposed) {
        void registeredListener.remove()
        return
      }

      listener = registeredListener
    })

    return () => {
      disposed = true
      void listener?.remove()
    }
  }, [])

  const subScreenTitle = useNavStore((s) => s.subScreenTitle)

  const showFab = activeTab === 'transaksi' || activeTab === 'produk'

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="ios-glass-nav fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-glass-border bg-glass p-6 text-foreground shadow-glass backdrop-blur-lg lg:flex">
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
                data-active={active}
                className={cn(
                  'ios-nav-item ios-pressable flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                  active
                    ? 'bg-accent/15 text-accent hover:bg-accent/20'
                    : 'text-muted-foreground hover:bg-glass-hover hover:text-foreground',
                )}
              >
                <Icon size={20} className="ios-nav-icon shrink-0" aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content column */}
      <div className="flex min-h-dvh flex-col lg:pl-64">
        {subScreenTitle === null ? (
          <header className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-2 lg:hidden">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                {commonText.appName}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {tabs.find((t) => t.id === activeTab)?.label ?? commonText.appName}
              </h1>
            </div>
          </header>
        ) : null}
        <main className="mx-auto w-full max-w-lg flex-1 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] lg:max-w-4xl lg:px-10 lg:pt-10 lg:pb-10">
          <ErrorBoundary key={activeTab} context={`page:${activeTab}`}>
            <Suspense fallback={<PageLoading />}>
              <div key={activeTab} className="ios-page-enter">
                <ActivePage tab={activeTab} />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Contextual floating action button (+), only on Transaksi & Produk */}
      {showFab ? (
        <button
          type="button"
          onClick={handleFabClick}
          aria-label={activeTab === 'produk' ? 'Tambah Produk' : 'Tambah Transaksi'}
          className="ios-pressable fixed left-1/2 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-50 flex size-14 -translate-x-1/2 items-center justify-center rounded-full border border-white/40 bg-accent text-white shadow-xl shadow-accent/40 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 lg:hidden"
        >
          <Plus className="size-7 text-white" aria-hidden="true" strokeWidth={2.5} />
        </button>
      ) : null}

      {/* Mobile floating bottom tab bar */}
      <nav
        aria-label={commonText.navLabel}
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 lg:hidden"
      >
        <div
          data-active-tab={activeTab}
          className="ios-glass-nav ios-mobile-tabbar grid grid-cols-5 items-stretch rounded-3xl border border-glass-border bg-glass-strong p-1.5 shadow-glass backdrop-blur-lg"
        >
          <span aria-hidden="true" className="ios-mobile-tab-indicator" />
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                data-active={active}
                className={cn(
                  'ios-nav-item ios-pressable relative z-10 flex min-h-[46px] flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                  active ? 'text-accent font-semibold' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={22} className="ios-nav-icon shrink-0" aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none tracking-tight">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <GlassToastViewport />

      <GlassConfirmSheet
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        title="Keluar Aplikasi"
        description="Apakah Anda yakin ingin keluar dari CatatLaba?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        destructive
        onConfirm={() => {
          setShowExitConfirm(false)
          void CapacitorApp.exitApp()
        }}
      />
    </div>
  )
}
