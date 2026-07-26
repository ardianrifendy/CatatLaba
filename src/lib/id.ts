// UUIDv7 (RFC 9562) — client-generated, time-ordered identifiers.
//
// Layout: 48-bit big-endian Unix-ms timestamp, 4-bit version (0111), 12 random
// bits, 2-bit variant (10), 62 random bits. Because the timestamp is the most
// significant part, lexicographic string sort ≈ creation order — which is what
// we want for local-first inserts and as sortable, conflict-free sync keys.
//
// Caveat: there is no intra-millisecond monotonic counter, so two ids created
// within the SAME millisecond are unique but NOT ordered relative to each other.
// Acceptable for a single-user app where same-ms creation is rare; if strict
// intra-ms ordering is ever needed, swap the implementation behind `newId()`.

function formatUuid(bytes: Uint8Array): string {
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function uuidv7(): string {
  const ts = Date.now()
  const bytes = new Uint8Array(16)
  // 48-bit millisecond timestamp, big-endian, into bytes[0..5].
  bytes[0] = Math.floor(ts / 0x1_00_00_00_00_00) & 0xff
  bytes[1] = Math.floor(ts / 0x1_00_00_00_00) & 0xff
  bytes[2] = Math.floor(ts / 0x1_00_00_00) & 0xff
  bytes[3] = Math.floor(ts / 0x1_00_00) & 0xff
  bytes[4] = Math.floor(ts / 0x1_00) & 0xff
  bytes[5] = ts & 0xff
  // Random bytes[6..15].
  crypto.getRandomValues(bytes.subarray(6))
  // Version 7 in the high nibble of byte 6; variant (10xx) in byte 8.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  return formatUuid(bytes)
}

// Single seam every call site uses to mint an id. Keeps the concrete generator
// swappable (e.g. for a monotonic variant, or a deterministic one in tests).
export function newId(): string {
  return uuidv7()
}
