import { z } from 'zod'

/**
 * Environment validation (RULES.md). Supabase powers cloud sync (Phase 7);
 * the app is local-first and boots fully offline without it, so the vars are
 * optional here but their FORMAT is validated when present (fail-fast).
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  throw new Error(`INVALID_ENV: environment variables failed validation:\n${issues}`)
}

export const env = parsed.data

export const hasSupabaseConfig: boolean =
  Boolean(env.VITE_SUPABASE_URL) && Boolean(env.VITE_SUPABASE_ANON_KEY)

/** Supabase config for the sync layer (Phase 7); throws a typed error if unset. */
export function requireSupabaseConfig(): { url: string; anonKey: string } {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error(
      'SUPABASE_NOT_CONFIGURED: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud sync',
    )
  }
  return { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY }
}
