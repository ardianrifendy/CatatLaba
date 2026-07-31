import { z } from 'zod'
import { transactionsText } from '@/lib/ui-text'

export const TRANSACTION_NONE = 'none'

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function isValidCalendarDate(value: string): boolean {
  const match = CALENDAR_DATE.exec(value)
  if (match === null) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const candidate = new Date(Date.UTC(year, month - 1, day))
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

export const transactionItemFormSchema = z.object({
  productId: z.string().min(1, transactionsText.validation.productRequired),
  qty: z
    .number(transactionsText.validation.itemQtyRequired)
    .int(transactionsText.validation.itemQtyPositive)
    .positive(transactionsText.validation.itemQtyPositive),
  unitPrice: z
    .number(transactionsText.validation.itemPriceRequired)
    .int(transactionsText.validation.itemPricePositive)
    .positive(transactionsText.validation.itemPricePositive),
})

export const transactionFormSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z
      .number(transactionsText.validation.amountRequired)
      .int(transactionsText.validation.amountPositive)
      .positive(transactionsText.validation.amountPositive),
    walletId: z.string().min(1, transactionsText.validation.walletRequired),
    counterWalletId: z.string(),
    categoryId: z.string(),
    channelId: z.string(),
    date: z
      .string()
      .min(1, transactionsText.validation.dateRequired)
      .refine(isValidCalendarDate, transactionsText.validation.dateInvalid),
    note: z.string().trim().max(200, transactionsText.validation.noteTooLong),
    items: z.array(transactionItemFormSchema).default([]),
  })
  .superRefine((values, context) => {
    if (values.type === 'transfer') {
      if (values.counterWalletId === '') {
        context.addIssue({
          code: 'custom',
          path: ['counterWalletId'],
          message: transactionsText.validation.counterWalletRequired,
        })
      } else if (values.walletId === values.counterWalletId) {
        context.addIssue({
          code: 'custom',
          path: ['counterWalletId'],
          message: transactionsText.validation.sameWallet,
        })
      }
    } else if (values.categoryId === '') {
      context.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: transactionsText.validation.categoryRequired,
      })
    }

    if (values.type === 'transfer' && values.items.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['items'],
        message: transactionsText.validation.transferItems,
      })
    }

    if (values.type !== 'transfer' && values.items.length > 0) {
      const itemsTotal = values.items.reduce((total, item) => total + item.qty * item.unitPrice, 0)
      if (itemsTotal !== values.amount) {
        context.addIssue({
          code: 'custom',
          path: ['items'],
          message: transactionsText.validation.itemsTotalMismatch,
        })
      }
    }
  })

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
export type TransactionFormErrors = Partial<
  Record<'amount' | 'walletId' | 'counterWalletId' | 'categoryId' | 'date' | 'note' | 'items', string>
>

export function collectTransactionErrors(error: z.ZodError): TransactionFormErrors {
  const errors: TransactionFormErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && field in errors === false) {
      errors[field as keyof TransactionFormErrors] = issue.message
    }
  }
  return errors
}
