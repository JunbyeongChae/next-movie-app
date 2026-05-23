import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { timingSafeEqual } from 'crypto'
import { authConfig } from '@/lib/auth.config'
import { loginSchema } from '@/schemas/auth.schema'
import { checkRateLimit, recordFailure, resetFailure } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    // 길이가 다르면 즉시 false지만, 더미 비교로 소요 시간을 고정해 타이밍 공격 방어
    if (bufA.length !== bufB.length) {
      timingSafeEqual(bufA, bufA)
      return false
    }
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const { blocked } = checkRateLimit(email)
        if (blocked) {
          logger.warn(`[auth] 로그인 차단됨 (Rate Limit 초과): ${email}`)
          return null
        }

        const adminEmail = process.env.ADMIN_EMAIL ?? ''
        const adminPassword = process.env.ADMIN_PASSWORD ?? ''

        // 이메일 불일치 시에도 항상 비밀번호 비교까지 수행 (타이밍 공격 방어)
        const emailMatch = safeEqual(email, adminEmail)
        const passwordMatch = safeEqual(password, adminPassword)

        if (!emailMatch || !passwordMatch) {
          recordFailure(email)
          logger.warn(`[auth] 로그인 실패: ${email}`)
          return null
        }

        resetFailure(email)
        logger.log(`[auth] 로그인 성공: ${email}`)

        return { id: '1', name: '테스트 유저', email: adminEmail }
      },
    }),
  ],
})
