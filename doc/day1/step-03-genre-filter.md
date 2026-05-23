# Step 3 — 장르 필터

> 예상 소요 시간: 15분

---

## 이 단계의 핵심 목표

- "선택된 장르"가 **서버 데이터가 아닌 UI 상태**라는 것을 이해한다
- 서버 컴포넌트가 데이터를 fetch하고, 클라이언트 컴포넌트가 필터링을 담당하는 협력 구조를 파악한다
- `Promise.all`로 독립적인 두 요청을 동시에 보내는 이유를 안다

---

## 이 단계에서 만드는 것

홈 화면에 장르 필터 버튼을 추가합니다. 버튼을 클릭하면 해당 장르 영화만 표시됩니다.

이 단계의 핵심은 **왜 `GenreFilter`만 `'use client'`인가** 를 이해하는 것입니다.

| 파일 | 변경 내용 |
|---|---|
| `src/components/GenreFilter.tsx` | 장르 필터 UI + 선택 상태 관리 (`'use client'`, `useState`) |
| `src/app/page.tsx` | 장르 데이터 추가, `Promise.all` 동시 요청 |

---

## 왜 클라이언트 컴포넌트인가

Next.js에서 컴포넌트가 서버/클라이언트 중 어느 쪽에서 실행되는지는 **무엇을 다루는가**로 결정됩니다.

| 상태 종류 | 관리 방법 |
|---|---|
| 서버 데이터 (영화 목록, 장르 목록) | 서버 컴포넌트에서 fetch |
| 클라이언트 UI 상태 (지금 어느 장르가 선택됐는가) | 클라이언트 컴포넌트의 `useState` |

장르 목록은 TMDB에서 가져오는 서버 데이터이지만, **"지금 어느 장르가 선택됐는가"는 TMDB와 무관한 UI 상태**입니다. 사용자가 화면과 상호작용하면서 변하는 값이므로 `useState`가 필요합니다.

`useState`는 브라우저에서만 동작합니다. 따라서 `'use client'`를 선언해야 합니다.

```
MovieCard.tsx    — 서버 데이터를 props로 받아 표시  → 서버 컴포넌트
MovieList.tsx    — 배열을 받아 카드를 나열          → 서버 컴포넌트
GenreFilter.tsx  — 선택 상태(UI)를 직접 관리        → 클라이언트 컴포넌트 ✓
```

---

## 파일 연결 구조

```
src/app/
└── page.tsx              ← TMDB에서 영화·장르를 fetch하고 GenreFilter에 전달

src/components/
├── GenreFilter.tsx       ← 장르 필터 UI + 선택 상태 관리 ('use client')
└── MovieList.tsx         ← 필터링된 영화 배열을 렌더링
```

```
page.tsx (서버 컴포넌트)
└── <GenreFilter genres={genres} movies={movies} />   ← 클라이언트 컴포넌트
    └── <MovieList movies={filtered} />               ← 클라이언트 환경에서 실행
```

> `MovieList`는 `'use client'`가 없지만, 클라이언트 컴포넌트인 `GenreFilter`가 직접 import하므로 클라이언트 환경에서 실행됩니다.
> `MovieList`에 서버 전용 로직(async fetch 등)이 없으므로 기능상 문제는 없습니다.

---

## 1. GenreFilter.tsx

**`src/components/GenreFilter.tsx` 파일을 새로 생성합니다.**

`genres`와 `movies`는 `page.tsx`가 서버에서 fetch해 props로 전달합니다.
이 컴포넌트는 전달받은 데이터를 fetch하는 것이 아닌, **어느 장르를 선택했는가**라는 UI 상태만 직접 관리합니다.

```tsx
// src/components/GenreFilter.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Genre, Movie } from '@/types/movie.types'
import MovieList from './MovieList'

interface GenreFilterProps {
  genres: Genre[]
  movies: Movie[]
}

export default function GenreFilter({ genres, movies }: GenreFilterProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const filtered = selectedId === null
    ? movies
    : movies.filter((movie) => movie.genre_ids.includes(selectedId))

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedId === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedId(null)}
        >
          전체
        </Button>
        {genres.map((genre) => (
          <Button
            key={genre.id}
            variant={selectedId === genre.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedId(genre.id)}
          >
            {genre.name}
          </Button>
        ))}
      </div>
      <MovieList movies={filtered} />
    </div>
  )
}
```

`filtered`는 `selectedId`가 바뀔 때마다 새로 계산됩니다. 서버에 요청하지 않고 **브라우저 메모리 안에서** 필터링하므로 클릭 즉시 반응합니다.

---

## 2. page.tsx 수정 — 장르 데이터 추가

**`src/app/page.tsx` 파일을 수정합니다.**

`GenreFilter`에 장르 목록도 전달해야 합니다. 영화 목록과 장르 목록은 서로 의존하지 않으므로 동시에 요청합니다.

```tsx
// ❌ 순서대로 요청 — 첫 번째가 끝난 뒤 두 번째가 시작
const movies = await fetchPopularMovies()
const genres = await fetchGenres()

// ✅ 동시 요청 — 두 요청을 동시에 보내고 모두 끝나면 진행
const [movies, genres] = await Promise.all([
  fetchPopularMovies(),
  fetchGenres(),
])
```

```tsx
// src/app/page.tsx
import { fetchPopularMovies, fetchGenres } from '@/lib/tmdb'
import GenreFilter from '@/components/GenreFilter'

export default async function HomePage() {
  const [movies, genres] = await Promise.all([
    fetchPopularMovies(),
    fetchGenres(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">인기 영화</h1>
      <GenreFilter genres={genres} movies={movies} />
    </div>
  )
}
```

---

## 확인

```bash
npm run dev
```

`http://localhost:3000` 에서 장르 버튼을 클릭했을 때 영화 목록이 필터링되면 완료입니다.

서버가 아닌 **브라우저에서** 필터링이 일어나므로 버튼 클릭 시 화면이 즉시 반응합니다.

---

## 이 단계에서 만든 것

| 파일 | 변경 내용 |
|---|---|
| `src/components/GenreFilter.tsx` | 장르 필터 UI + 선택 상태 관리 (`'use client'`, `useState`) |
| `src/app/page.tsx` | 장르 데이터 추가, `Promise.all` 동시 요청 |
