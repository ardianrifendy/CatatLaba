import { BudgetsScreen } from '@/features/budgets/BudgetsScreen'
import { ReportsScreen } from '@/features/reports/ReportsScreen'

export function LaporanPage() {
  return (
    <div className="flex flex-col gap-8">
      <ReportsScreen />
      <BudgetsScreen />
    </div>
  )
}
