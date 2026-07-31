import { z } from 'zod'
import { productsText } from '@/lib/ui-text'

const nullableNonNegativeInteger = z
  .number()
  .int(productsText.validation.salePriceInvalid)
  .nonnegative(productsText.validation.salePriceInvalid)
  .nullable()

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, productsText.validation.nameRequired)
    .max(80, productsText.validation.nameTooLong),
  sku: z
    .string()
    .trim()
    .max(60, productsText.validation.skuTooLong)
    .transform((value) => (value === '' ? null : value)),
  unit: z
    .string()
    .trim()
    .min(1, productsText.validation.unitRequired)
    .max(20, productsText.validation.unitTooLong),
  salePrice: nullableNonNegativeInteger.refine(
    (value) => value !== null,
    productsText.validation.salePriceRequired,
  ),
  stockQty: z
    .number()
    .int('Stok harus berupa angka')
    .min(0, 'Stok tidak boleh negatif')
    .default(0),
})

export type ProductFormValues = z.output<typeof productFormSchema>

export type ProductFormErrors = Partial<Record<'name' | 'sku' | 'unit' | 'salePrice' | 'stockQty', string>>

export function collectProductFieldErrors(error: z.ZodError): ProductFormErrors {
  const errors: ProductFormErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (
      (field === 'name' || field === 'sku' || field === 'unit' || field === 'salePrice' || field === 'stockQty') &&
      errors[field] === undefined
    ) {
      errors[field] = issue.message
    }
  }
  return errors
}
