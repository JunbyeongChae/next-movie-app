# Step A — 타입 중앙화 + 유틸리티

> 예상 소요 시간: 20분

---

## 이 단계의 핵심 목표

- 타입 파일을 중앙에서 관리하는 이유를 이해한다
- 환경 변수로 개발/프로덕션 동작을 분리하는 패턴을 익힌다

---

## ① 공유 타입 파일 중앙화

### 현재 상태

```
src/types/
└── movie.types.ts    ← 영화 관련 타입만 있음
```

각 기능이 늘어날수록 타입 파일이 분산된다. 모든 타입을 한 곳에서 import할 수 있도록 중앙 진입점을 만든다.

### 만드는 것

```
src/types/
├── movie.types.ts    ← 기존 (변경 없음)
├── user.types.ts     ← 새로 생성 (인증 관련 타입)
└── index.ts          ← 새로 생성 (re-export 중앙 진입점)
```

### 1. user.types.ts 생성

```ts
// src/types/user.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}
```

### 2. index.ts 생성

```ts
// src/types/index.ts
export * from "./movie.types";
export * from "./user.types";
```

### 3. 기존 import 경로 수정

아래 6개 파일에서 import 경로를 순서대로 수정한다.

---

**📄 `src/components/MovieCard.tsx` — 6번째 줄**

```tsx
// 수정 전
import type { Movie } from "@/types/movie.types";

// 수정 후
import type { Movie } from "@/types";
```

---

**📄 `src/components/MovieList.tsx` — 4번째 줄**

```tsx
// 수정 전
import type { Movie } from "@/types/movie.types";

// 수정 후
import type { Movie } from "@/types";
```

---

**📄 `src/components/FavoriteButton.tsx` — 6번째 줄**

```tsx
// 수정 전
import type { Movie } from "@/types/movie.types";

// 수정 후
import type { Movie } from "@/types";
```

---

**📄 `src/components/GenreFilter.tsx` — 5번째 줄**

```tsx
// 수정 전
import type { Genre, Movie } from "@/types/movie.types";

// 수정 후
import type { Genre, Movie } from "@/types";
```

---

**📄 `src/store/favoriteStore.ts` — 4번째 줄**

```ts
// 수정 전
import type { Movie } from "@/types/movie.types";

// 수정 후
import type { Movie } from "@/types";
```

---

**📄 `src/lib/tmdb.ts` — 1번째 줄**

```ts
// 수정 전
import { Movie, MovieDetail, Genre } from '../types/movie.types';

// 수정 후
import { Movie, MovieDetail, Genre } from '@/types';
```

---

### 왜 이렇게 하는가?

### Q. MovieCard는 Movie만 필요한데, 경로를 바꾸는 게 무슨 의미가 있나?

`MovieCard` 단독으로 보면 차이가 없다. `Movie` 타입 하나를 가져오는 결과는 동일하다.

이득은 `MovieCard`가 아니라 **프로젝트 전체의 유지보수** 측면에 있다.

예시: `movie.types.ts` 파일명을 `film.types.ts`로 바꾸기로 했다.

**`index.ts` 없을 때** — 5개 파일을 모두 열어서 수정해야 한다.

```
MovieCard.tsx      ← import 경로 수정
MovieList.tsx      ← import 경로 수정
FavoriteButton.tsx ← import 경로 수정
GenreFilter.tsx    ← import 경로 수정
favoriteStore.ts   ← import 경로 수정
```

**`index.ts` 있을 때** — `index.ts` 한 줄만 수정하면 끝이다.

```ts
// src/types/index.ts
export * from "./film.types"; // 이 한 줄만 변경
export * from "./user.types";
```

나머지 5개 파일은 `@/types`를 바라보고 있으므로 손댈 필요가 없다.

---

### Q. 폴더명만 적어도 되나? 모듈 파일명을 명시하지 않아도 되나?

된다. **폴더 경로를 import하면 번들러가 그 폴더 안의 `index.ts`를 자동으로 찾는다.**

```ts
import type { Movie } from "@/types";
//                         ↑ 폴더명
//                         실제로는 @/types/index.ts 를 읽는다
```

책의 목차와 같다. 책 제목만 말해도 목차(`index.ts`)가 모든 챕터(모듈)를 안내한다.

`index.ts`가 두 모듈을 전부 re-export하므로, `@/types` 하나로 어느 모듈의 타입이든 꺼낼 수 있다.

```ts
import type { Movie } from "@/types"; // movie.types에서 옴
import type { User } from "@/types"; // user.types에서 옴
import type { Movie, User } from "@/types"; // 둘 다 한 번에
```

이 패턴을 **배럴 파일(Barrel File)** 이라고 부른다. `import { useState } from 'react'`가 가능한 이유도 React 내부에 `index.js`가 모든 export를 모아두기 때문이다.

---

## ② 프로덕션 console noop

### 학습 흐름

```
1단계: tmdb.ts에 console.log 추가  →  브라우저 콘솔에서 API 응답 노출 확인
2단계: logger.ts 생성
3단계: tmdb.ts에서 console.log → logger.log 교체
4단계: 프로덕션 빌드 후 로그가 사라짐을 확인
```

---

### 1단계: 문제 상황 만들기

**📄 `src/lib/tmdb.ts`** 파일만 수정한다.

`tmdbFetch` 함수에서 API 응답을 반환하기 직전에 로그를 추가한다.

```ts
// 수정 전 (파일 끝부분)
if (!res.ok) throw new Error(`TMDB 요청 실패:${endpoint}`);
return res.json();

// 수정 후
if (!res.ok) throw new Error(`TMDB 요청 실패:${endpoint}`);
const data = await res.json();
console.log("[tmdb] 응답:", endpoint, data);
return data;
```

저장 후 브라우저를 새로고침하면 콘솔에 아래와 같이 출력된다.

```
Server  [tmdb] 응답: /movie/popular {page: 1, results: Array(20), ...}
Server  [tmdb] 응답: /genre/movie/list {genres: Array(19)}
```

`Server` 접두사가 붙는 이유: `tmdb.ts`는 Next.js 서버에서 실행되는 코드다. Next.js는 개발 환경에서 서버 측 콘솔 출력을 브라우저 콘솔로 포워딩하며, 이때 출처를 구분하기 위해 `Server` 레이블을 붙인다.

응답 데이터가 브라우저 콘솔에 그대로 노출된다. 이 상태로 배포하면 누구든 개발자 도구를 열어 볼 수 있다.

---

### 2단계: logger.ts 생성

```
src/lib/
└── logger.ts    ← 새로 생성
```

```ts
// src/lib/logger.ts

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  // 에러는 프로덕션에서도 Sentry 등 모니터링 도구가 캡처하므로 항상 출력
  error: console.error.bind(console),
};
```

---

### 코드 원리

### Q. `process.env.NODE_ENV`가 뭔가?

실행 환경이 개발인지 프로덕션인지를 나타내는 환경변수다. Next.js가 자동으로 값을 설정한다.

| 상황 | 값 |
| --- | --- |
| `npm run dev` 실행 중 | `'development'` |
| `npm run build` 후 배포 | `'production'` |

`isDev`는 개발 환경일 때만 `true`가 된다.

---

### Q. `isDev ? console.log.bind(console) : () => {}` 이 줄은 무슨 뜻인가?

logger 객체가 만들어지는 시점(앱 시작 시)에 **환경에 따라 함수 자체를 교체**한다.

```ts
// 개발 환경 → logger.log는 실제 console.log가 된다
logger.log = console.log.bind(console);

// 프로덕션 환경 → logger.log는 아무것도 안 하는 빈 함수가 된다
logger.log = () => {};
```

`() => {}`는 호출해도 아무 일도 일어나지 않는 함수다. 이런 함수를 **noop(no operation)** 이라고 부른다.

---

### Q. 왜 `error`는 항상 출력하는가?

`error`는 프로덕션에서도 Sentry 같은 모니터링 도구가 캡처한다. 에러를 숨기면 실제 서비스 장애를 감지할 수 없으므로 항상 출력한다.

---

### 3단계: console.log → logger.log 교체

**📄 `src/lib/tmdb.ts`** 파일만 수정한다.

파일 상단 import 목록에 아래 줄을 추가한다.

```ts
import { logger } from "@/lib/logger";
```

1단계에서 추가했던 console.log를 교체한다.

저장 후 브라우저 콘솔에 `Server [tmdb] 응답:` 로그가 그대로 출력되는 것이 정상이다. 개발 환경이므로 `logger.log`가 실제 `console.log`로 동작한다.

> Fast Refresh가 완전히 완료된 뒤 새로고침해야 한다. 저장 직후 바로 새로고침하면 이전 버전이 아직 실행 중일 수 있다.

---

### 4단계: 프로덕션 빌드로 확인

dev 서버를 종료하지 않고 새 터미널에서 아래 명령을 실행한다.

```bash
npm run build && npx next start -p 3001
```

- `npm run build` — 프로덕션용으로 코드를 컴파일한다. `NODE_ENV`가 `'production'`으로 설정된다.
- `npx next start -p 3001` — 컴파일된 결과를 3001 포트로 실행한다. dev 서버(3000)와 충돌하지 않는다.

브라우저에서 `http://localhost:3001` 접속 → 개발자 도구 콘솔 확인.

`[tmdb] 응답:` 로그가 없으면 완료다. 프로덕션 환경에서 `isDev = false`가 되어 `logger.log`가 noop으로 교체된 결과다.

| 주소 | 환경 | 로그 |
| --- | --- | --- |
| `http://localhost:3000` | 개발 | 출력됨 |
| `http://localhost:3001` | 프로덕션 | 없음 ✅ |

---

## 확인

```bash
npm run dev
```

1. 홈 페이지가 정상적으로 로드됩니다 — 타입 import 경로 변경이 동작하는지 확인합니다.
2. 브라우저 콘솔에 `Server [tmdb] 응답:` 로그가 출력됩니다.
3. 프로덕션 환경에서 로그 비활성화 확인은 `## ② 4단계`를 참고합니다.

---

## 이 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `src/types/user.types.ts` | User, AuthState 타입 정의 (신규) |
| `src/types/index.ts` | 배럴 파일 — 타입 re-export 중앙 진입점 (신규) |
| `src/lib/logger.ts` | 환경별 로거 — 개발: console, 프로덕션: noop (신규) |
| 6개 파일 import 경로 수정 | `@/types/movie.types` → `@/types` |