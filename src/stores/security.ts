import { create } from 'zustand'

export type LockType = 'none' | 'pin' | 'pattern' | 'password'

const SECURITY_STORAGE_KEY = 'catatlaba_security_config'

type SecurityConfig = {
  lockType: LockType
  passcodeHash: string
  biometricEnabled: boolean
}

type SecurityState = SecurityConfig & {
  isLocked: boolean
  setLockConfig: (type: LockType, secret: string, biometricEnabled?: boolean) => Promise<void>
  unlockWithSecret: (secret: string) => Promise<boolean>
  unlockWithBiometrics: () => boolean
  disableLock: () => void
  lockApp: () => void
}

async function hashSecret(secret: string): Promise<string> {
  if (!secret) return ''
  const msgUint8 = new TextEncoder().encode(secret + 'catatlaba_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function readStoredConfig(): SecurityConfig {
  if (typeof window === 'undefined') {
    return { lockType: 'none', passcodeHash: '', biometricEnabled: false }
  }
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        lockType: parsed.lockType || 'none',
        passcodeHash: parsed.passcodeHash || '',
        biometricEnabled: Boolean(parsed.biometricEnabled),
      }
    }
  } catch {}
  return { lockType: 'none', passcodeHash: '', biometricEnabled: false }
}

function persistConfig(config: SecurityConfig) {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(config))
  } catch {}
}

const initialConfig = readStoredConfig()

export const useSecurityStore = create<SecurityState>((set, get) => ({
  ...initialConfig,
  isLocked: initialConfig.lockType !== 'none',

  setLockConfig: async (lockType, secret, biometricEnabled = false) => {
    const passcodeHash = lockType !== 'none' ? await hashSecret(secret) : ''
    const config: SecurityConfig = { lockType, passcodeHash, biometricEnabled }
    persistConfig(config)
    set({ ...config, isLocked: false })
  },

  unlockWithSecret: async (secret) => {
    const { passcodeHash } = get()
    if (!passcodeHash) {
      set({ isLocked: false })
      return true
    }
    const hash = await hashSecret(secret)
    if (hash === passcodeHash) {
      set({ isLocked: false })
      return true
    }
    return false
  },

  unlockWithBiometrics: () => {
    const { biometricEnabled } = get()
    if (biometricEnabled) {
      set({ isLocked: false })
      return true
    }
    return false
  },

  disableLock: () => {
    const config: SecurityConfig = { lockType: 'none', passcodeHash: '', biometricEnabled: false }
    persistConfig(config)
    set({ ...config, isLocked: false })
  },

  lockApp: () => {
    const { lockType } = get()
    if (lockType !== 'none') {
      set({ isLocked: true })
    }
  },
}))
