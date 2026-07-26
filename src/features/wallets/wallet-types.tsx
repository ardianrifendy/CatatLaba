import { Banknote, Landmark, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Wallet } from '@/db/local/schema'
import { walletsText } from '@/lib/ui-text'

export type WalletType = Wallet['type']

/** Segmented-control options for the wallet type (Bahasa labels from ui-text). */
export const walletTypeOptions: ReadonlyArray<{ value: WalletType; label: string }> = [
  { value: 'cash', label: walletsText.typeLabels.cash },
  { value: 'bank', label: walletsText.typeLabels.bank },
  { value: 'ewallet', label: walletsText.typeLabels.ewallet },
]

export function walletTypeLabel(type: WalletType): string {
  return walletsText.typeLabels[type]
}

const typeIcons: Record<WalletType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  ewallet: Smartphone,
}

/** Lucide icon for a wallet type (cash: Banknote, bank: Landmark, ewallet: Smartphone). */
export function WalletTypeIcon({ type, className }: { type: WalletType; className?: string }) {
  const Icon = typeIcons[type]
  return <Icon aria-hidden className={className} />
}
