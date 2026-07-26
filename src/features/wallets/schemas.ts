import { z } from 'zod'
import { walletsText } from '@/lib/ui-text'

// Form schemas (zod v4) for the wallets feature. Every message is a Bahasa
// string from ui-text; amounts are integer IDR (RULES.md — no floats).

export const walletFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, walletsText.validation.nameRequired)
    .max(40, walletsText.validation.nameTooLong),
  type: z.enum(['cash', 'bank', 'ewallet']),
  // GlassAmountInput emits number | null; an empty field means "start at zero".
  initialBalance: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .transform((value) => value ?? 0),
})

export type WalletFormValues = z.infer<typeof walletFormSchema>

export const transferFormSchema = z
  .object({
    fromWalletId: z.string().min(1, walletsText.validation.fromRequired),
    toWalletId: z.string().min(1, walletsText.validation.toRequired),
    // null (empty input) fails the type check with the "required" message.
    amount: z
      .number(walletsText.validation.amountRequired)
      .int(walletsText.validation.amountPositive)
      .positive(walletsText.validation.amountPositive),
    note: z.string().trim().max(200, walletsText.validation.noteTooLong),
  })
  // The UI already excludes the source from the destination picker; this is a
  // safety net so an invalid pair can never reach the repository.
  .refine((values) => values.fromWalletId !== values.toWalletId, {
    message: walletsText.validation.sameWallet,
    path: ['toWalletId'],
  })

export type TransferFormValues = z.infer<typeof transferFormSchema>

/**
 * Flattens a ZodError into a { field: firstMessage } record for GlassField
 * error props. Only the first issue per top-level field is kept.
 */
export function collectFieldErrors<K extends string>(error: z.ZodError): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && out[key as K] === undefined) {
      out[key as K] = issue.message
    }
  }
  return out
}

export type WalletFormErrors = Partial<Record<'name' | 'type' | 'initialBalance', string>>
export type TransferFormErrors = Partial<
  Record<'fromWalletId' | 'toWalletId' | 'amount' | 'note', string>
>
