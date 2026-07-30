import { useQuery } from '@tanstack/react-query'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Plus,
  Store,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { useRepos } from '@/app/providers'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassField } from '@/components/ui/GlassField'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassInput } from '@/components/ui/GlassInput'
import type { Channel } from '@/db/local/schema'
import { cn } from '@/lib/cn'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { channelsText, commonText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'
import { useChannelMutations } from './useChannelMutations'

const NAME_MAX = 40

const channelFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, channelsText.form.nameRequired)
    .max(NAME_MAX, channelsText.form.nameTooLong),
})

interface ChannelRowProps {
  channel: Channel
  dimmed?: boolean
  onSelect: () => void
}

// Tappable glass row (≥44px target). Archived rows render dimmed but stay
// tappable so the user can reach the "Aktifkan lagi" action in the edit sheet.
function ChannelRow({ channel, dimmed = false, onSelect }: ChannelRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'ios-pressable flex min-h-14 w-full items-center gap-3 rounded-2xl border border-glass-border bg-glass px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-glass-hover active:bg-glass-active',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          dimmed && 'opacity-60',
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-glass text-zinc-300"
        >
          <Store className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {channel.name}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  )
}

function ChannelListSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl border border-glass-border bg-glass" />
      ))}
    </div>
  )
}

export function ChannelsScreen({ onBack }: { onBack: () => void }) {
  const repos = useRepos()
  const { create, update, remove } = useChannelMutations()

  const channelsQuery = useQuery({
    queryKey: queryKeys.channels,
    queryFn: async () => unwrap(await repos.channels.list()),
  })

  // Create/edit sheet state. `editing === null` means create mode.
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Channel | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  // Delete flow state.
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null)
  const [checkingDelete, setCheckingDelete] = useState(false)

  function openCreate() {
    setEditing(null)
    setNameDraft('')
    setNameError(null)
    setFormOpen(true)
  }

  function openEdit(channel: Channel) {
    setEditing(channel)
    setNameDraft(channel.name)
    setNameError(null)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setNameError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = channelFormSchema.safeParse({ name: nameDraft })
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? channelsText.form.nameRequired)
      return
    }
    if (editing !== null) {
      update.mutate({
        id: editing.id,
        patch: { name: parsed.data.name },
        successMessage: channelsText.toasts.updated,
      })
    } else {
      create.mutate({ name: parsed.data.name })
    }
    setFormOpen(false)
  }

  function handleToggleArchive() {
    if (editing === null) return
    update.mutate({
      id: editing.id,
      patch: { isArchived: !editing.isArchived },
      successMessage: editing.isArchived
        ? channelsText.toasts.unarchived
        : channelsText.toasts.archived,
    })
    setFormOpen(false)
  }

  // Delete rule: a channel referenced by any non-deleted transaction cannot be
  // deleted — the user is pointed to archiving instead. The check is a direct
  // read-only repo call (channel-filtered) so it never touches the shared
  // transactions cache key.
  async function handleDeleteRequest() {
    if (editing === null || checkingDelete) return
    setCheckingDelete(true)
    try {
      const used = unwrap(await repos.transactions.list({ channelId: editing.id }))
      if (used.length > 0) {
        toast.error(channelsText.toasts.deleteBlocked)
        return
      }
      setFormOpen(false)
      setDeleteTarget(editing)
    } catch (error) {
      toast.error(
        error instanceof RepoError ? error.message : commonText.mutationErrorFallback,
      )
    } finally {
      setCheckingDelete(false)
    }
  }

  function handleConfirmDelete() {
    if (deleteTarget === null) return
    remove.mutate({ id: deleteTarget.id })
    setDeleteTarget(null)
  }

  const channels = channelsQuery.data
  const activeChannels = channels?.filter((c) => !c.isArchived) ?? []
  const archivedChannels = channels?.filter((c) => c.isArchived) ?? []

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label={channelsText.backLabel} onClick={onBack}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </GlassIconButton>
        <h2 className="flex-1 text-xl font-semibold tracking-tight">{channelsText.title}</h2>
        <GlassIconButton aria-label={channelsText.addLabel} onClick={openCreate}>
          <Plus className="size-5" aria-hidden="true" />
        </GlassIconButton>
      </div>

      {channelsQuery.isPending ? (
        <ChannelListSkeleton />
      ) : channelsQuery.isError ? (
        <GlassCard className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm font-light text-zinc-400">{channelsText.loadError}</p>
          <GlassButton variant="ghost" onClick={() => void channelsQuery.refetch()}>
            {channelsText.retry}
          </GlassButton>
        </GlassCard>
      ) : channels !== undefined && channels.length === 0 ? (
        <GlassCard>
          <GlassEmptyState
            icon={<Store className="size-6" />}
            title={channelsText.empty.title}
            description={channelsText.empty.description}
            action={
              <GlassButton onClick={openCreate}>
                <Plus className="size-4" aria-hidden="true" />
                {channelsText.empty.action}
              </GlassButton>
            }
          />
        </GlassCard>
      ) : (
        <>
          {activeChannels.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {activeChannels.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  onSelect={() => openEdit(channel)}
                />
              ))}
            </ul>
          ) : null}
          {archivedChannels.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="mt-2 text-xs font-light tracking-widest text-zinc-500 uppercase">
                {channelsText.archivedSection}
              </h3>
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {archivedChannels.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    dimmed
                    onSelect={() => openEdit(channel)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      {/* Create / edit sheet */}
      <GlassBottomSheet open={formOpen} onOpenChange={handleFormOpenChange}>
        <GlassBottomSheetContent aria-describedby={undefined}>
          <GlassBottomSheetTitle className="text-base font-medium text-foreground font-semibold">
            {editing !== null ? channelsText.form.editTitle : channelsText.form.createTitle}
          </GlassBottomSheetTitle>
          <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
            <GlassField
              label={channelsText.form.nameLabel}
              htmlFor="channel-name"
              error={nameError}
            >
              <GlassInput
                id="channel-name"
                value={nameDraft}
                onChange={(event) => {
                  setNameDraft(event.target.value)
                  if (nameError !== null) setNameError(null)
                }}
                placeholder={channelsText.form.namePlaceholder}
                maxLength={NAME_MAX}
                error={nameError !== null}
                autoComplete="off"
              />
            </GlassField>

            {editing !== null ? (
              <div className="grid grid-cols-2 gap-3">
                <GlassButton variant="ghost" onClick={handleToggleArchive}>
                  {editing.isArchived ? (
                    <ArchiveRestore className="size-4" aria-hidden="true" />
                  ) : (
                    <Archive className="size-4" aria-hidden="true" />
                  )}
                  {editing.isArchived
                    ? channelsText.form.unarchive
                    : channelsText.form.archive}
                </GlassButton>
                <GlassButton
                  variant="danger"
                  onClick={() => void handleDeleteRequest()}
                  disabled={checkingDelete}
                >
                  {checkingDelete ? (
                    <Loader2
                      className="size-4 motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 className="size-4" aria-hidden="true" />
                  )}
                  {channelsText.form.delete}
                </GlassButton>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <GlassButton variant="ghost" onClick={() => handleFormOpenChange(false)}>
                {channelsText.form.cancel}
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                {channelsText.form.save}
              </GlassButton>
            </div>
          </form>
        </GlassBottomSheetContent>
      </GlassBottomSheet>

      {/* Destructive confirmation */}
      <GlassConfirmSheet
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={channelsText.confirmDelete.title}
        description={
          deleteTarget !== null
            ? channelsText.confirmDelete.description(deleteTarget.name)
            : undefined
        }
        confirmLabel={channelsText.confirmDelete.confirm}
        cancelLabel={channelsText.form.cancel}
        destructive
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
