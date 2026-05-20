## Step 1 — layout.tsx + Providers + Header `(20분)`

### 이 단계에서 만드는 것

앱 전체에서 공통으로 필요한 뼈대를 구성합니다.

이 단계의 핵심은 `src/app/layout.tsx`입니다.
`create-next-app`이 자동 생성한 파일이지만, 우리 앱에 맞게 내용을 교체합니다.

**layout.tsx가 특별한 이유**

Next.js는 `layout.tsx`라는 **파일명 자체**를 규약으로 인식합니다.
별도 설정 없이, 이 파일은 해당 경로와 모든 하위 페이지에 자동으로 감싸집니다.
`/`, `/search`, `/movies/1` 어느 경로로 접속해도 `layout.tsx`가 먼저 렌더링되고
그 안의 `{children}` 자리에 해당 경로의 `page.tsx`가 삽입됩니다.

**함수 이름은 중요하지 않습니다**

Next.js는 파일명으로만 역할을 결정합니다. `default export`만 되어 있으면 함수 이름은 무엇이든 상관없습니다.
`RootLayout`이라는 이름은 코드를 읽는 사람을 위한 관례일 뿐입니다.

```tsx
// 세 가지 모두 동일하게 동작합니다
export default function RootLayout({ children }) { ... }
export default function Banana({ children }) { ... }
export default function ({ children }) { ... }
```

**layout.tsx 전체 코드**

기존 내용을 모두 지우고 아래 코드로 교체합니다.

```tsx
// src/app/layout.tsx
// Next.js가 이 파일명을 규약으로 인식합니다. 별도 설정 없이 모든 페이지에 자동 적용됩니다.

import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'

const geist = Geist({ subsets: ['latin'] })

// 브라우저 탭 제목과 SEO 설명을 서버에서 처리합니다. JavaScript 없이 동작합니다.
export const metadata: Metadata = {
  title: '영화 정보 앱',
  description: 'TMDB 기반 영화 정보 서비스',
}

export default function RootLayout({
  children, // 현재 URL에 맞는 page.tsx가 Next.js에 의해 자동으로 전달됩니다.
}: {
  children: React.ReactNode
}) {
  return (
    // layout.tsx가 html과 body까지 직접 렌더링합니다. 전체 HTML 문서의 껍데기 역할입니다.
    <html lang="ko">
      <body className={geist.className}>
        {/* Header와 모든 페이지({children})가 TanStack Query를 사용할 수 있도록 함께 감쌉니다. */}
        <Providers>
          <Header />
          {/* 모든 페이지가 이 영역 안에 렌더링됩니다. */}
          <main className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
```

`Providers`와 `Header`는 아직 없는 파일입니다. 지금 바로 만듭니다.

---

### 1. Providers.tsx — QueryClientProvider 설정

**`src/components/Providers.tsx` 파일을 새로 생성합니다.**

**왜 별도 파일로 분리하는가?**

`QueryClientProvider`는 TanStack Query의 캐시와 설정을 하위 컴포넌트 전체에 제공하는 역할을 합니다.

가장 자연스러운 위치는 앱 진입점인 `layout.tsx` 안입니다. 모든 페이지가 TanStack Query를 쓸 수 있어야 하기 때문입니다.

그러나 `layout.tsx`는 서버 컴포넌트입니다. `QueryClientProvider`는 내부적으로 React의 `useState`와 Context API를 사용하기 때문에 브라우저에서만 동작합니다. 서버에는 렌더링 사이클이 없으므로 상태(state)를 유지할 수 없습니다.

이 때문에 `QueryClientProvider`를 `layout.tsx`에 직접 넣을 수 없고, `'use client'`를 선언한 별도 파일로 분리한 뒤 `layout.tsx`에서 import해서 사용합니다.

**잘못된 방법 vs 올바른 방법**

```tsx
// ❌ 잘못된 방법 — 모듈 최상단에 선언
const queryClient = new QueryClient()  // 서버가 시작될 때 딱 한 번만 생성됩니다.
                                       // 모든 사용자가 이 하나의 인스턴스를 공유합니다.

export default function Providers({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

```tsx
// ✅ 올바른 방법 — useState 안에서 선언
export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient())
  // Providers 컴포넌트가 처음 렌더링될 때마다 새 인스턴스를 만듭니다.
  // 사용자마다 별도의 컴포넌트 인스턴스가 생기므로 캐시가 분리됩니다.

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```
---
```tsx
// src/components/Providers.tsx

// 이 파일은 브라우저에서만 실행됩니다. useState 등 React 훅을 사용하기 때문입니다.
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState로 생성해야 각 사용자(요청)마다 독립적인 QueryClient 인스턴스를 갖습니다.
  // 모듈 최상단에 선언하면 모든 사용자가 하나의 캐시를 공유하게 되어
  // 사용자 A의 데이터가 사용자 B에게 보이는 심각한 버그가 발생합니다.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,   // 5분간 캐시 유지 — 같은 데이터를 5분 안에 다시 요청하면 서버 호출 없이 캐시를 반환합니다.
      },
    },
  }))

  return (
    // QueryClientProvider로 감싸면 하위의 모든 컴포넌트에서 TanStack Query를 사용할 수 있습니다.
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 중에만 표시되는 TanStack Query 디버깅 도구입니다. 빌드 시 자동으로 제거됩니다. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**layout.tsx와의 연결 관계**

`Providers`는 단독으로 동작하지 않습니다. `layout.tsx`가 이 컴포넌트를 import해서 `<Providers>`로 전체를 감싸는 순간 연결됩니다.

```
layout.tsx (서버 컴포넌트)
└── <Providers>              ← QueryClientProvider가 내부에 있음 (클라이언트 컴포넌트)
    ├── <Header />           ← TanStack Query 사용 가능
    └── <main>{children}</main>  ← 모든 페이지에서 TanStack Query 사용 가능
```

`layout.tsx`가 모든 페이지에 자동 적용되므로, `Providers`로 한 번 감싸는 것만으로 앱 전체에서 TanStack Query를 사용할 수 있게 됩니다.

---

### 2. Header.tsx — 네비게이션

**`src/components/Header.tsx` 파일을 새로 생성합니다.**

현재 URL에 따라 active 링크를 표시해야 하므로 `'use client'`가 필요합니다.

```tsx
// src/components/Header.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/search', label: '검색' },
  { href: '/favorites', label: '즐겨찾기' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b px-6 py-4 flex items-center gap-6">
      <Link href="/" className="font-bold text-lg">
        🎬 MovieApp
      </Link>
      <nav className="flex gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'font-bold underline' : 'text-gray-500'}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
```

**Next.js에서 링크를 다루는 방법:**
- HTML `<a>` 대신 `<Link>` (next/link) — 페이지 전체를 새로 불러오지 않고 필요한 부분만 교체합니다.
- `usePathname` — 현재 URL 경로를 읽는 Next.js 훅입니다. active 링크 스타일 처리에 사용합니다.

---

### 브라우저 확인

`Providers`와 `Header`를 모두 만들었으므로 `layout.tsx`가 오류 없이 동작합니다.

```bash
npm run dev
```

`http://localhost:3000` 에서 Header가 보이고 링크가 동작하면 완료입니다.

---

### 3. TypeScript 타입 정의

**`src/types/movie.types.ts` 파일을 새로 생성합니다.**

TMDB API가 반환하는 JSON 데이터의 형태를 TypeScript 타입으로 미리 정의해둡니다.
타입을 정의해두면 API 응답을 다루는 모든 파일에서 자동완성이 동작하고,
잘못된 필드명을 사용했을 때 컴파일 단계에서 오류를 잡아줍니다.
타입 파일은 실제 로직이 없는 순수한 타입 선언이므로 `src/types/`에 모아 관리합니다.

```tsx
// src/types/movie.types.ts
export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
}

// MovieDetail은 Movie의 모든 필드를 그대로 가져오면서 상세 페이지에서만 필요한 필드를 추가합니다.
// extends를 쓰면 Movie의 필드를 중복 선언하지 않아도 되고,
// Movie 타입이 변경될 때 MovieDetail도 자동으로 반영됩니다.
export interface MovieDetail extends Movie {
  genres: Genre[]
  runtime: number
}

export interface Genre {
  id: number
  name: string
}
```

---

### 4. TMDB 유틸리티 함수

**`src/lib/tmdb.ts` 파일을 새로 생성합니다.**

TMDB API 호출 함수를 한 곳에 모아둡니다. 다음 단계에서 페이지를 만들 때 import해서 사용합니다.
```ts
// src/lib/tmdb.ts
import { Movie, MovieDetail, Genre } from '../types/movie.types'

const BASE_URL = 'https://api.themoviedb.org/3'

// process.env는 Node.js가 제공하는 환경변수 저장소입니다.
// .env.local 파일에 저장한 값을 코드 안에서 읽어오는 방법입니다.
// import 없이 어디서든 사용할 수 있습니다.
//
// ❌ 코드에 직접 작성하면 GitHub에 올릴 때 전 세계에 노출됩니다.
//    const API_KEY = 'abc123xyz'
// ✅ 환경변수로 분리하면 .env.local은 .gitignore에 포함되어 노출되지 않습니다.
const API_KEY = process.env.TMDB_API_KEY

// 모든 TMDB 요청의 공통 로직을 담은 내부 함수입니다. export하지 않으므로 이 파일 안에서만 사용합니다.
//
// async
//   → 이 함수 안에서 await를 사용할 수 있습니다. 네트워크 요청처럼 시간이 걸리는 작업을 기다립니다.
//
// function tmdbFetch
//   → 함수 이름입니다. export가 없으므로 이 파일 내부에서만 호출할 수 있습니다.
//
// <T>
//   → 제네릭(Generic)입니다. 응답 데이터의 타입을 호출하는 쪽에서 직접 지정합니다.
//     예) tmdbFetch<{ results: Movie[] }>(...) → T가 { results: Movie[] }로 결정됩니다.
//     같은 함수로 다양한 응답 형태를 타입 안전하게 처리할 수 있습니다.
//
// endpoint: string
//   → 호출할 API 경로입니다. 예) '/movie/popular', '/movie/123'
//
// params = ''
//   → 추가 쿼리 파라미터입니다. 기본값이 빈 문자열이므로 넘기지 않아도 됩니다.
//     검색 시에만 '&query=어벤저스' 형태로 넘깁니다.
//
// : Promise<T>
//   → 반환 타입입니다. async 함수는 항상 Promise를 반환합니다.
//     Promise가 완료되면 T 타입의 값을 돌려줍니다.
async function tmdbFetch<T>(endpoint: string, params = ''): Promise<T> {
  const res = await fetch(
    // BASE_URL + endpoint    : 요청할 API 경로
    // api_key=${API_KEY}     : 인증 키
    // language=ko-KR         : 한국어 응답 요청
    // params                 : 검색어 등 추가 파라미터 (기본값 빈 문자열)
    `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=ko-KR${params}`,
    { next: { revalidate: 3600 } }  // 1시간마다 데이터 갱신
  )
  if (!res.ok) throw new Error(`TMDB 요청 실패:${endpoint}`)
  return res.json()
}

// 인기 영화 목록을 가져옵니다. 홈 페이지에서 사용합니다.
// tmdbFetch의 응답 타입을 { results: Movie[] }로 지정하면
// data.results가 Movie[] 타입임을 TypeScript가 알 수 있습니다.
export async function fetchPopularMovies() {
  const data = await tmdbFetch<{ results: Movie[] }>('/movie/popular')
  return data.results
}

// 영화 상세 정보를 가져옵니다. 상세 페이지(/movies/[id])에서 사용합니다.
export async function fetchMovie(id: string) {
  return tmdbFetch<MovieDetail>(`/movie/${id}`)
}

// 키워드로 영화를 검색합니다. 검색 페이지에서 사용합니다.
export async function searchMovies(query: string) {
  const data = await tmdbFetch<{ results: Movie[] }>(
    '/search/movie',
    `&query=${encodeURIComponent(query)}`  // 한글 등 특수문자를 URL 안전 형식으로 변환합니다.
  )
  return data.results
}

// 장르 목록을 가져옵니다. 홈 페이지의 장르 필터에서 사용합니다.
export async function fetchGenres() {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/movie/list')
  return data.genres
}

// 포스터 이미지의 전체 URL을 만들어 반환합니다.
// TMDB는 poster_path만 제공하고 앞에 CDN 주소를 붙여야 실제 이미지가 표시됩니다.
export function getPosterUrl(posterPath: string | null, size = 'w500') {
  if (!posterPath) return '/no-image.png'
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}
```
  - { next: { revalidate: 3600 } } 는 Next.js의 캐싱 옵션입니다. 같은 요청을 1시간 동안 재사용합니다. 매번 TMDB에 요청하지 않아도 됩니다.

---

### 통합 테스트 — TMDB 연결 확인

Header만 보이는 것은 step-00과 시각적으로 차이가 없습니다.
`layout.tsx`, `Providers`, `movie.types.ts`, `tmdb.ts`가 실제로 연결되어 동작하는지 확인하려면
`page.tsx`에서 직접 데이터를 가져와 화면에 출력해봅니다.

`src/app/page.tsx`를 아래 코드로 교체합니다.

```tsx
// src/app/page.tsx
import { fetchPopularMovies } from '@/lib/tmdb'

// page.tsx는 서버 컴포넌트이므로 async/await를 바로 사용할 수 있습니다.
// 브라우저가 아닌 서버에서 TMDB를 호출하고 완성된 HTML을 내려줍니다.
export default async function HomePage() {
  const movies = await fetchPopularMovies()

  return (
    <ul>
      {movies.map((movie) => (
        <li key={movie.id}>{movie.title}</li>
      ))}
    </ul>
  )
}
```

`npm run dev` 후 `http://localhost:3000`에서 **한국어 영화 제목 목록**이 출력되면 아래 네 가지가 모두 정상입니다.

| 확인 항목 | 근거 |
| --- | --- |
| `tmdb.ts` 함수가 정상 동작 | 데이터가 화면에 출력됨 |
| TMDB API 키가 올바르게 연결됨 | 인증 오류 없이 응답이 옴 |
| `Movie` 타입이 올바름 | `movie.title` 접근 시 TypeScript 오류 없음 |
| 서버 컴포넌트에서 직접 fetch 가능 | `async/await`가 `page.tsx`에서 동작함 |

확인이 끝나면 `page.tsx`를 다시 비워둡니다. 홈 페이지는 다음 단계에서 제대로 만듭니다.
```tsx
// src/app/page.tsx — 테스트 후 원래대로 되돌립니다
export default function HomePage() {
  return <div>홈 페이지</div>
}
```

---

이 단계에서 만든 것

| 파일 | 역할 |
| --- | --- |
| `src/app/layout.tsx` | 앱 공통 레이아웃 (서버 컴포넌트) |
| `src/components/Providers.tsx` | QueryClientProvider (`'use client'`) |
| `src/components/Header.tsx` | 네비게이션 (`'use client'`) |
| `src/types/movie.types.ts` | Movie, Genre TypeScript 타입 |
| `src/lib/tmdb.ts` | TMDB API 함수 모음 |