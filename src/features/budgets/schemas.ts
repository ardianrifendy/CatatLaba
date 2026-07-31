import { z } from 'zod'
import { budgetsText } from '@/lib/ui-text'

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

export const budgetFormSchema = z.object({
  month: z
    .string()
    .trim()
    .min(1, budgetsText.validation.monthRequired)
    .regex(monthPattern, budgetsText.validation.monthInvalid),
  categoryId: z.string().trim().min(1, budgetsText.validation.categoryRequired),
  amount: z
    .number()
    .int(budgetsText.validation.amountInvalid)
    .positive(budgetsText.validation.amountInvalid)
    .nullable()
    .refine((value) => value !== null, budgetsText.validation.amountRequired),
})

export type BudgetFormValues = z.output<typeof budgetFormSchema>
export type BudgetFormErrors = Partial<Record<keyof BudgetFormValues, string>>

export function collectBudgetFieldErrors(error: z.ZodError): BudgetFormErrors {
  const errors: BudgetFormErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (
      (field === 'month' || field === 'categoryId' || field === 'amount') &&
      errors[field] === undefined
    ) {
      errors[field] = issue.message
    }
  }
  return errors
}
