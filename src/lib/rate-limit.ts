const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15분

interface AttemptRecord {
  count: number
  blockedUntil: number | null
}

// 서버 메모리 기반 저장소 (재시작 시 초기화 — 추후 Redis로 교체 가능)
const attempts = new Map<string, AttemptRecord>()

export function checkRateLimit(email: string): { blocked: boolean; remainingMs?: number } {
  const record = attempts.get(email)
  if (!record) return { blocked: false }

  if (record.blockedUntil !== null) {
    const remaining = record.blockedUntil - Date.now()
    if (remaining > 0) return { blocked: true, remainingMs: remaining }
    // 차단 기간이 지나면 초기화
    attempts.delete(email)
  }

  return { blocked: false }
}

export function recordFailure(email: string): void {
  const record = attempts.get(email) ?? { count: 0, blockedUntil: null }
  record.count += 1

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_DURATION_MS
  }

  attempts.set(email, record)
}

export function resetFailure(email: string): void {
  attempts.delete(email)
}
