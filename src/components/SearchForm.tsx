'use client';

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
    formState: { errors }
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: searchParams.get('query') ?? '' // URL의 현재 검색어를 기본값으로
    }
  });

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
