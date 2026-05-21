'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchSchema, type SearchFormValues } from '@/schemas/search.schema';

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: searchParams.get('query') ?? ''
    }
  });

  // 입력 중일 때 브라우저 이탈 방지
  useEffect(() => {
    if (!isDirty) return; // 입력이 없으면 이벤트 등록하지 않음

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 브라우저가 기본 확인 메시지를 표시함
    };

    window.addEventListener('beforeunload', handler);

    // cleanup: 컴포넌트 언마운트 시 또는 isDirty 변경 시 이벤트 제거
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]); // isDirty가 바뀔 때마다 재등록

  function onSubmit(data: SearchFormValues) {
    router.push(`/search?query=${encodeURIComponent(data.query)}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <div className="flex-1">
        <Input {...register('query')} placeholder="영화 제목을 입력하세요" />
        {errors.query && <p className="text-sm text-destructive mt-1">{errors.query.message}</p>}
      </div>
      <Button type="submit">검색</Button>
    </form>
  );
}
