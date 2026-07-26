// All timestamps are stored as ISO-8601 UTC text (SCHEMA.md / RULES.md); the UI
// renders them in the device timezone. Centralising the "now" call keeps the
// storage format consistent and makes it trivial to mock in tests.
export function nowIso(): string {
  return new Date().toISOString()
}
