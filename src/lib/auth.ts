import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        // 하드코딩 계정 (임시) — 다음 단계에서 DB 조회로 교체
        if (credentials.email === 'admin@test.com' && credentials.password === '1234') {
          return {
            id: '1',
            name: '테스트 유저',
            email: 'admin@test.com'
          };
        }
        return null; // null 반환 시 로그인 실패
      }
    })
  ],
  pages: {
    signIn: '/login' // NextAuth 기본 로그인 페이지 대신 우리 페이지 사용
  }
});
