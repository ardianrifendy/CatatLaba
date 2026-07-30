import { create } from 'zustand'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = Exclude<ThemeMode, 'system'>

const THEME_STORAGE_KEY = 'catatlaba-theme'
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

type ThemeState = {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
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

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'system') return mode
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

function persistMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // Theme selection still works for this session when storage is unavailable.
  }
}

function syncSystemListener(mode: ThemeMode): void {
  stopSystemListener?.()
  stopSystemListener = null

  if (mode !== 'system' || typeof window === 'undefined') return

  const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
  const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    const resolvedTheme: ResolvedTheme = event.matches ? 'dark' : 'light'
    applyTheme(resolvedTheme)
    useThemeStore.setState({ resolvedTheme })
  }

  mediaQuery.addEventListener('change', handleSystemThemeChange)
  stopSystemListener = () => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }
}

const initialMode = readStoredMode()
const initialResolvedTheme = resolveTheme(initialMode)

export const useThemeStore = create<ThemeState>()((set) => ({
  mode: initialMode,
  resolvedTheme: initialResolvedTheme,
  setMode: (mode) => {
    const resolvedTheme = resolveTheme(mode)
    persistMode(mode)
    applyTheme(resolvedTheme)
    set({ mode, resolvedTheme })
    syncSystemListener(mode)
  },
}))

/**
 * Applies the persisted theme before the application renders and keeps System
 * mode synchronized with operating-system appearance changes.
 */
export function initializeTheme(): void {
  const { mode, resolvedTheme } = useThemeStore.getState()
  applyTheme(resolvedTheme)
  syncSystemListener(mode)
}

