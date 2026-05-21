'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false // 직접 리다이렉트 제어
    });

    if (result?.error) {
      setError('이메일 또는 비밀번호가 틀렸습니다.');
    } else {
      window.location.href = '/';
    }

    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">이메일</label>
        <Input type="email" name="email" placeholder="admin@test.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">비밀번호</label>
        <Input type="password" name="password" placeholder="비밀번호 입력" required />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
