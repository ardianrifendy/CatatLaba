import { create } from 'zustand'

export type LanguageCode = 'id' | 'en'

export const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
]

const LANG_STORAGE_KEY = 'catatlaba_language'

function readStoredLang(): LanguageCode {
  if (typeof window === 'undefined') return 'id'
  try {
    const lang = localStorage.getItem(LANG_STORAGE_KEY)
    if (lang === 'en' || lang === 'id') return lang
  } catch {}
  return 'id'
}

type LanguageState = {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: readStoredLang(),
  setLang: (lang) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {}
    set({ lang })
  },
}))

export function getAppLanguage(): LanguageCode {
  return useLanguageStore.getState().lang
}

export function saveAppLanguage(lang: LanguageCode): void {
  useLanguageStore.getState().setLang(lang)
}
