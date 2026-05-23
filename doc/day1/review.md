# Next.js 영화 앱 — 이론 복습 자료

> "왜 이렇게 동작하는가"를 중심으로 정리한 개념 복습서

---

## 목차

1. [웹 렌더링 방식의 역사](#1-웹-렌더링-방식의-역사)
2. [React Server Components — RSC란 무엇인가](#2-react-server-components--rsc란-무엇인가)
3. [상태(State)란 무엇인가](#3-상태state란-무엇인가)
4. [비동기 JavaScript — Promise와 async/await](#4-비동기-javascript--promise와-asyncawait)
5. [TypeScript 타입 시스템](#5-typescript-타입-시스템)
6. [캐싱(Caching)이란 무엇인가](#6-캐싱caching이란-무엇인가)
7. [URL과 상태 — 검색어는 왜 URL에 저장하는가](#7-url과-상태--검색어는-왜-url에-저장하는가)
8. [불변성(Immutability)](#8-불변성immutability)
9. [스키마와 유효성 검사 — Zod](#9-스키마와-유효성-검사--zod)
10. [환경변수와 보안 경계](#10-환경변수와-보안-경계)

---

## 1. 웹 렌더링 방식의 역사

웹 페이지가 브라우저에 표시되기까지 "누가, 언제, 어디서 HTML을 만드는가"에 따라 렌더링 방식이 나뉩니다.

### 전통적인 서버 렌더링 (SSR, ~2010년대 초)

```
사용자 요청 → 서버가 DB 조회 → 서버가 HTML 완성 → 브라우저에 전송
```

서버가 완성된 HTML을 내려주므로 브라우저는 받는 즉시 화면을 표시할 수 있었습니다. 단, 페이지 이동마다 서버에 새 HTML 전체를 요청하므로 화면이 깜빡이고 느리다는 단점이 있었습니다.

### CSR — 클라이언트 사이드 렌더링 (React 초기 방식)

React가 등장하면서 HTML 생성을 브라우저(클라이언트)가 담당하는 방식이 유행했습니다.

```
사용자 요청 → 서버가 빈 HTML + JS 전송 → 브라우저가 JS 실행 → 데이터 요청 → 화면 표시
```

```html
<!-- 서버가 내려주는 HTML — 사실상 비어있음 -->
<body>
  <div id="root"></div>
  <script src="bundle.js"></script>
</body>
```

페이지 전환이 빠르고(전체 새로고침 없음) 인터랙션이 부드럽지만, 두 가지 문제가 있습니다.

- **초기 로딩이 느리다**: JS를 다운로드·실행한 뒤에야 화면이 나타납니다.
- **SEO에 불리하다**: 검색 엔진 크롤러가 빈 HTML만 보게 되는 경우가 많습니다.

### Next.js App Router — React Server Components

Next.js는 두 방식의 장점을 결합합니다.

```
사용자 요청
→ 서버에서 데이터 fetch + HTML 생성 (서버 컴포넌트)
→ 완성된 HTML을 브라우저에 전송
→ 브라우저에서 인터랙션 부분만 JS로 활성화 (클라이언트 컴포넌트)
```

이 앱에서 `page.tsx`(서버 컴포넌트)가 TMDB를 호출하고 완성된 HTML을 내려주는 것이 바로 이 방식입니다. `'use client'`로 선언된 컴포넌트만 브라우저에서 JS로 실행됩니다.

---

## 2. React Server Components — RSC란 무엇인가

### 핵심 질문: "이 컴포넌트는 어디서 실행되는가?"

React 컴포넌트는 이제 실행 환경이 두 가지입니다.

| 구분 | 실행 환경 | 선언 방법 | 할 수 있는 것 | 할 수 없는 것 |
|---|---|---|---|---|
| 서버 컴포넌트 | Node.js 서버 | 기본값 (선언 불필요) | `async/await`, `process.env`, DB 직접 접근 | `useState`, `useEffect`, 이벤트 핸들러 |
| 클라이언트 컴포넌트 | 브라우저 | `'use client'` | `useState`, 이벤트 핸들러, 브라우저 API | `async` 컴포넌트, 서버 전용 모듈 |

### 왜 서버에서는 `useState`를 쓸 수 없는가

`useState`는 **렌더링 사이클** 위에서 동작합니다. 사용자가 버튼을 클릭하면 상태가 바뀌고, React가 컴포넌트를 다시 실행(리렌더링)해 화면을 업데이트합니다.

서버는 요청을 받으면 HTML을 만들어 보내고 끝입니다. "렌더링 사이클"이라는 개념 자체가 없습니다. 버튼 클릭 이벤트도 없고, 상태가 바뀌어 화면이 업데이트되는 과정도 없습니다. 그래서 서버에서 `useState`를 쓰는 것은 개념적으로 불가능합니다.

### `'use client'` 경계의 의미

`'use client'`는 "이 파일부터는 클라이언트에서 실행한다"는 **경계(boundary)** 선언입니다.

```
layout.tsx (서버)
└── Providers.tsx ('use client' 경계)
    ├── Header.tsx          ← 경계 안쪽 → 클라이언트
    └── page.tsx (서버)     ← 경계 밖 → 서버
        └── GenreFilter.tsx ('use client' 경계)
            └── MovieList.tsx ← 경계 안쪽 → 클라이언트
```

**중요**: 클라이언트 컴포넌트가 서버 컴포넌트를 `import`해서 렌더링하는 것은 불가합니다. 반대로 서버 컴포넌트 안에 클라이언트 컴포넌트를 넣는 것은 가능합니다.

### Next.js 파일 규약 — 파일명이 역할을 결정한다

Next.js App Router는 "파일 기반 라우팅"을 넘어 파일명으로 역할 자체를 결정합니다.

| 파일명 | Next.js가 자동으로 하는 일 |
|---|---|
| `page.tsx` | 해당 경로(`/`, `/search` 등)의 페이지로 등록 |
| `layout.tsx` | 같은 폴더와 모든 하위 폴더의 `page.tsx`를 자동으로 감쌈 |
| `loading.tsx` | 같은 폴더의 `page.tsx`가 응답을 기다리는 동안 자동으로 대신 표시 |
| `error.tsx` | 같은 폴더에서 에러가 발생하면 자동으로 표시 |

`loading.tsx`가 동작하는 원리는 React의 `<Suspense>`입니다. Next.js가 내부적으로 `page.tsx`를 `<Suspense>`로 감싸고, `fallback`으로 `loading.tsx`를 사용합니다. 개발자는 파일만 만들면 됩니다.

---

## 3. 상태(State)란 무엇인가

### 상태의 정의

상태(State)란 **시간이 지남에 따라 변할 수 있는 데이터**입니다. "지금 이 순간 이 값은 무엇인가"를 담고 있습니다.

### 서버 상태 vs 클라이언트 상태

이 앱에서 다루는 상태는 성격이 완전히 다른 두 종류입니다.

**서버 상태 — TanStack Query가 담당**

```
출처: TMDB 서버 (외부)
특징: 내가 통제할 수 없다. 다른 사람이 영화 정보를 수정하면 바뀐다.
문제: 언제 stale(신선하지 않은 상태)해지는가? 언제 다시 fetch해야 하는가?
예시: 인기 영화 목록, 영화 상세 정보, 검색 결과
```

TanStack Query는 이 문제를 해결합니다. `staleTime: 5분`으로 설정하면 "5분 동안은 캐시된 데이터를 신선한 것으로 간주하고 서버에 재요청하지 않겠다"는 뜻입니다.

**클라이언트 상태 — Zustand가 담당**

```
출처: 사용자의 행동 (클릭, 입력)
특징: 내가 완전히 통제한다. 서버와 무관하다.
문제: 여러 컴포넌트가 같은 데이터를 바라봐야 할 때 어떻게 공유하는가?
예시: 즐겨찾기 목록, 로그인 여부, 선택된 장르
```

### 상태 공유 문제 — Props Drilling vs 전역 상태

컴포넌트 트리에서 멀리 떨어진 두 컴포넌트가 같은 데이터를 공유해야 할 때 문제가 생깁니다.

```
상세 페이지 (/movies/42) → 즐겨찾기 추가 버튼 클릭
즐겨찾기 페이지 (/favorites) → 추가된 영화가 보여야 함
```

이 두 페이지는 완전히 다른 경로에 있습니다. props로 데이터를 내려보내는 것이 불가능합니다. Zustand는 **컴포넌트 트리 바깥**에 데이터를 보관하고, 어떤 컴포넌트든 직접 접근할 수 있게 합니다.

### `useState` vs Zustand — 언제 무엇을 쓰는가

| 기준 | `useState` | Zustand |
|---|---|---|
| 공유 범위 | 해당 컴포넌트 내부 | 앱 전체 |
| 사용 예 | 장르 필터의 선택 상태 | 즐겨찾기 목록 |
| 이유 | 장르 선택은 홈 페이지 내부에서만 필요 | 즐겨찾기는 여러 페이지에서 공유 필요 |

### Zustand — `set`과 `get`의 역할

```ts
(set, get) => ({
  favorites: [],

  // set: 상태를 "변경"한다 → 구독 중인 컴포넌트가 리렌더링됨
  addFavorite: (movie) =>
    set((state) => ({ favorites: [...state.favorites, movie] })),

  // get: 상태를 "읽기만" 한다 → 리렌더링 없음
  isFavorite: (movieId) =>
    get().favorites.some((m) => m.id === movieId),
})
```

`isFavorite`에서 `set` 대신 `get`을 쓰는 이유: 단순 조회인데 `set`을 쓰면 상태가 바뀐 것으로 간주되어 불필요한 리렌더링이 발생합니다.

---

## 4. 비동기 JavaScript — Promise와 async/await

### 왜 비동기가 필요한가

JavaScript는 **단일 스레드** 언어입니다. 한 번에 하나의 작업만 처리합니다. 네트워크 요청처럼 시간이 걸리는 작업을 동기(순서대로)로 처리하면, 응답이 올 때까지 브라우저 전체가 멈춥니다.

```
동기 방식: 요청 보냄 → [서버 응답 대기 중... 브라우저 전체 멈춤] → 응답 수신 → 다음 코드 실행
비동기 방식: 요청 보냄 → [다른 코드 계속 실행] → 응답 오면 → 지정해둔 코드 실행
```

### Promise — 미래의 결과를 나타내는 객체

`Promise`는 "지금 당장 결과는 없지만, 나중에 결과가 생기면 알려주겠다"는 약속입니다.

```
상태 1: Pending (대기) — 아직 결과 없음
상태 2: Fulfilled (이행) — 성공적으로 결과가 생김
상태 3: Rejected (거부) — 실패 (에러 발생)
```

### `async/await` — Promise를 동기 코드처럼 읽게 해주는 문법

`await`는 Promise가 fulfilled 상태가 될 때까지 해당 함수의 실행을 일시 중단합니다. 브라우저 전체가 멈추는 것이 아니라, 이 함수만 기다리는 동안 다른 코드는 계속 실행됩니다.

```ts
// await 없이 쓰면: movies는 Promise 객체 자체 (영화 배열이 아님)
const movies = fetchPopularMovies()

// await를 쓰면: fetch가 완료되어 실제 영화 배열을 받을 때까지 기다림
const movies = await fetchPopularMovies()
```

### `Promise.all` — 여러 비동기 작업 동시 처리

```ts
// 순서대로 실행 — 총 소요 시간 = A + B
const movies = await fetchPopularMovies()  // 예: 200ms
const genres = await fetchGenres()         // 예: 100ms → 총 300ms

// 동시 실행 — 총 소요 시간 = max(A, B)
const [movies, genres] = await Promise.all([
  fetchPopularMovies(),  // 예: 200ms
  fetchGenres(),         // 예: 100ms → 총 200ms
])
```

`Promise.all`은 배열 안의 모든 Promise를 동시에 시작하고, 가장 늦게 끝나는 것이 끝날 때 결과를 돌려줍니다. 두 요청이 서로 의존하지 않을 때 (A의 결과가 B에 필요하지 않을 때) 사용합니다.

---

## 5. TypeScript 타입 시스템

### 타입이 필요한 이유

JavaScript는 동적 타입 언어입니다. 변수에 어떤 값이든 넣을 수 있고, 함수가 어떤 값을 반환하는지 선언하지 않아도 됩니다. 이는 유연하지만, 코드가 커질수록 "이 함수가 반환하는 객체에 `title` 필드가 있는가?"를 추적하기 어려워집니다. 실수는 런타임(실제 실행 중)에 발견됩니다.

TypeScript는 타입을 미리 선언해두면 **컴파일 타임(코드 작성 중)** 에 오류를 잡아줍니다.

### `interface` — 객체의 형태를 정의한다

```ts
interface Movie {
  id: number
  title: string
  poster_path: string | null  // null일 수도 있음
  genre_ids: number[]         // number 배열
}
```

이 타입을 정의하면 `movie.titl`(오타)처럼 존재하지 않는 필드에 접근할 때 코드 에디터가 즉시 경고합니다.

### `extends` — 타입 상속

```ts
interface MovieDetail extends Movie {
  genres: Genre[]  // Movie의 모든 필드 + 추가 필드
  runtime: number
}
```

`extends`는 "부모 타입의 모든 필드를 그대로 가져오고, 거기에 더 추가한다"는 뜻입니다. `Movie`가 변경되면 `MovieDetail`에도 자동 반영됩니다.

### 제네릭(`<T>`) — 타입을 매개변수처럼 다룬다

```ts
// T는 "나중에 결정할 타입"을 나타내는 자리 표시자
async function tmdbFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(...)
  return res.json()  // TypeScript는 이 값을 T 타입으로 취급
}

// 호출할 때 T를 결정
const data = await tmdbFetch<{ results: Movie[] }>('/movie/popular')
// data.results는 자동으로 Movie[] 타입
```

제네릭이 없다면 같은 `tmdbFetch` 함수를 호출 목적별로 여러 개 만들어야 합니다. 제네릭을 쓰면 하나의 함수로 다양한 응답 형태를 타입 안전하게 처리할 수 있습니다.

### `z.infer` — 스키마에서 타입 자동 추출

```ts
const searchSchema = z.object({
  query: z.string().min(1).max(50),
})

// Zod 스키마로부터 TypeScript 타입을 자동으로 만들어냄
type SearchFormValues = z.infer<typeof searchSchema>
// 결과: { query: string }
```

스키마(유효성 규칙)와 타입을 따로 선언하면 둘이 어긋날 위험이 있습니다. `z.infer`는 스키마로부터 타입을 도출하므로 항상 일치가 보장됩니다.

---

## 6. 캐싱(Caching)이란 무엇인가

### 캐싱의 기본 아이디어

같은 데이터를 매번 새로 가져오는 대신, 한 번 가져온 결과를 저장해두고 재사용하는 것입니다.

```
첫 번째 요청: 브라우저 → Next.js 서버 → TMDB 서버 → 응답 → 저장(캐시)
두 번째 요청: 브라우저 → Next.js 서버 → (캐시에서 반환) ← TMDB 요청 없음
```

### 이 앱에서 캐싱이 일어나는 세 곳

**1. Next.js 서버 캐시 — `revalidate: 3600`**

```ts
// src/lib/tmdb.ts
await fetch(url, { next: { revalidate: 3600 } })
```

Next.js 서버가 TMDB 응답을 1시간(3600초) 동안 보관합니다. 같은 URL 요청이 1시간 안에 들어오면 TMDB에 요청하지 않고 저장된 결과를 반환합니다.

`generateMetadata`와 `page.tsx` 본문이 각각 `fetchMovie`를 호출해도 네트워크 요청은 한 번만 발생하는 이유가 이것입니다.

**2. TanStack Query 캐시 — `staleTime: 5분`**

```ts
// src/components/Providers.tsx
new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } } })
```

브라우저(클라이언트)가 한 번 받아온 서버 데이터를 5분간 유지합니다. 같은 데이터를 5분 안에 다시 요청하면 서버 호출 없이 캐시를 반환합니다. (이 앱에서는 서버 컴포넌트로 fetch하므로 TanStack Query의 캐싱이 활용되는 곳은 향후 클라이언트 사이드 fetch가 필요한 상황에 대비한 설정입니다.)

**3. Zustand `persist` — localStorage**

```ts
// src/store/favoriteStore.ts
persist(..., { storage: createJSONStorage(() => localStorage) })
```

Zustand의 메모리 상태를 localStorage에 동기화합니다. 페이지를 닫았다 열어도 즐겨찾기 목록이 남아 있습니다.

### `stale`이란 무엇인가

캐싱에서 "신선한(fresh)" 데이터와 "오래된(stale)" 데이터를 구분합니다.

- **fresh**: 캐시된 데이터를 그대로 써도 되는 상태. 서버에 재요청하지 않음.
- **stale**: 캐시된 데이터가 오래됐을 수 있는 상태. 다음 기회에 백그라운드에서 재요청.

`staleTime`은 캐시된 데이터가 fresh 상태로 유지되는 시간입니다.

---

## 7. URL과 상태 — 검색어는 왜 URL에 저장하는가

### 상태를 저장하는 두 가지 장소

| 장소 | 예시 | 특징 |
|---|---|---|
| 메모리 (JS 변수, `useState`) | 선택된 장르 | 새로고침하면 사라짐, 공유 불가 |
| URL | `?query=인셉션` | 새로고침해도 유지, 공유 가능, 북마크 가능 |

검색어를 `useState`에 저장하면 링크를 공유했을 때 상대방은 검색 결과를 볼 수 없습니다. URL에 저장하면 `https://example.com/search?query=인셉션`을 공유하는 것만으로 같은 결과를 볼 수 있습니다.

### 뒤로 가기 버튼이 자연스럽게 동작하는 이유

브라우저의 뒤로 가기는 "이전 URL로 돌아가는" 동작입니다. 검색어가 URL에 있으면 뒤로 가기 시 이전 검색어로 자동으로 돌아갑니다. `useState`에만 있다면 뒤로 가기를 해도 검색어가 복원되지 않습니다.

### URL 인코딩 — `encodeURIComponent`

URL에는 쓸 수 없는 문자가 있습니다. 한글, 공백, 특수문자 등은 반드시 인코딩해야 합니다.

```
원본: 인셉션
인코딩 후: %EC%9D%B8%EC%85%89%EC%85%98

원본: hello world
인코딩 후: hello%20world
```

`encodeURIComponent`는 이 변환을 자동으로 수행합니다. `decodeURIComponent`는 반대 방향입니다. Next.js는 `searchParams`를 제공할 때 이미 디코딩된 값을 줍니다.

---

## 8. 불변성(Immutability)

### 불변성이란

불변성이란 **기존 데이터를 직접 수정하지 않고, 새 데이터를 만들어 교체한다**는 원칙입니다.

React와 Zustand는 상태가 변경됐는지 감지할 때 참조(메모리 주소)를 비교합니다. 배열을 직접 수정하면 참조가 바뀌지 않아 변경을 감지하지 못합니다.

```ts
// ❌ 직접 수정 — 배열의 참조(주소)가 그대로 → React가 변경 감지 못함 → 리렌더링 안 됨
state.favorites.push(movie)

// ✅ 새 배열 생성 — 새로운 참조 → React가 변경 감지 → 리렌더링 됨
[...state.favorites, movie]
```

### 스프레드 연산자 `...`의 의미

```ts
const original = [1, 2, 3]
const copy = [...original, 4]  // [1, 2, 3, 4] — 새 배열

// 객체도 동일
const obj = { a: 1, b: 2 }
const newObj = { ...obj, b: 99 }  // { a: 1, b: 99 } — 새 객체
```

`...original`은 "original 배열의 요소들을 여기에 펼쳐놓는다"는 뜻입니다. 새 배열 리터럴 `[]` 안에 넣으므로 새로운 참조를 가진 새 배열이 만들어집니다.

---

## 9. 스키마와 유효성 검사 — Zod

### 왜 유효성 검사가 필요한가

사용자는 폼에 무엇이든 입력할 수 있습니다. "검색어를 입력하세요"라는 텍스트 필드에 아무것도 입력하지 않고 제출할 수도 있고, 10,000자를 입력할 수도 있습니다. 이런 입력이 서버까지 그대로 전달되면 예상치 못한 오류가 발생합니다.

**신뢰 경계(Trust Boundary)**: 외부에서 들어오는 모든 데이터(사용자 입력, API 응답)는 신뢰할 수 없습니다. 내 코드 안으로 들어오는 순간 반드시 검증해야 합니다.

### Zod — "스키마"로 규칙을 선언한다

```ts
const searchSchema = z.object({
  query: z
    .string()       // 문자열이어야 함
    .min(1, '검색어를 입력하세요')  // 최소 1글자
    .max(50),       // 최대 50글자
})
```

Zod 스키마는 두 가지 역할을 동시에 수행합니다.

1. **런타임 유효성 검사**: 실제로 값을 검증하고 에러 메시지를 생성
2. **TypeScript 타입 생성**: `z.infer`로 타입을 자동 추출

### React Hook Form + Zod 연결

```ts
useForm<SearchFormValues>({
  resolver: zodResolver(searchSchema),
})
```

`zodResolver`는 React Hook Form의 유효성 검사 엔진 자리에 Zod를 끼워 넣는 어댑터입니다. 폼을 제출할 때 자동으로 Zod 스키마로 값을 검증하고, 실패하면 `errors` 객체에 메시지를 담아줍니다.

---

## 10. 환경변수와 보안 경계

### API 키를 코드에 직접 쓰면 안 되는 이유

```ts
// ❌ 절대 하면 안 됨
const API_KEY = 'abc123xyz'
```

코드는 GitHub에 올라갑니다. GitHub은 공개 저장소일 수도 있고, 설령 비공개라도 계정이 탈취되면 노출됩니다. API 키가 노출되면 타인이 내 이름(내 계정)으로 API를 남용할 수 있습니다.

### 환경변수 — 실행 환경에 따라 다른 값을 주입한다

```bash
# .env.local — 개발 환경
TMDB_API_KEY=개발용키

# 실제 배포 환경 (Vercel, AWS 등) — 서버 설정에서 별도 관리
TMDB_API_KEY=프로덕션키
```

코드에는 `process.env.TMDB_API_KEY`라는 참조만 남고, 실제 값은 코드 바깥에 있습니다.

### `NEXT_PUBLIC_` 접두사 — 접근 범위의 경계

```
TMDB_API_KEY         → 서버(Node.js)에서만 접근 가능
NEXT_PUBLIC_SITE_URL → 서버 + 브라우저 모두 접근 가능
```

Next.js는 빌드 시 `NEXT_PUBLIC_` 변수의 값을 JS 번들에 **하드코딩**합니다. 브라우저로 전송되는 JS 파일 안에 값이 들어가므로 누구나 개발자 도구로 볼 수 있습니다.

`NEXT_PUBLIC_`이 없는 변수는 서버 메모리에만 존재하고 절대 클라이언트로 전송되지 않습니다. API 키처럼 민감한 값은 반드시 `NEXT_PUBLIC_`을 붙이지 않아야 합니다.

### 서버 컴포넌트가 보안에 유리한 이유

서버 컴포넌트에서 API 키를 사용해 TMDB를 호출하면, **API 키 자체는 서버에서만 사용되고 브라우저로 전송되지 않습니다**. 브라우저는 완성된 HTML(영화 목록)만 받습니다.

CSR 방식에서는 브라우저가 TMDB를 직접 호출해야 하므로 API 키가 JS 번들에 들어가거나 URL에 노출되는 위험이 있습니다.

---

## 개념 간 관계도

```
웹 요청이 들어오면
├── 서버 컴포넌트 (async)
│   ├── process.env로 API 키 읽기 (환경변수)
│   ├── fetch → TMDB (비동기 / Promise)
│   │   └── 결과를 1시간 캐싱 (Next.js 캐시)
│   ├── TypeScript 타입으로 응답 검증 (Generic <T>)
│   └── 완성된 HTML 반환
│       └── 클라이언트 컴포넌트를 포함할 수 있음
│
└── 클라이언트 컴포넌트 ('use client')
    ├── useState — 컴포넌트 내부 UI 상태
    │   └── 예: 선택된 장르 (불변성 원칙으로 업데이트)
    ├── Zustand — 앱 전역 클라이언트 상태
    │   ├── 예: 즐겨찾기 목록
    │   └── persist → localStorage (캐시)
    └── URL 파라미터
        └── 검색어처럼 "공유 가능한 상태"는 URL에 보관
```
