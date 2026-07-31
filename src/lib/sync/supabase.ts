import { Capacitor } from '@capacitor/core'
import { requireSupabaseConfig } from '@/lib/env'
import { commonText } from '@/lib/ui-text'
import type { SyncSession } from './types'

const sessionKey = 'catatlaba.supabase.session.v1'
const timeoutMs = 15_000

interface AuthPayload {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email?: string | null }
}

export function loadSession(): SyncSession | null {
  try {
    const raw = window.localStorage.getItem(sessionKey)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!isSession(value)) return null
    return value
  } catch {
    return null
  }
}

export function saveSession(session: SyncSession): void {
  window.localStorage.setItem(sessionKey, JSON.stringify(session))
}

export function clearSession(): void {
  window.localStorage.removeItem(sessionKey)
}

export function getGoogleOAuthUrl(redirectTo?: string): string {
  const config = requireSupabaseConfig()
  let redirect = redirectTo
  if (!redirect) {
    const isNative = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && window.location?.origin?.includes('localhost') && window.navigator?.userAgent?.includes('Android'))
    if (isNative) {
      redirect = 'com.catatlaba.app://google-auth'
    } else if (typeof window !== 'undefined' && window.location?.origin) {
      redirect = window.location.origin
    } else {
      redirect = 'com.catatlaba.app://google-auth'
    }
  }
  return `${config.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`
}

export function parseOAuthCallbackFromUrl(customUrl?: string): SyncSession | null {
  try {
    const targetUrl = customUrl ?? (typeof window !== 'undefined' ? window.location.href : '')
    if (!targetUrl || !targetUrl.includes('access_token=')) return null
    
    // Extract fragment/hash or search params after # or ?
    const hashIndex = targetUrl.indexOf('#')
    const queryIndex = targetUrl.indexOf('?')
    const splitIndex = hashIndex !== -1 ? hashIndex : queryIndex
    if (splitIndex === -1) return null

    const paramsStr = targetUrl.substring(splitIndex + 1)
    const params = new URLSearchParams(paramsStr)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const expiresInRaw = params.get('expires_in')
    
    if (!accessToken || !refreshToken) return null
    
    const expiresIn = expiresInRaw ? parseInt(expiresInRaw, 10) : 3600
    
    // Parse JWT to extract user ID & email
    const parts = accessToken.split('.')
    let userId = ''
    let email: string | null = null
    if (parts.length >= 2 && parts[1]) {
      try {
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        const payload = JSON.parse(payloadStr)
        userId = payload.sub ?? ''
        email = payload.email ?? null
      } catch {
        // Fallback
      }
    }
    
    if (!userId) return null
    
    const session: SyncSession = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      userId,
      email,
    }
    
    saveSession(session)
    if (!customUrl && typeof window !== 'undefined') {
      // Clean URL hash
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    return session
  } catch {
    return null
  }
}

export async function signInWithPassword(identifier: string, password: string): Promise<SyncSession> {
  const config = requireSupabaseConfig()
  const payload = await requestJson<AuthPayload>(`${config.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(config.anonKey),
    body: JSON.stringify({ email: identifier, password }),
  })
  const session = sessionFromPayload(payload)
  saveSession(session)
  return session
}

export async function signUpWithPassword(
  email: string,
  password: string,
  fullName?: string,
  phone?: string,
  captchaToken?: string,
): Promise<SyncSession | null> {
  const config = requireSupabaseConfig()
  const payload = await requestJson<AuthPayload | { user: { id: string; email?: string | null } }>(
    `${config.url}/auth/v1/signup`,
    {
      method: 'POST',
      headers: authHeaders(config.anonKey),
      body: JSON.stringify({
        email,
        password,
        gotrue_meta_security: captchaToken ? { captcha_token: captchaToken } : undefined,
        data: {
          full_name: fullName ?? null,
          phone_number: phone ?? null,
        },
      }),
    },
  )
  if (!('access_token' in payload)) return null
  const session = sessionFromPayload(payload)
  saveSession(session)
  return session
}

export async function verifyOtp(email: string, token: string): Promise<SyncSession> {
  const config = requireSupabaseConfig()
  // Supabase Auth verify endpoint supports type 'signup' or 'email' for OTP confirmation
  let payload: AuthPayload
  try {
    payload = await requestJson<AuthPayload>(`${config.url}/auth/v1/verify`, {
      method: 'POST',
      headers: authHeaders(config.anonKey),
      body: JSON.stringify({ type: 'signup', email, token }),
    })
  } catch {
    payload = await requestJson<AuthPayload>(`${config.url}/auth/v1/verify`, {
      method: 'POST',
      headers: authHeaders(config.anonKey),
      body: JSON.stringify({ type: 'email', email, token }),
    })
  }
  const session = sessionFromPayload(payload)
  saveSession(session)
  return session
}

export async function signOut(session: SyncSession): Promise<void> {
  const config = requireSupabaseConfig()
  await requestJson<unknown>(`${config.url}/auth/v1/logout`, {
    method: 'POST', headers: { ...authHeaders(config.anonKey), Authorization: `Bearer ${session.accessToken}` },
  })
  clearSession()
}

export async function supabaseRequest<T>(
  path: string,
  session: SyncSession,
  init: RequestInit = {},
): Promise<T> {
  const config = requireSupabaseConfig()
  return requestJson<T>(`${config.url}${path}`, {
    ...init,
    headers: { ...authHeaders(config.anonKey), Authorization: `Bearer ${session.accessToken}`, ...init.headers },
  })
}

function authHeaders(anonKey: string): HeadersInit {
  return { apikey: anonKey, 'Content-Type': 'application/json' }
}

function sessionFromPayload(payload: AuthPayload): SyncSession {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    userId: payload.user.id,
    email: payload.user.email ?? null,
  }
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const msg = remoteMessage(body)
      throw new Error(msg ?? commonText.settings.sync.requestFailed(response.status))
    }
    return body as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(commonText.settings.sync.requestTimeout)
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Gagal terhubung ke server. Pastikan koneksi internet HP Anda aktif.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

function remoteMessage(value: unknown): string | null {
  if (!isRecord(value)) return null
  const message = value.message ?? value.error_description ?? value.msg ?? value.error
  if (typeof message === 'string') {
    if (message.includes('User already registered')) return 'Email ini sudah terdaftar. Silakan Masuk.'
    if (message.includes('Password should be at least')) return 'Kata sandi minimal 6 karakter.'
    if (message.includes('Invalid login credentials')) return 'Email atau kata sandi salah.'
    if (message.includes('invalid-input-secret')) return 'Verifikasi Cloudflare gagal: Secret Key pada Supabase Dashboard tidak cocok dengan Site Key Turnstile.'
    if (message.includes('captcha protection')) return 'Verifikasi keamanan Turnstile gagal. Silakan centang tombol verifikasi di atas.'
    return message
  }
  return null
}

function isSession(value: unknown): value is SyncSession {
  if (!isRecord(value)) return false
  return typeof value.accessToken === 'string' && typeof value.refreshToken === 'string' &&
    typeof value.expiresAt === 'number' && typeof value.userId === 'string' &&
    (typeof value.email === 'string' || value.email === null)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
