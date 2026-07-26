import { GlassCard } from '@/components/ui/GlassCard'
import { commonText } from '@/lib/ui-text'

export function LaporanPage() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{commonText.tabs.laporan}</h2>
      <GlassCard className="p-8 text-center">
        <p className="text-sm font-light text-zinc-400">{commonText.placeholders.laporan}</p>
      </GlassCard>
    </section>
  )
}
