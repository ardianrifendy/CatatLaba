import { Cloud, Download, LogOut, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSync, useSyncSnapshot } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassField } from '@/components/ui/GlassField'
import { GlassFileInput } from '@/components/ui/GlassFileInput'
import { GlassInput } from '@/components/ui/GlassInput'
import { getContext } from '@/db/local'
import { exportBackup, importBackup } from '@/lib/sync/backup'
import { exportJsonFile } from '@/lib/sync/file-export'
import { queryKeys } from '@/lib/query'
import { commonText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'

export function SyncSettings() {
  const text = commonText.settings.sync
  const sync = useSync()
  const snapshot = useSyncSnapshot()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
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
    <div className="flex flex-col gap-6">
      {/* Cloud Sync Subsection */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
            <Cloud className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{text.title}</p>
            <p className="text-xs font-normal text-muted-foreground">{statusText(snapshot.status, snapshot.lastSyncedAt, snapshot.message)}</p>
          </div>
        </div>

        {snapshot.status === 'offline' ? null : snapshot.session ? (
          <div className="flex flex-col gap-3 pl-12">
            <p className="text-xs font-medium text-muted-foreground">
              {text.signedInAs} <span className="font-semibold text-foreground">{snapshot.session.email ?? text.accountFallback}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <GlassButton variant="ghost" className="text-xs" disabled={pending || snapshot.status === 'syncing'} onClick={() => void run(async () => { await sync.syncNow() })}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {text.syncNow}
              </GlassButton>
              <GlassButton variant="ghost" className="text-xs" disabled={pending} onClick={() => void run(() => sync.signOut())}>
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {text.signOut}
              </GlassButton>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-3 pl-12" onSubmit={(event) => { event.preventDefault(); void run(() => sync.signIn(email, password)) }}>
            <GlassField label={text.email} htmlFor="sync-email">
              <GlassInput id="sync-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </GlassField>
            <GlassField label={text.password} htmlFor="sync-password">
              <GlassInput id="sync-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </GlassField>
            {error ? <p className="text-xs font-normal text-expense">{error}</p> : null}
            <div className="grid grid-cols-2 gap-3">
              <GlassButton type="submit" disabled={pending} className="text-xs">{text.signIn}</GlassButton>
              <GlassButton variant="ghost" disabled={pending} className="text-xs" onClick={() => void run(async () => { const signedIn = await sync.signUp(email, password); if (!signedIn) toast.success(text.emailConfirmation) })}>{text.signUp}</GlassButton>
            </div>
          </form>
        )}
      </div>

      <div className="h-px w-full bg-glass-border/60" />

      {/* Backup Subsection */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{text.backupTitle}</p>
          <p className="text-xs font-normal text-muted-foreground">{text.backupDescription}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <GlassButton variant="ghost" className="text-xs" onClick={downloadBackup}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> {text.exportJson}
          </GlassButton>
          <GlassFileInput accept="application/json,.json" label={text.importBackup} onChange={uploadBackup} />
        </div>
      </div>
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
