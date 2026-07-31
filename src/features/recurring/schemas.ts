import { z } from 'zod'
import { recurringText } from '@/lib/ui-text'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const RECURRING_NONE = '__none__'

export const recurringFormSchema = z
  .object({
    name: z.string().trim().min(1, recurringText.validation.nameRequired).max(80, recurringText.validation.nameTooLong),
    frequency: z.enum(['monthly', 'weekly']),
    day: z.number({ error: recurringText.validation.dayRequired }).int(recurringText.validation.dayRequired),
    nextRunDate: z.string().trim().min(1, recurringText.validation.nextRunAtRequired).regex(datePattern, recurringText.validation.nextRunAtInvalid).refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00.000Z`)), recurringText.validation.nextRunAtInvalid),
    templateType: z.enum(['income', 'expense']),
    templateAmount: z.number({ error: recurringText.validation.amountRequired }).int(recurringText.validation.amountInvalid).positive(recurringText.validation.amountInvalid),
    templateWalletId: z.string().min(1, recurringText.validation.walletRequired),
    templateCategoryId: z.string().min(1, recurringText.validation.categoryRequired),
    templateChannelId: z.string(),
    templateNote: z.string().trim().max(200, recurringText.validation.noteTooLong),
  })
  .superRefine((values, context) => {
    if (values.frequency === 'monthly' && (values.day < 1 || values.day > 28)) {
      context.addIssue({ code: 'custom', path: ['day'], message: recurringText.validation.dayMonthly })
    }
    if (values.frequency === 'weekly' && (values.day < 1 || values.day > 7)) {
      context.addIssue({ code: 'custom', path: ['day'], message: recurringText.validation.dayWeekly })
    }
  })

export type RecurringFormValues = z.infer<typeof recurringFormSchema>
export type RecurringFormErrors = Partial<Record<keyof RecurringFormValues, string>>

export function collectRecurringErrors(error: z.ZodError): RecurringFormErrors {
  const errors: RecurringFormErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && errors[field as keyof RecurringFormErrors] === undefined) {
      errors[field as keyof RecurringFormErrors] = issue.message
    }
  }
  return errors
}
