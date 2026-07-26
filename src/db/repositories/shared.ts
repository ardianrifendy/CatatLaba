import { type AppError, fromDbError } from '@/lib/errors'
import { newId } from '@/lib/id'
import { err, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'

// Runs a repository operation, translating any thrown SQLite error into an
// AppError (RULES.md: repositories never throw across their boundary). The
// operation itself returns a Result, so it can also signal domain outcomes such
// as NOT_FOUND without throwing.
export async function guard<T>(
  op: () => Promise<Result<T, AppError>>,
): Promise<Result<T, AppError>> {
  try {
    return await op()
  } catch (cause) {
    return err(fromDbError(cause))
  }
}

// Fresh convention-column values for a newly created row.
export function newRowMeta(): {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
} {
  const now = nowIso()
  return { id: newId(), createdAt: now, updatedAt: now, deletedAt: null }
}
