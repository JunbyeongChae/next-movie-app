import { z } from 'zod';

export const searchSchema = z.object({
  query: z.string().min(1, '검색어를 입력하세요').max(50)
});

export type SearchFormValues = z.infer<typeof searchSchema>;
