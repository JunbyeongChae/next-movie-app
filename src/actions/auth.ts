'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 하드코딩 계정 (임시)
const FAKE_USER = {
  email: 'admin@test.com',
  password: '1234'
};

export async function login(_: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email === FAKE_USER.email && password === FAKE_USER.password) {
    const cookieStore = await cookies();
    cookieStore.set('session', email, {
      httpOnly: true, // JavaScript로 접근 불가 (XSS 방어)
      maxAge: 60 * 60 * 24, // 24시간
      path: '/'
    });
    redirect('/');
  }

  return { error: '이메일 또는 비밀번호가 틀렸습니다.' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}
