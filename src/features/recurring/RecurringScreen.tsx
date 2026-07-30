import { useQuery } from '@tanstack/react-query'
import { ArchiveRestore, ArrowLeft, CalendarClock, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import type { Category, Channel, RecurringRule, Wallet } from '@/db/local/schema'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { commonText } from '@/lib/ui-text'
import { recurringText } from '@/lib/ui-text/recurring'
import { RecurringFormSheet } from './RecurringFormSheet'
import { useCreateRecurring, useDeleteRecurring, useSetRecurringActive, useUpdateRecurring } from './use-recurring-mutations'
import type { RecurringFormValues } from './schemas'

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso))
}

function scheduleLabel(rule: RecurringRule): string {
  return rule.frequency === 'monthly' ? `${recurringText.form.monthly} · ${rule.day}` : `${recurringText.form.weekly} · ${rule.day}`
}

export function RecurringScreen({ onBack }: { onBack?: () => void } = {}) {
  const repos = useRepos()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringRule | null>(null)
  const recurringQuery = useQuery({ queryKey: queryKeys.recurring, queryFn: async () => unwrap(await repos.recurring.list()) })
  const walletsQuery = useQuery({ queryKey: queryKeys.wallets, queryFn: async () => unwrap(await repos.wallets.list()) })
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: async () => unwrap(await repos.categories.list()) })
  const channelsQuery = useQuery({ queryKey: queryKeys.channels, queryFn: async () => unwrap(await repos.channels.list()) })
  const create = useCreateRecurring()
  const update = useUpdateRecurring()
  const setActive = useSetRecurringActive()
  const remove = useDeleteRecurring()
  const rules = recurringQuery.data ?? []
  const activeRules = rules.filter((rule) => rule.isActive)
  const inactiveRules = rules.filter((rule) => !rule.isActive)
  const wallets = walletsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const channels = channelsQuery.data ?? []
  const pending = create.isPending || update.isPending || setActive.isPending || remove.isPending
  const loading = recurringQuery.isPending || walletsQuery.isPending || categoriesQuery.isPending || channelsQuery.isPending
  const failed = recurringQuery.isError || walletsQuery.isError || categoriesQuery.isError || channelsQuery.isError
  const showLoading = loading && !failed

  function openCreate(): void { setEditing(null); setFormOpen(true) }
  function openEdit(rule: RecurringRule): void { setEditing(rule); setFormOpen(true) }
  function save(values: RecurringFormValues): void {
    if (editing === null) {
      create.mutate(values, { onSuccess: () => setFormOpen(false) })
    } else {
      update.mutate({ id: editing.id, values }, { onSuccess: () => setFormOpen(false) })
    }
  }
  function retry(): void { void Promise.all([recurringQuery.refetch(), walletsQuery.refetch(), categoriesQuery.refetch(), channelsQuery.refetch()]) }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {onBack ? <GlassIconButton aria-label={commonText.actions.back} onClick={onBack}><ArrowLeft aria-hidden className="size-5" /></GlassIconButton> : null}
        <h2 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">{recurringText.title}</h2>
        <GlassIconButton aria-label={recurringText.addLabel} onClick={openCreate} disabled={loading}><Plus aria-hidden className="size-5" /></GlassIconButton>
      </div>
      {showLoading ? <RecurringSkeleton /> : null}
      {failed ? <GlassCard className="flex flex-col items-center gap-3 p-6 text-center"><p className="text-sm font-normal text-zinc-400">{recurringText.loadError}</p><GlassButton variant="ghost" onClick={retry}>{recurringText.retry}</GlassButton></GlassCard> : null}
      {!loading && !failed && rules.length === 0 ? <GlassCard><GlassEmptyState icon={<CalendarClock aria-hidden className="size-6" />} title={recurringText.empty.title} description={recurringText.empty.description} action={<GlassButton onClick={openCreate}><Plus aria-hidden className="size-4" />{recurringText.empty.action}</GlassButton>} /></GlassCard> : null}
      {!loading && !failed && rules.length > 0 ? <div className="flex flex-col gap-6"><RuleGroup title={recurringText.active} rules={activeRules} wallets={wallets} categories={categories} channels={channels} pending={pending} onEdit={openEdit} onToggle={(rule) => setActive.mutate({ id: rule.id, isActive: !rule.isActive })} /><RuleGroup title={recurringText.inactive} rules={inactiveRules} wallets={wallets} categories={categories} channels={channels} pending={pending} onEdit={openEdit} onToggle={(rule) => setActive.mutate({ id: rule.id, isActive: !rule.isActive })} /></div> : null}
      <RecurringFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editing}
        wallets={wallets}
        categories={categories}
        channels={channels}
        pending={pending}
        onSave={save}
        onDelete={() => {
          if (editing !== null) {
            remove.mutate(editing.id, { onSuccess: () => setFormOpen(false) })
          }
        }}
      />
    </section>
  )
}

function RuleGroup({ title, rules, wallets, categories, channels, pending, onEdit, onToggle }: { title: string; rules: readonly RecurringRule[]; wallets: readonly Wallet[]; categories: readonly Category[]; channels: readonly Channel[]; pending: boolean; onEdit: (rule: RecurringRule) => void; onToggle: (rule: RecurringRule) => void }) {
  if (rules.length === 0) return null
  return <div className="flex flex-col gap-3"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p><div className="grid gap-3">{rules.map((rule) => <RuleCard key={rule.id} rule={rule} wallet={wallets.find((wallet) => wallet.id === rule.templateWalletId)} category={categories.find((category) => category.id === rule.templateCategoryId)} channel={channels.find((channel) => channel.id === rule.templateChannelId)} pending={pending} onEdit={() => onEdit(rule)} onToggle={() => onToggle(rule)} />)}</div></div>
}

function RuleCard({ rule, wallet, category, channel, pending, onEdit, onToggle }: { rule: RecurringRule; wallet: Wallet | undefined; category: Category | undefined; channel: Channel | undefined; pending: boolean; onEdit: () => void; onToggle: () => void }) {
  return <GlassCard className="flex h-full flex-col gap-3 p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{rule.name}</p><p className="text-xs font-normal text-muted-foreground">{scheduleLabel(rule)} · {formatDate(rule.nextRunAt)}</p></div><GlassIconButton aria-label={recurringText.form.editTitle} onClick={onEdit} disabled={pending}><Pencil aria-hidden className="size-4 text-foreground" /></GlassIconButton></div><div className="grid grid-cols-2 gap-3 text-xs"><p className="truncate text-foreground-subtle">{wallet?.name ?? recurringText.form.walletLabel}</p><p className="truncate text-right text-foreground-subtle">{category?.name ?? recurringText.form.categoryLabel}</p><p className="truncate text-muted-foreground">{channel?.name ?? recurringText.form.optionalNone}</p><p className="text-right font-bold tabular-nums text-foreground">{formatIDR(rule.templateAmount)}</p></div><GlassButton variant="ghost" onClick={onToggle} disabled={pending}><ArchiveRestore aria-hidden className="size-4" />{rule.isActive ? recurringText.inactive : recurringText.active}</GlassButton></GlassCard>
}

function RecurringSkeleton() { return <div aria-hidden className="flex flex-col gap-3"><div className="h-40 animate-pulse rounded-lg bg-glass" /><div className="h-40 animate-pulse rounded-lg bg-glass" /></div> }
