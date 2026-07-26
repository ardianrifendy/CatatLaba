import { CircleAlert, CircleCheck } from 'lucide-react'
import { useToastStore } from '@/stores/toast'
import { controlsText } from '@/lib/ui-text/controls'

/**
 * Fixed toast stack. Mount once at the app root (F1 mounts this). Sits above
 * the mobile tab bar (safe-area inset + 6rem) and near the viewport edge on
 * desktop. Tapping a toast dismisses it; each also auto-dismisses via the
 * store.
 */
export function GlassToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={controlsText.notifications}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {toasts.map((item) => (
        <button
          key={item.id}
          type="button"
          // stopPropagation is load-bearing: Radix DismissableLayer (bottom
          // sheets) closes on any pointer-down outside its content. Stopping
          // the pointer-down here engages Radix's interception so tapping a
          // toast dismisses only the toast, not an open sheet underneath.
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            dismiss(item.id)
          }}
          // Opaque-ish zinc base (like the bottom sheet surface) keeps the
          // message readable over arbitrary content while staying glassy.
          className="toast-item pointer-events-auto flex min-h-11 w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-left shadow-2xl backdrop-blur-xl"
        >
          {item.kind === 'success' ? (
            <CircleCheck aria-hidden className="size-5 shrink-0 text-income" />
          ) : (
            <CircleAlert aria-hidden className="size-5 shrink-0 text-expense" />
          )}
          <span className="text-sm text-zinc-100">{item.message}</span>
        </button>
      ))}
    </div>
  )
}
