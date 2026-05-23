import type { NextAuthConfig } from 'next-auth'

// Edge Runtime(미들웨어)과 공유되는 설정 — Node.js 전용 모듈 import 금지
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = nextUrl.pathname.startsWith('/favorites')
      if (isProtected && !isLoggedIn) return false
      return true
    },
  },
  providers: [],
}
