import type { DbContext } from '@/db/local'
import { hasSupabaseConfig } from '@/lib/env'
import { commonText } from '@/lib/ui-text'
import { synchronize, type SyncResult } from './engine'
import { clearSession, loadSession, signInWithPassword, signOut, signUpWithPassword } from './supabase'
import type { SyncSnapshot } from './types'

const debounceMs = 1_500

export interface SyncController {
  getSnapshot(): SyncSnapshot
  subscribe(listener: () => void): () => void
  syncNow(): Promise<SyncResult | null>
  schedule(): void
  signIn(identifier: string, password: string): Promise<void>
  signUp(email: string, password: string, fullName?: string, phone?: string): Promise<boolean>
  signOut(): Promise<void>
}

export function createSyncController(ctx: DbContext): SyncController {
  let snapshot: SyncSnapshot = {
    status: hasSupabaseConfig ? (loadSession() ? 'idle' : 'signed_out') : 'offline',
    lastSyncedAt: null,
    message: hasSupabaseConfig ? null : commonText.settings.sync.offline,
    session: loadSession(),
  }
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight: Promise<SyncResult | null> | null = null
  const listeners = new Set<() => void>()

  function publish(next: SyncSnapshot): void {
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  async function syncNow(): Promise<SyncResult | null> {
    if (!hasSupabaseConfig || !snapshot.session) return null
    if (inFlight) return inFlight
    publish({ ...snapshot, status: 'syncing', message: null })
    inFlight = synchronize(ctx, snapshot.session).then(
      (result) => {
        publish({ ...snapshot, status: 'idle', lastSyncedAt: result.syncedAt, message: null })
        return result
      },
      (error: unknown) => {
        publish({ ...snapshot, status: 'error', message: errorMessage(error) })
        return null
      },
    ).finally(() => {
      inFlight = null
    })
    return inFlight
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    syncNow,
    schedule() {
      if (!hasSupabaseConfig || !snapshot.session) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        void syncNow()
      }, debounceMs)
    },
    async signIn(identifier, password) {
      const session = await signInWithPassword(identifier, password)
      publish({ ...snapshot, status: 'idle', message: null, session })
      await syncNow()
    },
    async signUp(email, password, fullName, phone) {
      const session = await signUpWithPassword(email, password, fullName, phone)
      if (!session) {
        publish({ ...snapshot, status: 'signed_out', message: commonText.settings.sync.emailConfirmation })
        return false
      }
      publish({ ...snapshot, status: 'idle', message: null, session })
      await syncNow()
      return true
    },
    async signOut() {
      const session = snapshot.session
      if (timer) clearTimeout(timer)
      if (session && hasSupabaseConfig) {
        try {
          await signOut(session)
        } catch {
          clearSession()
        }
      } else {
        clearSession()
      }
      publish({ ...snapshot, status: hasSupabaseConfig ? 'signed_out' : 'offline', session: null, message: null })
    },
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : commonText.settings.sync.syncFailed
}
