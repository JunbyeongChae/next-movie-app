# Step 4 — 영화 상세 페이지

> 예상 소요 시간: 20분

---

## 이 단계의 핵심 목표

- URL의 `[id]`가 `page.tsx`의 `params`로 어떻게 전달되는지 이해한다
- Next.js 15에서 `params`가 `Promise` 타입인 이유와 `await`로 풀어야 하는 이유를 안다
- `generateMetadata`로 각 영화 페이지의 브라우저 탭 제목을 동적으로 생성한다

---

## 이 단계에서 만드는 것

영화 카드를 클릭하면 이동하는 상세 페이지(`/movies/[id]`)를 구현합니다.

이 단계의 핵심은 **`params`와 `generateMetadata`** 입니다.

| 파일 | 역할 |
|---|---|
| `src/app/movies/[id]/loading.tsx` | 상세 페이지 로딩 Skeleton |
| `src/app/movies/[id]/page.tsx` | 상세 페이지 + `generateMetadata` |

---

## URL 파라미터와 메타데이터 이해하기

Next.js는 파일 이름에 `[id]`처럼 대괄호를 쓰면 **동적 경로 세그먼트**로 인식합니다.
`/movies/1`, `/movies/42`, `/movies/999`처럼 변하는 부분을 하나의 파일로 처리합니다.

URL의 `[id]` 값은 `page.tsx`의 `params` props로 전달됩니다.

> **흐름 정리**: 사용자가 `/movies/42`로 접속하면 Next.js가 URL을 파싱해 `{ id: "42" }`를 `params`에 담아 `page.tsx`로 넘겨줍니다. 개발자는 `params.id`를 꺼내 TMDB API에 `42`번 영화를 요청하면 됩니다.

### Next.js 15에서 달라진 점 — `params`는 이제 Promise입니다

```tsx
// ❌ 이전 방식 — params를 바로 사용
async function MovieDetailPage({ params }) {
  const { id } = params  // Next.js 15에서 오류
}

// ✅ Next.js 15 — await로 풀어야 함
async function MovieDetailPage({ params }) {
  const { id } = await params  // URL의 [id] 값
}
```

> **왜 Promise가 됐나?**: Next.js 15부터 params를 비동기로 처리합니다. URL 파싱이 끝나기 전에 컴포넌트가 실행될 수도 있기 때문입니다. `await`를 빠뜨리면 `id`가 `undefined`가 되어 TMDB 요청이 실패합니다. `await params`는 URL 파싱이 완전히 끝날 때까지 기다리라는 뜻입니다.

> `searchParams`도 마찬가지입니다. 이후 단계의 검색 페이지에서 `await searchParams`를 사용합니다.

### `generateMetadata` — 동적 메타데이터

`layout.tsx`의 `metadata`는 앱 전체에 고정된 제목을 설정합니다.
상세 페이지처럼 각 페이지마다 제목이 달라야 할 때는 `generateMetadata` 함수를 사용합니다.

```tsx
// ❌ layout.tsx의 고정 메타데이터 — 모든 페이지가 같은 제목
export const metadata = { title: '영화 정보 앱' }

// ✅ generateMetadata — 페이지마다 다른 제목
export async function generateMetadata({ params }) {
  const { id } = await params
  const movie = await fetchMovie(id)
  return { title: `${movie.title} — MovieApp` }
}
```

이 함수를 `page.tsx`에 나란히 선언하면 Next.js가 페이지를 렌더링하기 전에 먼저 실행해 `<head>`에 삽입합니다.
브라우저 탭에 **"인셉션 — MovieApp"** 처럼 영화 제목이 표시됩니다.

> **실행 순서**: 사용자가 `/movies/42` 접속 → `generateMetadata` 먼저 실행 → `<head>` 완성 → 페이지 본문 렌더링. `generateMetadata`와 `page.tsx` 본문이 각각 `fetchMovie`를 호출하지만, Next.js는 같은 URL의 fetch 결과를 자동으로 캐싱하므로 TMDB 네트워크 요청은 한 번만 발생합니다.

---

## 파일 연결 구조

```
src/app/movies/[id]/
├── loading.tsx    ← page.tsx가 응답을 기다리는 동안 Next.js가 자동으로 표시
└── page.tsx       ← TMDB에서 영화 상세 데이터를 fetch하고 화면에 표시
                      generateMetadata로 동적 메타데이터 생성
```

---

## 1. loading.tsx — 상세 페이지 로딩 UI

**`src/app/movies/[id]/loading.tsx` 파일을 새로 생성합니다.**

`page.tsx`와 같은 폴더에 `loading.tsx`라는 이름으로 두기만 하면 Next.js가 자동으로 연결합니다.
`page.tsx`가 TMDB 응답을 기다리는 동안 이 파일이 대신 표시됩니다.

> **왜 자동 연결되나?**: Next.js의 파일 기반 라우팅 규칙입니다. `page.tsx`, `loading.tsx`, `error.tsx`, `layout.tsx`는 같은 폴더에 놓기만 하면 Next.js가 약속된 역할로 자동 인식합니다. 별도 import나 설정이 필요 없습니다.

```tsx
// src/app/movies/[id]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex gap-8">
      <Skeleton className="w-64 aspect-2/3 rounded-lg shrink-0" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
```

---

## 2. page.tsx — 상세 페이지

**`src/app/movies/[id]/page.tsx` 파일을 새로 생성합니다.**

`generateMetadata`는 `page.tsx`와 같은 파일에 나란히 선언합니다.
`fetchMovie`를 두 곳에서 각각 호출하지만, Next.js는 같은 URL에 대한 fetch 결과를 자동으로 캐싱합니다. 실제 네트워크 요청은 한 번만 발생합니다.

> **캐싱 흐름**: `generateMetadata`가 `fetchMovie(42)` 호출 → TMDB에 실제 요청 → 서버 캐시에 저장 → `MovieDetailPage`가 `fetchMovie(42)` 호출 → 캐시에서 즉시 반환 (TMDB 요청 없음). `tmdb.ts`의 `revalidate: 3600`이 이 캐시의 유효 시간을 1시간으로 설정합니다.

### notFound() 처리

`fetchMovie`는 실패 시 `null`을 반환하지 않고 **에러를 throw**합니다.
따라서 `if (!movie) notFound()` 패턴은 동작하지 않고, `try-catch`로 감싸야 합니다.

```tsx
// ❌ 동작하지 않음 — fetchMovie는 null을 반환하지 않고 에러를 throw
const movie = await fetchMovie(id)
if (!movie) notFound()

// ✅ 올바른 방법 — 에러를 catch해서 404로 처리
let movie
try {
  movie = await fetchMovie(id)
} catch {
  notFound()
}
```

### 전체 코드

```tsx
// src/app/movies/[id]/page.tsx
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { fetchMovie, getPosterUrl } from '@/lib/tmdb'

interface MovieDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MovieDetailPageProps) {
  const { id } = await params
  const movie = await fetchMovie(id)
  return {
    title: `${movie.title} — MovieApp`,
    description: movie.overview,
  }
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params

  let movie
  try {
    movie = await fetchMovie(id)
  } catch {
    notFound()
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="relative w-full md:w-64 aspect-2/3 shrink-0">
        <Image
          src={getPosterUrl(movie.poster_path, 'w342')}
          alt={movie.title}
          fill
          className="object-cover rounded-lg"
          priority
        />
      </div>

      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold">{movie.title}</h1>

        <div className="flex items-center gap-3 text-muted-foreground">
          <span>{movie.release_date?.slice(0, 4)}</span>
          <span>•</span>
          <span>{movie.runtime}분</span>
          <span>•</span>
          <span>⭐ {movie.vote_average.toFixed(1)}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {movie.genres.map((genre) => (
            <Badge key={genre.id} variant="outline">{genre.name}</Badge>
          ))}
        </div>

        <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
      </div>
    </div>
  )
}
```

`notFound()`는 Next.js 내장 함수입니다. 호출하면 자동으로 404 페이지로 이동합니다.

---

## 확인

### loading.tsx가 실제로 표시되는지 확인하기

`loading.tsx`는 "자동으로 표시된다"는 설명만으로는 체감하기 어렵습니다. 직접 눈으로 확인합니다.

데이터가 빠르게 로드되면 로딩 화면이 너무 짧게 표시되어 보이지 않을 수 있습니다.
임시로 응답을 느리게 만들어 확인합니다.

> **수정 위치**: `src/app/movies/[id]/page.tsx`에서 `MovieDetailPage` 함수 안, `const { id } = await params` 바로 아래에 한 줄만 추가합니다.

```tsx
export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params

  // ↓ 이 한 줄만 추가 (확인 후 반드시 삭제)
  await new Promise((r) => setTimeout(r, 3000))

  let movie
  try {
    movie = await fetchMovie(id)
  } catch {
    notFound()
  }
  // ...
}
```

1. 위 한 줄을 추가합니다.
2. 브라우저에서 영화 카드를 클릭합니다.
3. Skeleton 로딩 화면이 3초간 표시되는지 확인합니다.
4. 확인 후 추가했던 한 줄을 삭제합니다.

**로딩 화면이 보이지 않는다면 아래 순서로 확인합니다.**

| 확인 항목 | 올바른 상태 |
|---|---|
| 파일 위치 | `src/app/movies/[id]/loading.tsx` — 폴더 이름이 `[id]`인지 확인 (`id`로 쓰면 인식 안 됨) |
| 파일 이름 | 정확히 `loading.tsx` — `Loading.tsx`, `loading.ts` 등은 인식 안 됨 |
| 임시 코드 위치 | `await new Promise(...)` 가 `fetchMovie(id)` **앞**에 있는지 확인 |
| 개발 서버 재시작 | 파일을 새로 만든 뒤 서버를 재시작하지 않으면 인식 못 할 수 있음 (`Ctrl+C` 후 `npm run dev`) |
| 브라우저 캐시 | 같은 영화를 반복 클릭하면 Next.js 캐시가 즉시 반환해 로딩이 안 보일 수 있음 — 다른 영화를 클릭하거나 하드 리프레시(`Ctrl+Shift+R`) |

**Skeleton이 보이지 않고 화면이 비어있다면**

Skeleton은 CSS 변수(`--color-muted`)가 설정되지 않으면 투명하게 렌더링됩니다.
진단용 텍스트를 임시로 추가해 `loading.tsx` 자체가 트리거되는지 먼저 확인합니다.

```tsx
// src/app/movies/[id]/loading.tsx — 진단용 임시 코드
export default function Loading() {
  return (
    <div className="flex gap-8">
      <p className="text-2xl font-bold text-red-500">로딩 중...</p>  {/* ← 임시 추가 */}
      <Skeleton className="w-64 aspect-2/3 rounded-lg shrink-0" />
      ...
    </div>
  )
}
```

- 빨간 텍스트가 보이면 → `loading.tsx`는 정상 작동, Skeleton 색상 문제
- 빨간 텍스트도 보이지 않으면 → 파일명·위치 재확인

확인 후 임시 줄을 삭제합니다.

### 전체 동작 확인

```bash
npm run dev
```

1. 홈에서 영화 카드를 클릭합니다.
2. 상세 페이지로 이동하고 영화 포스터·제목·정보가 표시됩니다.
3. 브라우저 탭에 영화 제목이 표시됩니다.
4. 뒤로 가기 버튼으로 홈으로 돌아옵니다.

---

## 이 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `src/app/movies/[id]/loading.tsx` | 상세 페이지 로딩 Skeleton |
| `src/app/movies/[id]/page.tsx` | 상세 페이지 + `generateMetadata` |
