import { useEffect, useState } from 'react'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { getContext, initDb } from '@/db/local'
import { createRepositories, type Repositories } from '@/db/repositories'
import { createSyncController, type SyncController } from '@/lib/sync/controller'
import { wrapRepositoriesForSync } from '@/lib/sync/repository-wrapper'
import { commonText } from '@/lib/ui-text'
import { AppShell } from './AppShell'
import { AppProviders } from './providers'

// Boot is cached at module level so React 19 StrictMode's double-invoked
// effects (mount -> unmount -> mount in dev) cannot run initDb() or
// createRepositories() twice. Only the retry button after a failure clears the
// cache and re-runs the whole sequence.
interface BootResult {
  repos: Repositories
  sync: SyncController
}

let bootPromise: Promise<BootResult> | null = null

function boot(): Promise<BootResult> {
  bootPromise ??= (async () => {
    const { migrationsApplied } = await initDb()
    if (import.meta.env.DEV) {
      console.info(`[boot] local db ready — applied migrations: ${migrationsApplied}`)
    }
    const sync = createSyncController(getContext())
    const repos = wrapRepositoriesForSync(createRepositories(getContext()), sync.schedule)
    const generated = await repos.recurring.generateDue()
    if (generated.ok) {
      if (import.meta.env.DEV && generated.value.length > 0) {
        console.info(`[boot] generated recurring transactions: ${generated.value.length}`)
      }
    } else {
      console.error('[boot] recurring generation failed:', generated.error)
    }
    void sync.syncNow()
    return { repos, sync }
  })()
  return bootPromise
}

type BootState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly repos: Repositories; readonly sync: SyncController }

export function AppInit() {
  const [state, setState] = useState<BootState>({ status: 'loading' })

  useEffect(() => {
    if (state.status !== 'loading') return
    let cancelled = false
    boot().then(
      (result) => {
        if (!cancelled) setState({ status: 'ready', repos: result.repos, sync: result.sync })
      },
      (error: unknown) => {
        if (cancelled) return
        console.error('[boot] local database init failed:', error)
        setState({ status: 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [state.status])

  if (state.status === 'ready') {
    return (
      <AppProviders repos={state.repos} sync={state.sync}>
        <AppShell />
      </AppProviders>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <GlassCard className="w-full max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">{commonText.boot.errorTitle}</h1>
          <p className="mt-2 text-sm font-light text-zinc-400">
            {commonText.boot.errorDescription}
          </p>
          <GlassButton
            variant="primary"
            className="mt-6 w-full"
            onClick={() => {
              bootPromise = null
              setState({ status: 'loading' })
            }}
          >
            {commonText.actions.retry}
          </GlassButton>
          {/* Guaranteed recovery path: an in-place retry cannot recover every
              failure (e.g. sql.js caches a rejected wasm init at module level),
              so offer a full page reload as well. */}
          <GlassButton
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => {
              window.location.reload()
            }}
          >
            {commonText.boot.reloadApp}
          </GlassButton>
        </GlassCard>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <GlassCard className="w-full max-w-sm p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{commonText.appName}</h1>
        <p className="mt-2 text-sm font-light text-zinc-400">{commonText.boot.loading}</p>
      </GlassCard>
    </main>
  )
}
