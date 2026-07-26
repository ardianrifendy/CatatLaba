import { Loader2 } from 'lucide-react'
import { controlsText } from '@/lib/ui-text/controls'
import { GlassButton } from '@/components/ui/GlassButton'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetDescription,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'

type GlassConfirmSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
}

/**
 * Confirmation bottom sheet — replaces window.confirm (banned). The caller
 * owns `open` and closes the sheet itself after `onConfirm` settles.
 */
export function GlassConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
}: GlassConfirmSheetProps) {
  return (
    <GlassBottomSheet open={open} onOpenChange={onOpenChange}>
      {/*
        With a description, Radix auto-links it to the content; without one,
        aria-describedby={undefined} opts out of the missing-description warn.
      */}
      <GlassBottomSheetContent
        {...(description === undefined ? { 'aria-describedby': undefined } : {})}
      >
        <GlassBottomSheetTitle className="text-base font-medium text-zinc-100">
          {title}
        </GlassBottomSheetTitle>
        {description !== undefined ? (
          <GlassBottomSheetDescription className="mt-1.5 text-sm text-zinc-400">
            {description}
          </GlassBottomSheetDescription>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <GlassButton variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? controlsText.cancel}
          </GlassButton>
          <GlassButton
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" />
            ) : null}
            {confirmLabel}
          </GlassButton>
        </div>
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}
