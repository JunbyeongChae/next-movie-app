# Step 5 — Zustand — 즐겨찾기

> 예상 소요 시간: 20분

---

## 이 단계의 핵심 목표

- Zustand store를 구독하는 컴포넌트에 `'use client'`가 필요한 이유를 이해한다
- 서버 컴포넌트(`page.tsx`) 안에 클라이언트 컴포넌트(`FavoriteButton`)를 넣는 구조를 파악한다

---

## 이 앱에서 Zustand로 무엇을 관리하는가

영화 앱에는 두 종류의 정보가 있습니다.

| 정보 | 출처 | 관리 도구 |
|---|---|---|
| 영화 목록, 영화 상세 | TMDB 서버에서 가져옴 | 서버 컴포넌트 / TanStack Query |
| **즐겨찾기 목록** | 사용자가 직접 만듦 | **Zustand** |

> **TanStack Query는 서버 상태(서버 데이터 동기화 및 캐싱)** 를, **Zustand는 클라이언트 상태(브라우저 내 사용자 상호작용 및 UI 상태 공유)** 를 전담합니다. 둘은 별개로 동작합니다.

### TanStack Query — 서버 상태 관리

TanStack Query는 외부 서버(예: TMDB API)에 있는 데이터를 브라우저로 가져와서 관리하는 도구입니다.

- **특징**: 서버의 데이터는 브라우저가 통제할 수 없으며, 다른 사용자에 의해 언제든 변경될 수 있습니다.
- **역할**: 데이터를 가져오고(fetch), 잠시 보관(캐싱)하며, 로딩·에러 상태를 관리합니다.
- **앱에서의 역할**: 인기 영화 목록, 영화 상세 정보, 검색 결과 등 외부 API에 의존하는 데이터를 관리합니다.

### Zustand — 클라이언트 상태 관리

Zustand는 순수하게 브라우저(클라이언트) 내부에서만 존재하는 데이터를 관리하는 도구입니다.

- **특징**: 서버와는 무관하며, 사용자가 브라우저에서 직접 행동(클릭, 입력 등)을 함으로써 만들어지는 상태입니다.
- **역할**: 여러 컴포넌트가 동일한 데이터를 공유할 수 있도록 브라우저 메모리에 전역으로 상태를 저장합니다.
- **앱에서의 역할**: 즐겨찾기한 영화 목록, 로그인 여부 등 UI와 직접적으로 관련된 상태를 관리합니다.

---

즐겨찾기는 TMDB에 존재하지 않습니다. 사용자가 "★ 즐겨찾기 추가" 버튼을 누를 때 비로소 생겨나는 정보입니다.
이처럼 **사용자의 행동으로 만들어지고, 여러 페이지에서 공유돼야 하는 정보**를 클라이언트 상태라고 합니다.

**왜 여러 페이지에서 공유돼야 하는가?**

```
상세 페이지 (/movies/42)
  └── "★ 즐겨찾기 추가" 버튼 클릭
        ↓ 즐겨찾기 목록에 추가
즐겨찾기 페이지 (/favorites)
  └── 방금 추가한 영화가 목록에 보여야 함
```

상세 페이지에서 추가한 영화가 즐겨찾기 페이지에도 바로 반영되려면, 두 페이지가 **같은 즐겨찾기 목록**을 바라봐야 합니다.
Zustand는 이 공유 목록을 브라우저 메모리에 보관하고, 변경이 생기면 구독 중인 컴포넌트를 자동으로 업데이트합니다.

---

## 이 단계에서 만드는 것

영화를 즐겨찾기에 추가·제거하는 기능과 즐겨찾기 목록 페이지를 구현합니다.

| 파일 | 역할 |
|---|---|
| `src/store/favoriteStore.ts` | 즐겨찾기 Zustand store |
| `src/components/FavoriteButton.tsx` | 즐겨찾기 버튼 (`'use client'`) |
| `src/components/FavoritesList.tsx` | 즐겨찾기 목록 (`'use client'`) |
| `src/app/favorites/page.tsx` | 즐겨찾기 페이지 |
| `src/app/movies/[id]/page.tsx` | FavoriteButton 추가 |

---

## Zustand store를 `'use client'`와 함께 쓰는 이유

Zustand store는 내부적으로 React의 `useState`와 유사하게 동작합니다.
서버에는 렌더링 사이클이 없으므로 상태를 유지할 수 없습니다.

store를 직접 구독하는 컴포넌트는 반드시 `'use client'`를 선언해야 합니다.
store 파일 자체(`favoriteStore.ts`)에는 `'use client'`가 없어도 됩니다.

> **구독이란?**: `useFavoriteStore()`를 컴포넌트 안에서 호출하는 것이 "구독"입니다. Zustand는 store 값이 바뀌면 구독 중인 컴포넌트를 자동으로 리렌더링합니다. 이 과정은 브라우저에서만 동작하므로 `'use client'`가 필요합니다.

> **store 파일에 `'use client'`가 없어도 되는 이유**: `favoriteStore.ts`는 상태를 "정의"만 합니다. 실제로 상태를 "읽고 화면에 반영"하는 것은 컴포넌트(`FavoriteButton`, `FavoritesList`)가 담당하므로 `'use client'`는 그 컴포넌트에만 선언합니다.

```
favoriteStore.ts       — store 정의 (선언만)
FavoriteButton.tsx     — store를 구독하고 UI를 렌더링 → 'use client' 필요
FavoritesList.tsx      — store를 구독하고 목록을 렌더링 → 'use client' 필요
```

---

## 파일 연결 구조

```
src/store/
└── favoriteStore.ts        ← Zustand store

src/components/
├── FavoriteButton.tsx      ← 즐겨찾기 추가/제거 버튼 ('use client')
└── FavoritesList.tsx       ← 즐겨찾기 목록 렌더링 ('use client')

src/app/
├── movies/[id]/page.tsx    ← FavoriteButton 추가 (서버 컴포넌트)
└── favorites/page.tsx      ← 즐겨찾기 페이지 (서버 컴포넌트)
```

```
favorites/page.tsx (서버 컴포넌트)
└── <FavoritesList />                    ← 클라이언트 컴포넌트 (Zustand 구독)
    └── <MovieList movies={favorites} />

movies/[id]/page.tsx (서버 컴포넌트)
└── <FavoriteButton movie={movie} />     ← 클라이언트 컴포넌트 (Zustand 구독)
```

---

## 1. favoriteStore.ts

**`src/store/favoriteStore.ts` 파일을 새로 생성합니다.**

> **상태 변경 흐름**: 즐겨찾기 추가 → Zustand store 업데이트 → 구독 중인 컴포넌트 리렌더링 → 화면 반영

`persist` 미들웨어를 사용해 즐겨찾기 목록을 localStorage에 저장합니다. 페이지를 새로고침하거나 개발 서버의 HMR이 발생해도 즐겨찾기 목록이 유지됩니다.

```ts
// src/store/favoriteStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Movie } from '@/types/movie.types'

interface FavoriteState {
  favorites: Movie[]
  addFavorite: (movie: Movie) => void
  removeFavorite: (movieId: number) => void
  isFavorite: (movieId: number) => boolean
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      // set: 상태를 변경하는 함수. 현재 state를 받아 새 state를 반환한다.
      // [...state.favorites, movie] — 기존 배열을 복사하고 새 영화를 추가 (불변성 유지)
      addFavorite: (movie) =>
        set((state) => ({ favorites: [...state.favorites, movie] })),

      // filter로 해당 id를 제외한 새 배열을 만들어 교체한다.
      removeFavorite: (movieId) =>
        set((state) => ({
          favorites: state.favorites.filter((m) => m.id !== movieId),
        })),

      // get: set 없이 현재 상태를 읽기만 할 때 사용한다.
      // set을 쓰면 상태가 바뀌어 리렌더링이 발생하므로, 단순 조회는 get을 쓴다.
      isFavorite: (movieId) =>
        get().favorites.some((m) => m.id === movieId),
    }),
    {
      name: 'favorite-storage',                              // localStorage 키 이름
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ favorites: state.favorites }), // 저장할 상태만 선택
    }
  )
)
```

---

## 2. FavoriteButton.tsx

**`src/components/FavoriteButton.tsx` 파일을 새로 생성합니다.**

Zustand store를 구독하므로 `'use client'`가 필요합니다.

> **버튼 클릭 시 상태 변경 흐름**:
> 버튼 클릭 → `handleClick` 실행 → `addFavorite(movie)` 또는 `removeFavorite(id)` 호출
> → Zustand store의 `favorites` 배열 업데이트 → `isFavorite` 결과가 바뀜
> → `FavoriteButton` 리렌더링 → 버튼 텍스트가 "☆ 즐겨찾기 추가" ↔︎ "★ 즐겨찾기 해제"로 전환

> **`movie: Movie` 타입에 대해**: `FavoriteButton`은 `movie: Movie` 타입을 받지만, 실제로는 `fetchMovie`가 반환한 `MovieDetail`을 전달합니다. `MovieDetail`은 `Movie`를 `extends`하므로 TypeScript에서 문제없이 동작합니다. 즐겨찾기 기능에 필요한 필드(`id`, `title`, `poster_path` 등)는 `Movie`에 모두 포함되어 있으므로 `Movie` 타입으로 받는 것이 적절합니다.

```tsx
// src/components/FavoriteButton.tsx
'use client'

import { useFavoriteStore } from '@/store/favoriteStore'
import { Button } from '@/components/ui/button'
import type { Movie } from '@/types/movie.types'

interface FavoriteButtonProps {
  movie: Movie
}

export default function FavoriteButton({ movie }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore()
  const favorited = isFavorite(movie.id)

  function handleClick() {
    if (favorited) {
      removeFavorite(movie.id)
    } else {
      addFavorite(movie)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={favorited ? 'default' : 'outline'}
    >
      {favorited ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}
    </Button>
  )
}
```

---

## 3. FavoritesList.tsx

**`src/components/FavoritesList.tsx` 파일을 새로 생성합니다.**

### 왜 별도 파일로 분리하는가?

`favorites/page.tsx`에 `'use client'`를 직접 선언하면 페이지 전체가 클라이언트 컴포넌트가 됩니다.
Zustand를 읽는 부분만 `'use client'` 컴포넌트로 분리하고, `page.tsx`는 서버 컴포넌트로 유지하는 것이 Next.js 권장 방식입니다.

> **`page.tsx`에 `'use client'`를 쓰면 어떻게 되나?**: 페이지 전체가 브라우저에서 실행됩니다. 서버 전용 기능(`async/await` fetch, `process.env` 환경변수 접근)을 쓸 수 없게 되고 성능도 떨어집니다. `'use client'`는 반드시 필요한 컴포넌트에만, 가능한 한 트리의 아래쪽에 선언하는 것이 원칙입니다.

```tsx
// src/components/FavoritesList.tsx
'use client'

import { useFavoriteStore } from '@/store/favoriteStore'
import MovieList from './MovieList'

export default function FavoritesList() {
  const { favorites } = useFavoriteStore()

  if (favorites.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        즐겨찾기한 영화가 없습니다.
      </p>
    )
  }

  return <MovieList movies={favorites} />
}
```

---

## 4. favorites/page.tsx

**`src/app/favorites/` 폴더를 만들고 그 안에 `page.tsx` 파일을 새로 생성합니다.**

즐겨찾기 데이터는 Zustand(브라우저)에 있으므로 페이지 자체를 `async`로 만들 필요가 없습니다.

> **`async`가 필요 없는 이유**: `async`는 서버에서 TMDB 같은 외부 API를 fetch할 때 씁니다. 즐겨찾기 데이터는 TMDB가 아니라 브라우저 메모리(Zustand store)에 있고, 이를 읽는 것은 `FavoritesList`(클라이언트 컴포넌트)가 담당합니다. `page.tsx`는 단지 `FavoritesList`를 배치하는 껍데기 역할만 합니다.

```tsx
// src/app/favorites/page.tsx
import FavoritesList from '@/components/FavoritesList'

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">즐겨찾기</h1>
      <FavoritesList />
    </div>
  )
}
```

---

## 5. movies/[id]/page.tsx 수정 — FavoriteButton 추가

**`src/app/movies/[id]/page.tsx` 파일을 수정합니다.**

서버 컴포넌트(`page.tsx`) 안에 클라이언트 컴포넌트(`FavoriteButton`)를 넣을 수 있습니다.
서버에서 fetch한 `movie` 객체를 props로 전달하면, 버튼의 클릭 처리는 브라우저가 담당합니다.

> **서버 → 클라이언트 데이터 전달 흐름**:
> 서버: `fetchMovie(id)`로 TMDB에서 영화 데이터 가져옴
> → `<FavoriteButton movie={movie} />`로 props 전달
> → 브라우저: `FavoriteButton`이 `movie` 데이터를 받아 즐겨찾기 버튼 렌더링
> → 클릭 시 `movie` 전체를 Zustand store에 저장
>
> 이 구조 덕분에 TMDB fetch는 서버에서만 하고, 사용자 인터랙션(클릭)은 브라우저에서만 처리합니다.

**수정 위치 1**: 파일 상단 import 목록 맨 아래에 한 줄 추가합니다.

```tsx
// 기존 import들 아래에 추가
import FavoriteButton from '@/components/FavoriteButton'
```

**수정 위치 2**: `<p className="text-muted-foreground ...">` (줄거리) 바로 아래에 한 줄 추가합니다.

```tsx
<div className="flex-1 space-y-4">
  <h1 className="text-3xl font-bold">{movie.title}</h1>
  <div className="flex items-center gap-3 text-muted-foreground">
    {/* 기존 코드 — 변경 없음 */}
  </div>
  <div className="flex gap-2 flex-wrap">
    {/* 기존 코드 — 변경 없음 */}
  </div>
  <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>

  {/* ↓ 이 한 줄만 추가 */}
  <FavoriteButton movie={movie} />
</div>
```

---

## 확인

```bash
npm run dev
```

1. 영화 상세 페이지에서 즐겨찾기 버튼을 클릭합니다.
2. `/favorites` 페이지에서 추가한 영화가 보입니다.
3. 버튼 텍스트가 "☆ 즐겨찾기 추가" ↔︎ "★ 즐겨찾기 해제"로 전환되는지 확인합니다.

---

## 이 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `src/store/favoriteStore.ts` | 즐겨찾기 Zustand store |
| `src/components/FavoriteButton.tsx` | 즐겨찾기 버튼 (`'use client'`) |
| `src/components/FavoritesList.tsx` | 즐겨찾기 목록 (`'use client'`) |
| `src/app/favorites/page.tsx` | 즐겨찾기 페이지 |
| `src/app/movies/[id]/page.tsx` | FavoriteButton 추가 |

---

## persist 미들웨어 — HMR 대응

### 핵심 원인: HMR이 Zustand 모듈을 재평가

`persist` 없는 Zustand store는 **브라우저 메모리(모듈 레벨 변수)** 에 상태를 저장합니다.

Next.js 개발 서버는 파일을 저장할 때마다 **HMR(Hot Module Replacement)** 을 실행합니다. HMR이 발생하면 `favoriteStore.ts` 모듈이 재평가되어 store가 `favorites: []`로 초기화됩니다.

```
① 상세 페이지에서 ★ 클릭 → store: favorites: [movie] ✓
② 개발 중 파일 저장 → HMR → store 초기화
③ /favorites 이동 → store: favorites: [] → 빈 목록 표시 ✗
```

### 왜 persist가 해결책인가

`persist`는 단순히 "새로고침 대응"이 아닙니다. localStorage에 즉시 저장하기 때문에 HMR로 모듈이 재초기화되더라도 store가 localStorage에서 상태를 복원합니다.

```
① 상세 페이지에서 ★ 클릭 → store: favorites: [movie] → localStorage에도 저장
② HMR 발생 → 모듈 재평가 → store 초기화 → 즉시 localStorage에서 복원
③ /favorites 이동 → store: favorites: [movie] → 목록 표시 ✓
```

> **`partialize`**: 저장할 상태만 선택합니다. `favorites` 배열만 localStorage에 저장하고, 함수(`addFavorite` 등)는 저장하지 않습니다. 함수는 JSON으로 직렬화할 수 없고, store 재생성 시 자동으로 다시 만들어집니다.