import { ArrowLeft, ChevronRight, Cloud, Database, Download, Eye, EyeOff, LogOut, Palette, RefreshCw, Shield, Globe, Check, Info } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassField } from '@/components/ui/GlassField'
import { GlassFileInput } from '@/components/ui/GlassFileInput'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSegmented } from '@/components/ui/GlassSegmented'
import { ThemeSelector } from '@/components/ThemeSelector'
import { CloudflareTurnstile } from '@/components/security/CloudflareTurnstile'
import { CategoriesScreen } from '@/features/categories/CategoriesScreen'
import { ChannelsScreen } from '@/features/channels/ChannelsScreen'
import { WalletsScreen } from '@/features/wallets/WalletsScreen'
import { RecurringScreen } from '@/features/recurring/RecurringScreen'
import { SecuritySubScreen } from '@/app/pages/subscreens/SecuritySubScreen'
import { useSecurityStore } from '@/stores/security'
import { useLanguageStore, LANGUAGES } from '@/stores/language'
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

type SubScreen = null | 'wallets' | 'categories' | 'channels' | 'recurring' | 'sync' | 'backup' | 'theme' | 'security' | 'language' | 'about'

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(identifier.trim())) {
        setError('Format alamat email tidak valid (contoh: nama@email.com).')
        return
      }
      if (password.length < 8) {
        setError('Kata sandi wajib minimal 8 karakter.')
        return
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok. Pastikan mengisi kata sandi yang sama.')
        return
      }
      void run(async () => {
        const signedIn = await sync.signUp(identifier, password, fullName, phone, captchaToken ?? undefined)
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

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => sync.signInWithGoogle()}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-foreground border border-glass-border font-semibold text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{mode === 'signin' ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass-border/40" />
              </div>
              <span className="relative bg-background/80 backdrop-blur-md px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                atau {mode === 'signin' ? 'email / no hp' : 'email'}
              </span>
            </div>

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
                <div className="relative flex items-center">
                  <GlassInput
                    id="sync-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </GlassField>

              {mode === 'signup' ? (
                <GlassField label="Konfirmasi Kata Sandi" htmlFor="sync-confirm-password">
                  <div className="relative flex items-center">
                    <GlassInput
                      id="sync-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Ketik ulang kata sandi Anda"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </GlassField>
              ) : null}

              {error ? <p className="text-xs font-normal text-expense">{error}</p> : null}

              {mode === 'signup' ? (
                <CloudflareTurnstile
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              ) : null}

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

      <GlassCard className="p-5 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
            <Database className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">{text.backupTitle}</p>
            <p className="text-xs font-normal text-muted-foreground mt-0.5 leading-relaxed">
              Export menyimpan semua data, termasuk data yang diarsipkan.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <GlassButton variant="primary" className="w-full text-sm font-semibold h-12 rounded-xl" onClick={downloadBackup}>
            <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Ekspor Backup JSON
          </GlassButton>
          
          <GlassFileInput accept="application/json,.json" label={text.importBackup} onChange={uploadBackup} />
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

/* Subscreen: Bahasa Aplikasi */
function LanguageSubScreen({ onBack }: { onBack: () => void }) {
  const currentLang = useLanguageStore((s) => s.lang)
  const setLang = useLanguageStore((s) => s.setLang)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label="Kembali" onClick={onBack}>
          <ArrowLeft aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
        <h2 className="flex-1 truncate text-lg font-bold tracking-tight text-foreground">
          Bahasa Aplikasi
        </h2>
      </div>

      <GlassCard className="p-5 flex flex-col gap-4">
        <div>
          <p className="text-base font-semibold text-foreground">Pilih Bahasa</p>
          <p className="text-xs font-normal text-muted-foreground mt-1">
            Pilih bahasa utama untuk antarmuka pengguna aplikasi.
          </p>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          {LANGUAGES.map((item) => {
            const isSelected = currentLang === item.code
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLang(item.code)
                  toast.success(`Bahasa diubah ke ${item.label}`)
                }}
                className={`ios-pressable flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-accent/40 bg-accent/10 text-accent font-semibold'
                    : 'border-glass-border bg-glass/40 hover:bg-glass-hover text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.flag}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-accent" />}
              </button>
            )
          })}
        </div>
      </GlassCard>
    </section>
  )
}

/* Subscreen: Tentang Aplikasi */
function AboutSubScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label="Kembali" onClick={onBack}>
          <ArrowLeft aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
        <h2 className="flex-1 truncate text-lg font-bold tracking-tight text-foreground">
          Tentang Aplikasi
        </h2>
      </div>

      <GlassCard className="p-6 flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-accent border border-accent/30 shadow-lg shadow-accent/20">
          <Cloud className="h-9 w-9 text-accent" />
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-foreground">CatatLaba</h3>
          <p className="text-xs font-semibold text-accent mt-0.5">Versi 1.0.0 (Build 2026)</p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
          Aplikasi pencatatan keuangan UMKM dan keuangan pribadi yang cepat, fleksibel, serta mengutamakan privasi dengan sistem <strong className="text-foreground">Offline-First (Local Database)</strong> dan sinkronisasi awan terenkripsi.
        </p>

        <div className="w-full border-t border-glass-border/60 my-1" />

        <div className="grid grid-cols-2 gap-2 w-full text-left">
          <div className="p-3 rounded-xl bg-glass/40 border border-glass-border">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Penyimpanan</p>
            <p className="text-xs font-semibold text-foreground mt-0.5">Local SQLite + Sync</p>
          </div>
          <div className="p-3 rounded-xl bg-glass/40 border border-glass-border">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Proteksi Auth</p>
            <p className="text-xs font-semibold text-foreground mt-0.5">Turnstile CAPTCHA</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-2">
          © 2026 CatatLaba Team. All rights reserved.
        </p>
      </GlassCard>
    </section>
  )
}

export function PengaturanPage() {
  const [subScreen, setSubScreenState] = useState<SubScreen>(null)
  const setSubScreenTitle = useNavStore((s) => s.setSubScreenTitle)
  const themeMode = useThemeStore((s) => s.mode)
  const snapshot = useSyncSnapshot()

  const currentLockType = useSecurityStore((s) => s.lockType)
  const biometricEnabled = useSecurityStore((s) => s.biometricEnabled)
  const currentLang = useLanguageStore((s) => s.lang)

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

  const securityBadge =
    currentLockType === 'none'
      ? 'Tanpa Kunci'
      : biometricEnabled
        ? `${currentLockType.toUpperCase()} + Biometrik`
        : currentLockType.toUpperCase()

  const languageLabel = LANGUAGES.find((l) => l.code === currentLang)?.label ?? 'Bahasa Indonesia'

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
        {subScreen === 'security' && <SecuritySubScreen onBack={closeSub} />}
        {subScreen === 'language' && <LanguageSubScreen onBack={closeSub} />}
        {subScreen === 'about' && <AboutSubScreen onBack={closeSub} />}
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

        {/* Section 2: Keamanan & Privasi */}
        <div className="flex flex-col gap-2">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Keamanan & Akses
          </span>
          <GlassCard className="divide-y divide-glass-border/60 overflow-hidden">
            <SettingsRow
              icon={Shield}
              label="Keamanan & Kunci Aplikasi"
              badge={securityBadge}
              onClick={() => openSub('security', 'Keamanan & Kunci Aplikasi')}
            />
          </GlassCard>
        </div>

        {/* Section 3: Sinkronisasi & Backup */}
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

        {/* Section 4: Tampilan & Bahasa */}
        <div className="flex flex-col gap-2">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tampilan & Bahasa
          </span>
          <GlassCard className="divide-y divide-glass-border/60 overflow-hidden">
            <SettingsRow
              icon={Globe}
              label="Bahasa Aplikasi"
              badge={languageLabel}
              onClick={() => openSub('language', 'Bahasa Aplikasi')}
            />
            <SettingsRow
              icon={Palette}
              label="Tema Tampilan"
              badge={themeLabel}
              onClick={() => openSub('theme', 'Tema Tampilan')}
            />
          </GlassCard>
        </div>

        {/* Section 5: Tentang Aplikasi */}
        <div className="flex flex-col gap-2">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lainnya & Informasi
          </span>
          <GlassCard className="divide-y divide-glass-border/60 overflow-hidden">
            <SettingsRow
              icon={Info}
              label="Tentang Aplikasi"
              badge="v1.0.0"
              onClick={() => openSub('about', 'Tentang Aplikasi')}
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
