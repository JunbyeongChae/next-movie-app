# Step 2 — 홈 페이지 — 인기 영화 목록

> 예상 소요 시간: 25분

---

## 이 단계의 핵심 목표

- 서버 컴포넌트가 `async/await`로 직접 데이터를 fetch할 수 있다는 것을 체감한다
- `loading.tsx` 파일 하나로 로딩 UI가 자동 처리되는 구조를 이해한다
- `<img>` / `<a>` 대신 `next/image` / `next/link`를 써야 하는 이유를 안다

---

## 이 단계에서 만드는 것

홈 화면(`/`)에 인기 영화 목록을 표시합니다.

| 파일 | 역할 |
|---|---|
| `next.config.ts` | 외부 이미지 호스트(`image.tmdb.org`) 허용 |
| `src/components/MovieCard.tsx` | 영화 카드 UI (서버 컴포넌트) |
| `src/components/MovieList.tsx` | 카드 그리드 목록 (서버 컴포넌트) |
| `src/app/loading.tsx` | 홈 로딩 Skeleton |
| `src/app/page.tsx` | 홈 페이지 — TMDB 인기 영화 fetch |

---

## 서버에서 데이터를 fetch하면 어떻게 다른가

**CSR 방식 — 브라우저가 데이터를 직접 요청**

1. 사용자가 접속하면 브라우저는 먼저 빈 화면을 그립니다
2. 자바스크립트를 다운로드하고 실행해 TMDB API에 데이터를 요청합니다
3. 데이터를 기다리는 동안 로딩 스피너를 보여줘야 합니다

**서버 컴포넌트 방식 — 서버가 데이터를 미리 받아서 완성된 HTML을 전송**

1. 사용자가 접속 요청을 하면, Next.js 서버가 먼저 TMDB API에 직접 요청합니다
2. 서버는 받아온 데이터로 **완성된 HTML**을 만듭니다
3. 브라우저는 완성된 결과물을 받아 바로 화면을 표시합니다 — 로딩 스피너 불필요

---

## 파일 연결 구조

```
next.config.ts       ← 외부 이미지 호스트(image.tmdb.org) 허용 설정

src/app/
├── page.tsx         ← TMDB에서 데이터를 fetch하고 MovieList에 전달
└── loading.tsx      ← page.tsx가 응답을 기다리는 동안 자동으로 대신 표시

src/components/
├── MovieList.tsx    ← 영화 배열을 그리드로 나열
└── MovieCard.tsx    ← 영화 한 장을 카드로 표시
```

```
page.tsx
└── <MovieList movies={movies} />
    └── <MovieCard movie={movie} />
```

---

## 1. next.config.ts — 외부 이미지 호스트 허용

**`next.config.ts`에 아래 내용을 추가합니다. (프로젝트 루트에 있는 파일)**

`next/image`는 보안상 외부 URL의 이미지를 기본적으로 차단합니다.
TMDB 포스터 이미지(`image.tmdb.org`)를 사용하려면 허용할 호스트를 명시해야 합니다.
설정을 추가하지 않으면 런타임에서 오류가 발생합니다.

```tsx
// next.config.ts
const nextConfig: NextConfig = {
  // ↓ 이 블록을 추가합니다
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
}
```

> **설정 변경 후 개발 서버를 재시작해야 적용됩니다.**

---

## 2. MovieCard.tsx — 영화 카드 UI

**`src/components/MovieCard.tsx` 파일을 새로 생성합니다.**

포스터·제목·평점을 보여주는 순수 UI 컴포넌트입니다.
`useState`도 이벤트 핸들러도 없으므로 서버 컴포넌트입니다.

Next.js에서는 `<img>`, `<a>` 태그를 그대로 쓰지 않습니다.

```tsx
// ❌ 기본 HTML — 이미지 최적화 없음, 페이지 전체가 새로 로드됨
<a href={`/movies/${movie.id}`}>
  <img src={getPosterUrl(movie.poster_path)} alt={movie.title} />
</a>

// ✅ Next.js — 이미지 자동 최적화(WebP 변환·크기 조정), 필요한 부분만 업데이트
<Link href={`/movies/${movie.id}`}>
  <Image src={getPosterUrl(movie.poster_path)} alt={movie.title} fill />
</Link>
```

```tsx
// src/components/MovieCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { getPosterUrl } from '@/lib/tmdb'
import type { Movie } from '@/types/movie.types'

interface MovieCardProps {
  movie: Movie
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movies/${movie.id}`} className="block group">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="relative aspect-2/3">
          <Image
            src={getPosterUrl(movie.poster_path)}
            alt={movie.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            priority
          />
        </div>
        <div className="p-3">
          <h3 className="font-medium line-clamp-1">{movie.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">
              {movie.release_date?.slice(0, 4)}
            </span>
            <Badge variant="secondary">
              ⭐ {movie.vote_average.toFixed(1)}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

---

## 3. MovieList.tsx — 카드 목록

**`src/components/MovieList.tsx` 파일을 새로 생성합니다.**

`MovieCard`를 배열로 받아 그리드로 나열하는 역할만 담당합니다.
상태나 이벤트가 없으므로 서버 컴포넌트입니다.

```tsx
// src/components/MovieList.tsx
import MovieCard from './MovieCard'
import type { Movie } from '@/types/movie.types'

interface MovieListProps {
  movies: Movie[]
}

export default function MovieList({ movies }: MovieListProps) {
  if (movies.length === 0) {
    return <p className="text-center text-muted-foreground py-12">표시할 영화가 없습니다.</p>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}
```

---

## 4. loading.tsx — 로딩 Skeleton

**`src/app/loading.tsx` 파일을 새로 생성합니다.**

`page.tsx`가 TMDB 응답을 기다리는 동안 Next.js가 이 파일을 자동으로 화면에 표시합니다.
`page.tsx`와 **같은 폴더에 `loading.tsx`라는 이름으로 두기만 하면** Next.js가 자동으로 연결합니다.

```tsx
// src/app/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-2/3 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
```

---

## 5. page.tsx — 홈 페이지

**`src/app/page.tsx`의 기존 내용을 모두 지우고 아래 코드로 교체합니다.**

서버 컴포넌트는 `async` 함수로 선언할 수 있습니다.
`fetchPopularMovies()`가 완료된 뒤 `MovieList`에 결과를 전달하고, 완성된 HTML이 브라우저로 전송됩니다.

```tsx
// src/app/page.tsx
import { fetchPopularMovies } from '@/lib/tmdb'
import MovieList from '@/components/MovieList'

export default async function HomePage() {
  const movies = await fetchPopularMovies()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">인기 영화</h1>
      <MovieList movies={movies} />
    </div>
  )
}
```

---

## 확인

```bash
npm run dev
```

`http://localhost:3000`을 열었을 때 순서대로 확인합니다.

1. **Skeleton이 잠깐 보인다** — `loading.tsx`가 표시되고 있는 것입니다
2. **실제 영화 포스터와 제목이 나타난다** — `page.tsx`의 fetch가 완료된 것입니다
3. **새로고침해도 두 번째부터는 더 빠르다** — Next.js가 TMDB 응답을 1시간 캐싱하기 때문입니다

---

## 이 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `next.config.ts` | 외부 이미지 호스트(`image.tmdb.org`) 허용 |
| `src/components/MovieCard.tsx` | 영화 카드 UI (서버 컴포넌트) |
| `src/components/MovieList.tsx` | 카드 그리드 목록 (서버 컴포넌트) |
| `src/app/loading.tsx` | 홈 로딩 Skeleton |
| `src/app/page.tsx` | 홈 페이지 — TMDB 인기 영화 fetch |
