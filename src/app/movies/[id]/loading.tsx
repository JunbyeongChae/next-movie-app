// src/app/movies/[id]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

// src/app/movies/[id]/loading.tsx — 진단용 임시 코드
export default function Loading() {
  return (
    <div className="flex gap-8">
      <p className="text-2xl font-bold text-red-500">로딩 중...</p>  {/* ← 임시 추가 */}
      <Skeleton className="w-64 aspect-[2/3] rounded-lg flex-shrink-0" />
      ...
    </div>
  )
}