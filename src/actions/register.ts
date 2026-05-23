'use server';

import { registerSchema } from '@/schemas/auth.schema';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function register(_prevState: { error: string } | null, formData: FormData) {
  // 서버에서 한 번 더 검증합니다.
  // 클라이언트 검증은 UX를 위한 것이고, 서버 검증이 실제 보안입니다.
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  // 화면에서 입력된 검증된 값들
  const { name, email, password } = parsed.data;

  // 이메일 중복 확인
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (rows.length > 0) {
    return { error: '이미 사용 중인 이메일입니다.' };
  }

  // 비밀번호 해시
  // 숫자 12는 cost factor — 높을수록 안전하지만 느립니다. 10~12가 일반적입니다.
  const hash = await bcrypt.hash(password, 12);

  // DB에 저장 — 원본 비밀번호는 저장하지 않습니다
  await pool.query('INSERT INTO users (email, name, password_hash, created_at) VALUES ($1, $2, $3, NOW())', [email, name, hash]);

  // 회원가입 성공 → 로그인 페이지로 이동
  redirect('/login');
}
