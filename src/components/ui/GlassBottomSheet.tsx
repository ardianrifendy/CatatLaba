import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'

export const GlassBottomSheet = Dialog.Root
export const GlassBottomSheetTrigger = Dialog.Trigger
export const GlassBottomSheetClose = Dialog.Close
export const GlassBottomSheetTitle = Dialog.Title
export const GlassBottomSheetDescription = Dialog.Description

type ContentProps = ComponentPropsWithoutRef<typeof Dialog.Content> & {
  children: ReactNode
}

export function GlassBottomSheetContent({
  className,
  children,
  ...props
}: ContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="sheet-overlay fixed inset-0 z-40 bg-overlay" />
      <Dialog.Content
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          'sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg',
          'rounded-t-3xl border-t border-glass-border bg-glass-strong text-foreground shadow-glass backdrop-blur-md',
          'p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]',
          'focus:outline-none',
          className,
        )}
        {...props}
      >
        <div
          aria-hidden
          className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/40"
        />
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
