// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth' // auth.ts에서 NextAuth의 API 핸들러들을 불러옵니다.

export const { GET, POST } = handlers // Next.js API 라우트에서 GET, POST 요청을 처리할 핸들러를 내보냅니다. (NextAuth가 자동으로 생성)