import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/lib/auth.config';
import { loginSchema } from '@/schemas/auth.schema';
import { checkRateLimit, recordFailure, resetFailure } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

interface DbUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const { blocked } = checkRateLimit(email);
        if (blocked) {
          logger.warn(`[auth] 로그인 차단됨 (Rate Limit 초과):${email}`);
          return null;
        }

        const { rows } = await pool.query<DbUser>('SELECT id, email, name, password_hash FROM users WHERE email = $1', [email]);
        const user = rows[0];

        if (!user) {
          // 사용자가 없어도 bcrypt.compare()를 실행합니다.
          // 실행 시간을 일정하게 유지해 "이메일 존재 여부"가
          // 응답 속도로 노출되지 않도록 합니다(타이밍 공격 방어).
          //await bcrypt.compare(password, '$2a$12$dummyhashfortimingattackdefense')
          recordFailure(email);
          logger.warn(`[auth] 로그인 실패 (없는 이메일):${email}`);
          return null;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          recordFailure(email);
          logger.warn(`[auth] 로그인 실패:${email}`);
          return null;
        }

        resetFailure(email);
        logger.log(`[auth] 로그인 성공:${email}`);

        return { id: user.id, name: user.name, email: user.email };
      }
    })
  ]
});
