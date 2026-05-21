# Step 6 — 검색 페이지

> 예상 소요 시간: 20분

---

## 이 단계의 핵심 목표

- 검색어를 URL 파라미터(`?query=`)에 저장하는 이유를 안다
- `searchParams`(서버)와 `useSearchParams`(클라이언트)의 역할 차이를 이해한다
- `useSearchParams`를 쓰는 컴포넌트를 `<Suspense>`로 감싸야 하는 이유를 안다

---

## 이 단계에서 만드는 것

영화 제목으로 검색하는 페이지(`/search`)를 구현합니다.

검색은 두 부분으로 나뉩니다.
- **SearchForm** — 사용자가 입력하고 제출하는 폼 (`'use client'`, Zod + RHF)
- **page.tsx** — 검색 결과 표시 (서버 컴포넌트, URL 파라미터 기반)

---

## 검색 흐름과 URL 파라미터

```
사용자가 검색어 입력 → 폼 제출
→ URL이 /search?query=인셉션 으로 변경
→ Next.js가 page.tsx를 다시 실행
→ URL의 query 파라미터로 TMDB 검색 API 호출
→ 결과 표시
```

검색어를 **URL 파라미터**(`?query=`)에 저장합니다. 이렇게 하면 검색 결과 URL을 공유할 수 있고, 뒤로 가기 버튼이 자연스럽게 동작합니다.

**`searchParams` vs `useSearchParams`**

URL 쿼리 파라미터를 읽는 방법은 컴포넌트 종류에 따라 다릅니다.

```
URL: /search?query=인셉션
```

```tsx
// 서버 컴포넌트 — page.tsx의 props로 전달
export default async function SearchPage({ searchParams }) {
  const { query } = await searchParams  // { query: '인셉션' }
}

// 클라이언트 컴포넌트 — 훅으로 읽음
'use client'
export default function SearchForm() {
  const searchParams = useSearchParams()
  const query = searchParams.get('query')  // '인셉션'
}
```
**`<Suspense>`로 감싸야 하는 이유**

`useSearchParams`는 React 훅이므로 `'use client'` 컴포넌트에서만 사용할 수 있습니다. 그런데 `<Suspense>` 없이 쓰면 Next.js가 페이지 전체를 동적 렌더링으로 강제 전환하며 빌드 시 경고를 냅니다.

`<Suspense>`로 감싸면 경계 바깥(`page.tsx`)은 서버에서 정적으로 렌더링되고, 경계 안쪽(`SearchForm`)만 브라우저에서 실행됩니다. 서버도 URL을 알고 있지만(`searchParams` props), `useSearchParams` 훅 자체는 브라우저 런타임이 필요하기 때문입니다.

```tsx
// ❌ Suspense 없음 — 서버 렌더링 시 에러
<SearchForm />

// ✅ Suspense로 감쌈 — 서버는 건너뛰고 브라우저에서 실행
<Suspense>
  <SearchForm />
</Suspense>
```

---

## 파일 연결 구조

```
src/lib/
└── tmdb.ts                ← searchMovies 추가

src/schemas/
└── search.schema.ts       ← 검색 폼 유효성 규칙

src/components/
└── SearchForm.tsx          ← 검색 입력 폼 ('use client', RHF + Zod)

src/app/search/
└── page.tsx                ← 검색 결과 페이지 (서버 컴포넌트)
```
```
page.tsx (서버 컴포넌트)
├── <Suspense>
│   └── <SearchForm />     ← 클라이언트 컴포넌트 (useSearchParams 사용)
└── <MovieList movies={movies} />
```

---

## 1. tmdb.ts — searchMovies 추가

**`src/lib/tmdb.ts`에 함수를 추가합니다.**

`searchMovies`는 TMDB의 `/search/movie` 엔드포인트를 호출합니다. 검색어를 `encodeURIComponent`로 인코딩해 한글 등 특수문자가 URL에 안전하게 전달되도록 합니다.

> **`page.tsx`에서 `await searchParams`로 받은 `query`는 Next.js가 이미 URL 디코딩한 값입니다.** `searchMovies` 내부에서 재인코딩하므로 이중 인코딩 없이 정확하게 전달됩니다.

```ts
// src/lib/tmdb.ts — 기존 함수들 아래에 추가
export async function searchMovies(query: string) {
  const data = await tmdbFetch<{ results: Movie[] }>(
    '/search/movie',
    `&query=${encodeURIComponent(query)}`
  )
  return data.results
}
```

---

## 2. Zod 스키마

**`src/schemas/search.schema.ts` 파일을 새로 생성합니다.**

```tsx
// src/schemas/search.schema.ts
import { z } from 'zod'

export const searchSchema = z.object({
  query: z.string().min(1, '검색어를 입력하세요').max(50),
})

export type SearchFormValues = z.infer<typeof searchSchema>
```

---

## 3. SearchForm.tsx — 검색 폼

**`src/components/SearchForm.tsx` 파일을 새로 생성합니다.**

폼 제출 시 `router.push`로 URL을 변경합니다. URL이 바뀌면 Next.js가 `page.tsx`를 다시 실행해 새 검색 결과를 가져옵니다.   

`useSearchParams()`로 현재 URL의 `query` 값을 읽어 폼의 기본값으로 설정합니다. 페이지를 새로고침해도 검색어가 입력창에 남아 있습니다.

```tsx
// src/components/SearchForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchSchema, type SearchFormValues } from '@/schemas/search.schema'

export default function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { register, handleSubmit, formState: { errors } } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: searchParams.get('query') ?? '',  // URL의 현재 검색어를 기본값으로
    },
  })

  function onSubmit(data: SearchFormValues) {
    router.push(`/search?query=${encodeURIComponent(data.query)}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <div className="flex-1">
        <Input
          {...register('query')}
          placeholder="영화 제목을 입력하세요"
        />
        {errors.query && (
          <p className="text-sm text-destructive mt-1">{errors.query.message}</p>
        )}
      </div>
      <Button type="submit">검색</Button>
    </form>
  )
}
```

---

## 4. page.tsx — 검색 페이지

**`src/app/search/page.tsx` 파일을 새로 생성합니다.**

`searchParams`는 `params`와 마찬가지로 Next.js 15부터 `Promise` 타입입니다. `await`로 풀어야 합니다.

`query`가 없으면(첫 진입 시) 빈 배열을 반환합니다. TMDB를 불필요하게 호출하지 않습니다.

```tsx
// src/app/search/page.tsx
import { searchMovies } from '@/lib/tmdb'
import MovieList from '@/components/MovieList'
import SearchForm from '@/components/SearchForm'
import { Suspense } from 'react'

interface SearchPageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { query } = await searchParams

  const movies = query ? await searchMovies(query) : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">검색</h1>

      {/* SearchForm은 useSearchParams를 사용하므로 Suspense로 감싸야 합니다 */}
      <Suspense>
        <SearchForm />
      </Suspense>

      {query && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">&quot;{query}&quot;</span> 검색 결과 {movies.length}건
        </p>
      )}

      {query && <MovieList movies={movies} />}
    </div>
  )
}
```

---

## 확인

```bash
npm run dev
```

1. `/search` 페이지에서 영화 제목을 입력하고 검색합니다.
2. URL이 `/search?query=인셉션` 형태로 바뀝니다.
3. 검색 결과가 표시됩니다.
4. 검색어 없이 제출하면 “검색어를 입력하세요” 에러 메시지가 나타납니다.
5. 브라우저 뒤로 가기로 이전 검색 결과로 돌아갑니다.

---

## 이 단계에서 만든 것
| 파일 | 역할 |
| --- | --- |
| `src/lib/tmdb.ts` | `searchMovies` 함수 추가 |
| `src/schemas/search.schema.ts` | 검색 폼 Zod 스키마 |
| `src/components/SearchForm.tsx` | 검색 폼 (`'use client'`, RHF + Zod) |
| `src/app/search/page.tsx` | 검색 결과 페이지 (서버 컴포넌트) |