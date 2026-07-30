import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { Repositories } from '@/db/repositories'
import type { SyncController } from '@/lib/sync/controller'
import type { SyncSnapshot } from '@/lib/sync/types'

// Single QueryClient for the whole app. Retry once (repositories already
// normalize failures into RepoError with a Bahasa message); no focus refetch —
// data is local SQLite, so mutation-driven invalidation keeps it fresh.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const ReposContext = createContext<Repositories | null>(null)
const SyncContext = createContext<SyncController | null>(null)

interface AppProvidersProps {
  repos: Repositories
  sync: SyncController
  children: ReactNode
}

export function AppProviders({ repos, sync, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SyncContext.Provider value={sync}>
        <ReposContext.Provider value={repos}>{children}</ReposContext.Provider>
      </SyncContext.Provider>
    </QueryClientProvider>
  )
}

export function useSync(): SyncController {
  const sync = useContext(SyncContext)
  if (sync === null) throw new Error('useSync must be used inside <AppProviders>.')
  return sync
}

export function useSyncSnapshot(): SyncSnapshot {
  const sync = useSync()
  return useSyncExternalStore(sync.subscribe, sync.getSnapshot, sync.getSnapshot)
}

// Access the repositories built at boot. Only valid under <AppProviders>.
export function useRepos(): Repositories {
  const repos = useContext(ReposContext)
  if (repos === null) {
    throw new Error('useRepos must be used inside <AppProviders>.')
  }
  return repos
}
