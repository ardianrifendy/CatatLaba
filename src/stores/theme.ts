import { create } from 'zustand'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = Exclude<ThemeMode, 'system'>
export type AccentPreset = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate'

export const ACCENT_PRESETS: { id: AccentPreset; name: string; hex: string }[] = [
  { id: 'blue', name: 'iOS Blue', hex: '#007aff' },
  { id: 'emerald', name: 'Emerald Green', hex: '#10b981' },
  { id: 'violet', name: 'Royal Violet', hex: '#8b5cf6' },
  { id: 'amber', name: 'Sunset Amber', hex: '#f59e0b' },
  { id: 'rose', name: 'Rose Pink', hex: '#f43f5e' },
  { id: 'slate', name: 'Titanium Slate', hex: '#64748b' },
]

const THEME_STORAGE_KEY = 'catatlaba-theme'
const ACCENT_STORAGE_KEY = 'catatlaba-accent'
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

type ThemeState = {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  accent: AccentPreset
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentPreset) => void
}

let stopSystemListener: (() => void) | null = null

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const storedMode: unknown = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(storedMode) ? storedMode : 'system'
  } catch {
    return 'system'
  }
}

function readStoredAccent(): AccentPreset {
  if (typeof window === 'undefined') return 'blue'
  try {
    const stored: unknown = window.localStorage.getItem(ACCENT_STORAGE_KEY)
    const valid = ACCENT_PRESETS.some((a) => a.id === stored)
    return valid ? (stored as AccentPreset) : 'blue'
  } catch {
    return 'blue'
  }
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'system') return mode
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(theme: ResolvedTheme, accent: AccentPreset): void {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme

  const preset = ACCENT_PRESETS.find((a) => a.id === accent) || ACCENT_PRESETS[0]!
  document.documentElement.style.setProperty('--color-accent', preset.hex)
  document.documentElement.style.setProperty('--app-accent', preset.hex)
}

function persistMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {}
}

function persistAccent(accent: AccentPreset): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent)
  } catch {}
}

function syncSystemListener(mode: ThemeMode, accent: AccentPreset): void {
  stopSystemListener?.()
  stopSystemListener = null

  if (mode !== 'system' || typeof window === 'undefined') return

  const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
  const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    const resolvedTheme: ResolvedTheme = event.matches ? 'dark' : 'light'
    applyTheme(resolvedTheme, accent)
    useThemeStore.setState({ resolvedTheme })
  }

  mediaQuery.addEventListener('change', handleSystemThemeChange)
  stopSystemListener = () => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }
}

const initialMode = readStoredMode()
const initialAccent = readStoredAccent()
const initialResolvedTheme = resolveTheme(initialMode)

export const useThemeStore = create<ThemeState>()((set, get) => ({
  mode: initialMode,
  resolvedTheme: initialResolvedTheme,
  accent: initialAccent,
  setMode: (mode) => {
    const resolvedTheme = resolveTheme(mode)
    const { accent } = get()
    persistMode(mode)
    applyTheme(resolvedTheme, accent)
    set({ mode, resolvedTheme })
    syncSystemListener(mode, accent)
  },
  setAccent: (accent) => {
    const { resolvedTheme, mode } = get()
    persistAccent(accent)
    applyTheme(resolvedTheme, accent)
    set({ accent })
    syncSystemListener(mode, accent)
  },
}))

export function initializeTheme(): void {
  const { mode, resolvedTheme, accent } = useThemeStore.getState()
  applyTheme(resolvedTheme, accent)
  syncSystemListener(mode, accent)
}
