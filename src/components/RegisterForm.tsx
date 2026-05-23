'use client';

import { useActionState } from 'react';
import { register } from '@/actions/register';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterForm() {
  // useActionState(실행할_Server_Action, 초기_상태)
  // state     — register() 가 return한 값 (예: { error: '...' })
  // formAction — form의 action 속성에 넣을 함수
  // isPending  — 서버 요청 중이면 true
  const [state, formAction, isPending] = useActionState(register, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">이름</label>
        <Input type="text" name="name" placeholder="홍길동" autoComplete="name" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">이메일</label>
        <Input type="email" name="email" placeholder="hong@example.com" autoComplete="email" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">비밀번호</label>
        <Input type="password" name="password" placeholder="8자 이상" autoComplete="new-password" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
        <Input type="password" name="confirmPassword" autoComplete="new-password" />
      </div>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  );
}
