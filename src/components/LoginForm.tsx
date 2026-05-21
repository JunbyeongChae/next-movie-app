'use client';

import { useActionState } from 'react';
import { login } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">이메일</label>
        <Input type="email" name="email" placeholder="이메일" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">비밀번호</label>
        <Input type="password" name="password" placeholder="비밀번호 입력" required />
      </div>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
