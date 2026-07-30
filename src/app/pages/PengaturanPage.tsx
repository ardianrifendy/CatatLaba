import { ArrowLeft, ChevronRight, Cloud, Download, LogOut, Palette, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassField } from '@/components/ui/GlassField'
import { GlassFileInput } from '@/components/ui/GlassFileInput'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { ThemeSelector } from '@/components/ThemeSelector'
import { CategoriesScreen } from '@/features/categories/CategoriesScreen'
import { ChannelsScreen } from '@/features/channels/ChannelsScreen'
import { WalletsScreen } from '@/features/wallets/WalletsScreen'
import { RecurringScreen } from '@/features/recurring/RecurringScreen'
import { categoriesText, channelsText, commonText, walletsText } from '@/lib/ui-text'
import {
  IosPackageIcon,
  IosReceiptIcon,
  IosScaleIcon,
  IosWalletIcon,
} from '@/components/ui/IosIcons'
import { useNavStore } from '@/stores/nav'
import { useThemeStore } from '@/stores/theme'
import { useSync, useSyncSnapshot } from '@/app/providers'
import { getContext } from '@/db/local'
import { exportBackup, importBackup } from '@/lib/sync/backup'
import { exportJsonFile } from '@/lib/sync/file-export'
import { queryKeys } from '@/lib/query'
import { toast } from '@/stores/toast'

type SubScreen = null | 'wallets' | 'categories' | 'channels' | 'recurring' | 'sync' | 'backup' | 'theme'

interface SettingsRowProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  badge?: string
  onClick: () => void
}

function SettingsRow({ icon: Icon, label, badge, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ios-pressable flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
        <Icon size={18} className="shrink-0" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-foreground truncate">{label}</span>
      </div>
      {badge ? (
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[140px]">{badge}</span>
      ) : null}
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </button>
  )
}

/* Subscreen: Sinkronisasi Cloud */
function SyncSubScreen({ onBack }: { onBack: () => void }) {
  const sync = useSync()
  const snapshot = useSyncSnapshot()
  const queryClient = useQueryClient()
  const text = commonText.settings.sync

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>): Promise<void> {
    setPending(true)
    setError(null)
    try {
      await action()
      await queryClient.invalidateQueries()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.cloudActionFailed)
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (mode === 'signin') {
      void run(() => sync.signIn(identifier, password))
    } else {
      void run(async () => {
        const signedIn = await sync.signUp(identifier, password, fullName, phone)
        if (!signedIn) toast.success(text.emailConfirmation)
      })
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label="Kembali" onClick={onBack}>
          <ArrowLeft aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
        <h2 className="flex-1 truncate text-lg font-bold tracking-tight text-foreground">
          Sinkronisasi Cloud
        </h2>
      </div>

      <GlassCard className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
            <Cloud className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">{text.title}</p>
            <p className="text-xs font-normal text-muted-foreground">
              {statusText(snapshot.status, snapshot.lastSyncedAt, snapshot.message)}
            </p>
          </div>
        </div>

        {snapshot.status === 'offline' ? (
          <div className="p-4 rounded-2xl bg-glass-hover border border-glass-border/40 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">Penyimpanan Lokal (Offline-First)</p>
            <p className="mt-1">
              Supabase belum dikonfigurasi. Seluruh data transaksi Anda tersimpan dengan aman di HP secara lokal.
            </p>
          </div>
        ) : snapshot.session ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              {text.signedInAs} <span className="font-semibold text-foreground">{snapshot.session.email ?? text.accountFallback}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <GlassButton variant="ghost" disabled={pending || snapshot.status === 'syncing'} onClick={() => void run(async () => { await sync.syncNow() })}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> {text.syncNow}
              </GlassButton>
              <GlassButton variant="ghost" disabled={pending} onClick={() => void run(() => sync.signOut())}>
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" /> {text.signOut}
              </GlassButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Mode Switcher */}
            <GlassSegmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'signin', label: 'Masuk Akun' },
                { value: 'signup', label: 'Daftar Baru' },
              ]}
              aria-label="Mode Akun"
            />

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <>
                  <GlassField label="Nama Lengkap" htmlFor="sync-fullname">
                    <GlassInput
                      id="sync-fullname"
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </GlassField>

                  <GlassField label="Nomor Telepon (WhatsApp)" htmlFor="sync-phone">
                    <GlassInput
                      id="sync-phone"
                      type="tel"
                      placeholder="Contoh: 08123456789"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </GlassField>
                </>
              ) : null}

              <GlassField
                label={mode === 'signin' ? 'Email atau Nomor Telepon' : 'Alamat Email'}
                htmlFor="sync-identifier"
              >
                <GlassInput
                  id="sync-identifier"
                  type={mode === 'signin' ? 'text' : 'email'}
                  placeholder={mode === 'signin' ? 'contoh@email.com / 08123456789' : 'contoh@email.com'}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete={mode === 'signin' ? 'username' : 'email'}
                  required
                />
              </GlassField>

              <GlassField label="Kata Sandi / Password" htmlFor="sync-password">
                <GlassInput
                  id="sync-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                />
              </GlassField>

              {error ? <p className="text-xs font-normal text-expense">{error}</p> : null}

              <div className="flex flex-col gap-2 mt-2">
                <GlassButton type="submit" variant="primary" disabled={pending} className="w-full h-11">
                  {mode === 'signin' ? 'Masuk' : 'Daftar Baru'}
                </GlassButton>

                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
                >
                  {mode === 'signin'
                    ? 'Belum punya akun? Klik untuk Daftar Baru'
                    : 'Sudah punya akun? Klik untuk Masuk'}
                </button>
              </div>
            </form>
          </div>
        )}
      </GlassCard>
    </section>
  )
}

/* Subscreen: Backup & Impor Data */
function BackupSubScreen({ onBack }: { onBack: () => void }) {
  const sync = useSync()
  const queryClient = useQueryClient()
  const text = commonText.settings.sync

  function downloadBackup(): void {
    void exportBackup(getContext()).then((backup) => {
      const fileName = `catatlaba-backup-${backup.exportedAt.slice(0, 10)}.json`
      return exportJsonFile({ fileName, json: JSON.stringify(backup, null, 2) })
    }).then(() => {
      toast.success(text.exportedBackupSuccess)
    }).catch(() => toast.error(text.exportBackupFailed))
  }

  function uploadBackup(file: File | null): void {
    if (!file) return
    void file.text().then((content) => importBackup(getContext(), content)).then(async (count) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets })
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      await queryClient.invalidateQueries({ queryKey: queryKeys.channels })
      await queryClient.invalidateQueries({ queryKey: queryKeys.products })
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recurring })
      sync.schedule()
      toast.success(text.importedBackupSuccess(count))
    }).catch((cause: unknown) => toast.error(cause instanceof Error ? cause.message : text.importBackupFailed))
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label="Kembali" onClick={onBack}>
          <ArrowLeft aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
        <h2 className="flex-1 truncate text-lg font-bold tracking-tight text-foreground">
          Backup & Impor Data
        </h2>
      </div>

      <GlassCard className="p-5 flex flex-col gap-4">
        <div>
          <p className="text-base font-semibold text-foreground">{text.backupTitle}</p>
          <p className="text-xs font-normal text-muted-foreground mt-1 leading-relaxed">
            {text.backupDescription}
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <GlassButton variant="primary" className="w-full text-sm h-12" onClick={downloadBackup}>
            <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Ekspor Backup JSON
          </GlassButton>
          <div className="w-full">
            <GlassFileInput accept="application/json,.json" label={text.importBackup} onChange={uploadBackup} />
          </div>
        </div>
      </GlassCard>
    </section>
  )
}

/* Subscreen: Tema Tampilan */
function ThemeSubScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label="Kembali" onClick={onBack}>
          <ArrowLeft aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
        <h2 className="flex-1 truncate text-lg font-bold tracking-tight text-foreground">
          Tema Tampilan
        </h2>
      </div>

      <GlassCard className="p-5 flex flex-col gap-4">
        <div>
          <p className="text-base font-semibold text-foreground">Pilihan Tema</p>
          <p className="text-xs font-normal text-muted-foreground mt-1">
            Gunakan tema sistem perangkat Anda atau atur tampilan secara manual.
          </p>
        </div>
        <div className="mt-2">
          <ThemeSelector />
        </div>
      </GlassCard>
    </section>
  )
}

export function PengaturanPage() {
  const [subScreen, setSubScreenState] = useState<SubScreen>(null)
  const setSubScreenTitle = useNavStore((s) => s.setSubScreenTitle)
  const themeMode = useThemeStore((s) => s.mode)
  const snapshot = useSyncSnapshot()

  function openSub(screen: SubScreen, title: string | null) {
    setSubScreenTitle(title)
    setSubScreenState(screen)
  }

  function closeSub() {
    setSubScreenTitle(null)
    setSubScreenState(null)
  }

  const themeLabel =
    themeMode === 'light'
      ? commonText.theme.modes.light
      : themeMode === 'dark'
        ? commonText.theme.modes.dark
        : commonText.theme.modes.system

  const cloudBadge =
    snapshot.status === 'offline'
      ? 'Belum dikonfigurasi'
      : snapshot.session
        ? snapshot.session.email ?? 'Tersambung'
        : 'Belum masuk'

  if (subScreen !== null) {
    return (
      <div key={subScreen} className="ios-subscreen-enter">
        {subScreen === 'wallets' && <WalletsScreen onBack={closeSub} />}
        {subScreen === 'categories' && <CategoriesScreen onBack={closeSub} />}
        {subScreen === 'channels' && <ChannelsScreen onBack={closeSub} />}
        {subScreen === 'recurring' && <RecurringScreen onBack={closeSub} />}
        {subScreen === 'sync' && <SyncSubScreen onBack={closeSub} />}
        {subScreen === 'backup' && <BackupSubScreen onBack={closeSub} />}
        {subScreen === 'theme' && <ThemeSubScreen onBack={closeSub} />}
      </div>
    )
  }

  return (
    <div key="main-settings" className="ios-subscreen-enter">
      <section className="flex flex-col gap-6">
        {/* Section 1: Kelola Data */}
        <div className="flex flex-col gap-2">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kelola Data
          </span>
          <GlassCard className="divide-y divide-glass-border/60 overflow-hidden">
            <SettingsRow icon={IosWalletIcon} label={walletsText.title} onClick={() => openSub('wallets', walletsText.title)} />
            <SettingsRow icon={IosPackageIcon} label={categoriesText.title} onClick={() => openSub('categories', categoriesText.title)} />
            <SettingsRow icon={IosReceiptIcon} label={channelsText.title} onClick={() => openSub('channels', channelsText.title)} />
            <SettingsRow icon={IosScaleIcon} label={commonText.settings.recurring} onClick={() => openSub('recurring', commonText.settings.recurring)} />
          </GlassCard>
        </div>

        {/* Section 2: Sinkronisasi & Backup */}
        <div className="flex flex-col gap-2">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Awan & Cadangan
          </span>
          <GlassCard className="divide-y divide-glass-border/60 overflow-hidden">
            <SettingsRow
              icon={Cloud}
              label="Sinkronisasi Cloud"
              badge={cloudBadge}
              onClick={() => openSub('sync', 'Sinkronisasi Cloud')}
            />
            <SettingsRow
              icon={Download}
              label="Backup & Impor Data"
              badge="JSON File"
              onClick={() => openSub('backup', 'Backup & Impor Data')}
            />
          </GlassCard>
        </div>

        {/* Section 3: Tampilan */}
        <div className="flex flex-col gap-2">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tampilan & Tema
          </span>
          <GlassCard className="divide-y divide-glass-border/60 overflow-hidden">
            <SettingsRow
              icon={Palette}
              label="Tema Tampilan"
              badge={themeLabel}
              onClick={() => openSub('theme', 'Tema Tampilan')}
            />
          </GlassCard>
        </div>
      </section>
    </div>
  )
}

function statusText(status: string, lastSyncedAt: string | null, message: string | null): string {
  if (message) return message
  if (status === 'syncing') return commonText.settings.sync.syncing
  if (status === 'idle' && lastSyncedAt) {
    const formatted = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(lastSyncedAt))
    return `${commonText.settings.sync.lastSyncedAt} ${formatted}.`
  }
  if (status === 'signed_out') return commonText.settings.sync.signedOut
  return commonText.settings.sync.ready
}
