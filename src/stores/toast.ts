import { create } from 'zustand'
import { newId } from '@/lib/id'

export type ToastKind = 'success' | 'error'

export type ToastItem = {
  id: string
  kind: ToastKind
  message: string
}

const AUTO_DISMISS_MS = 3500
const MAX_VISIBLE = 3

type ToastState = {
  toasts: ToastItem[]
  push: (kind: ToastKind, message: string) => void
  dismiss: (id: string) => void
}

// Auto-dismiss timers, tracked outside the store so dismissing (tap or cap
// overflow) can cancel the pending timeout and never double-fires.
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function clearTimer(id: string): void {
  const timer = timers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = newId()
    set((state) => {
      const next = [...state.toasts, { id, kind, message }]
      // Cap visible toasts — drop the oldest and cancel their timers.
      const dropped = next.slice(0, Math.max(0, next.length - MAX_VISIBLE))
      for (const item of dropped) clearTimer(item.id)
      return { toasts: next.slice(-MAX_VISIBLE) }
    })
    timers.set(
      id,
      setTimeout(() => {
        get().dismiss(id)
      }, AUTO_DISMISS_MS),
    )
  },
  dismiss: (id) => {
    clearTimer(id)
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
  },
}))

/**
 * Imperative toast API for mutation callbacks:
 * `toast.success('Dompet dibuat')` / `toast.error(error.message)`.
 * Messages must come from ui-text or repository AppError (Bahasa Indonesia).
 */
export const toast = {
  success(message: string): void {
    useToastStore.getState().push('success', message)
  },
  error(message: string): void {
    useToastStore.getState().push('error', message)
  },
}
