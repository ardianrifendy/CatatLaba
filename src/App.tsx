import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import {
  GlassBottomSheet,
  GlassBottomSheetTrigger,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
  GlassBottomSheetDescription,
  GlassBottomSheetClose,
} from '@/components/ui/GlassBottomSheet'

function App() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-stretch gap-4 p-6 lg:max-w-2xl">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">CatatLaba</h1>
        <p className="mt-1 text-sm font-light text-zinc-400">
          Shell awal — komponen kaca dasar.
        </p>
      </header>

      <GlassCard className="p-6">
        <p className="text-xs font-light tracking-wide text-zinc-400 uppercase">
          Saldo total
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums">Rp1.234.567</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <GlassButton variant="primary">Pemasukan</GlassButton>
          <GlassButton variant="danger">Pengeluaran</GlassButton>
          <GlassButton variant="ghost">Transfer</GlassButton>
        </div>
      </GlassCard>

      <GlassBottomSheet>
        <GlassBottomSheetTrigger asChild>
          <GlassButton variant="ghost">Buka bottom sheet</GlassButton>
        </GlassBottomSheetTrigger>
        <GlassBottomSheetContent>
          <GlassBottomSheetTitle className="text-lg font-semibold">
            Tambah transaksi
          </GlassBottomSheetTitle>
          <GlassBottomSheetDescription className="mt-1 text-sm font-light text-zinc-400">
            Contoh bottom sheet kaca. Form asli menyusul di Phase 3.
          </GlassBottomSheetDescription>
          <div className="mt-5 flex justify-end gap-2">
            <GlassBottomSheetClose asChild>
              <GlassButton variant="ghost">Batal</GlassButton>
            </GlassBottomSheetClose>
            <GlassBottomSheetClose asChild>
              <GlassButton variant="primary">Simpan</GlassButton>
            </GlassBottomSheetClose>
          </div>
        </GlassBottomSheetContent>
      </GlassBottomSheet>
    </main>
  )
}

export default App
