// Application errors carry a stable machine code (UPPER_SNAKE, English — safe to
// switch on and to log) and a human message in Bahasa Indonesia (safe to show in
// a toast). `cause` keeps the original error for logging/debugging (RULES.md:
// no silent catches).
export type AppErrorCode =
  | 'DB_ERROR' // unexpected failure from the SQLite layer
  | 'CONFLICT' // uniqueness / constraint violation
  | 'NOT_FOUND' // expected row is missing
  | 'VALIDATION' // caller passed data that violates a domain rule

export interface AppError {
  readonly code: AppErrorCode
  readonly message: string
  readonly cause?: unknown
}

export function appError(code: AppErrorCode, message: string, cause?: unknown): AppError {
  return { code, message, cause }
}

export function notFound(message = 'Data tidak ditemukan.', cause?: unknown): AppError {
  return appError('NOT_FOUND', message, cause)
}

export function validationError(message: string, cause?: unknown): AppError {
  return appError('VALIDATION', message, cause)
}

// Flattens an error and every nested `cause` into one searchable string. Drizzle
// wraps driver errors in a DrizzleQueryError whose own message is only "Failed
// query: …" — the real "UNIQUE constraint failed" text lives one level down in
// `.cause`. Walk the chain so detection works regardless of wrapping depth.
function collectErrorText(cause: unknown): string {
  const parts: string[] = []
  let current: unknown = cause
  for (let depth = 0; current != null && depth < 8; depth++) {
    if (current instanceof Error) {
      parts.push(current.message)
      current = current.cause
    } else {
      parts.push(String(current))
      break
    }
  }
  return parts.join(' | ')
}

// Maps a caught (unknown) error from the SQLite layer to an AppError. A unique
// constraint violation becomes CONFLICT; everything else is DB_ERROR. Detection
// is best-effort by message substring — sql.js says "UNIQUE constraint failed"
// while @capacitor-community/sqlite surfaces the native SQLITE_CONSTRAINT_UNIQUE
// token, so we match either across the whole cause chain.
export function fromDbError(cause: unknown): AppError {
  const text = collectErrorText(cause)
  if (/unique constraint/i.test(text) || /SQLITE_CONSTRAINT/i.test(text)) {
    return appError('CONFLICT', 'Data sudah ada atau bentrok dengan data lain.', cause)
  }
  return appError('DB_ERROR', 'Terjadi kesalahan pada basis data.', cause)
}
