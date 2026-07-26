import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, type ReactNode } from 'react'
import type { Repositories } from '@/db/repositories'

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

interface AppProvidersProps {
  repos: Repositories
  children: ReactNode
}

export function AppProviders({ repos, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReposContext.Provider value={repos}>{children}</ReposContext.Provider>
    </QueryClientProvider>
  )
}

// Access the repositories built at boot. Only valid under <AppProviders>.
export function useRepos(): Repositories {
  const repos = useContext(ReposContext)
  if (repos === null) {
    throw new Error('useRepos must be used inside <AppProviders>.')
  }
  return repos
}
