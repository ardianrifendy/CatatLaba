import { useLanguageStore } from '@/stores/language'
import { commonText as commonTextId } from './common'
import { controlsText as controlsTextId } from './controls'
import { walletsText as walletsTextId } from './wallets'
import { categoriesText as categoriesTextId } from './categories'
import { channelsText as channelsTextId } from './channels'
import { transactionsText as transactionsTextId } from './transactions'
import { productsText as productsTextId } from './products'
import { budgetsText as budgetsTextId } from './budgets'
import { reportsText as reportsTextId } from './reports'
import { recurringText as recurringTextId } from './recurring'

import {
  commonTextEn,
  walletsTextEn,
  categoriesTextEn,
  channelsTextEn,
  recurringTextEn,
  controlsTextEn,
  transactionsTextEn,
  productsTextEn,
  budgetsTextEn,
  reportsTextEn,
} from './locales/en'

function createLangProxy<T extends object>(idObj: T, enObj: unknown): T {
  return new Proxy(idObj, {
    get(_target, prop, _receiver) {
      const lang = useLanguageStore.getState().lang
      const targetObj = lang === 'en' && enObj ? (enObj as Record<string, unknown>) : (idObj as Record<string, unknown>)
      const val = targetObj[prop as string] ?? (idObj as Record<string, unknown>)[prop as string]
      const idVal = (idObj as Record<string, unknown>)[prop as string]

      if (typeof val === 'function') {
        return val
      }
      if (typeof val === 'object' && val !== null && typeof idVal === 'object' && idVal !== null) {
        return createLangProxy(idVal as object, val)
      }
      return val
    },
  })
}

export const commonText = createLangProxy(commonTextId, commonTextEn)
export const controlsText = createLangProxy(controlsTextId, controlsTextEn)
export const walletsText = createLangProxy(walletsTextId, walletsTextEn)
export const categoriesText = createLangProxy(categoriesTextId, categoriesTextEn)
export const channelsText = createLangProxy(channelsTextId, channelsTextEn)
export const recurringText = createLangProxy(recurringTextId, recurringTextEn)
export const transactionsText = createLangProxy(transactionsTextId, transactionsTextEn)
export const productsText = createLangProxy(productsTextId, productsTextEn)
export const budgetsText = createLangProxy(budgetsTextId, budgetsTextEn)
export const reportsText = createLangProxy(reportsTextId, reportsTextEn)
