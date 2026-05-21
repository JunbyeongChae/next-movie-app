# next-movie-app

Next.js App Router 기반의 영화 정보 앱입니다.
기존 `movie-app`(React SPA)과 비교하며 Next.js의 핵심 개념을 학습합니다.

---

## 학습 목표

### 핵심 목표

- **React SPA와 Next.js의 차이**를 코드 레벨에서 비교하며 이해한다
- **서버 컴포넌트(Server Component)** 와 **클라이언트 컴포넌트(Client Component)** 를 상황에 맞게 구분하여 사용한다
- **파일 기반 라우팅(File-based Routing)** 구조를 이해하고 페이지를 구성한다
- **TMDB API** 를 서버에서 직접 호출하여 초기 데이터를 렌더링한다
- 기존에 학습한 상태 관리 원칙(TanStack Query, Zustand)을 Next.js 환경에 맞게 적용한다

### 단계별 목표

| 단계 | 목표 |
|------|------|
| Step 0 | 프로젝트 생성, 패키지 설치, TMDB API 키 연결 |
| Step 1 | layout.tsx · Providers · Header 구성, TypeScript 타입 정의, TMDB 유틸 함수 작성 |
| Step 2 | MovieCard · MovieList 구현, loading.tsx Skeleton 처리, next.config.ts 이미지 호스트 설정 |
| Step 3 | GenreFilter 구현, `useState`로 클라이언트 UI 상태 관리, `Promise.all` 동시 요청 |
| Step 4 | 동적 라우팅(`[id]`), `generateMetadata`로 동적 메타데이터, 상세 페이지 구현 |
| Step 5 | Zustand store 구현, 즐겨찾기 추가·제거, 즐겨찾기 페이지 |
| Step 6 | Zod + RHF 검색 폼, URL 파라미터 기반 검색, `useSearchParams` + `Suspense` |
| Step A | 타입 배럴 파일(`index.ts`) 도입, 환경별 logger 유틸리티 구현 |
| Step B | `useEffect` cleanup 패턴, `beforeunload` 이탈 방지 구현 |

---

## 기술 스택

| 기술 | 역할 |
|------|------|
| **Next.js (App Router)** | 프레임워크, 파일 기반 라우팅, 서버 컴포넌트 |
| **TypeScript** | 정적 타입 |
| **Tailwind CSS** | 스타일링 |
| **shadcn/ui** | UI 컴포넌트 (button, input, card, skeleton, badge) |
| **TanStack Query** | 클라이언트 상호작용이 있는 곳의 서버 상태 관리 (검색 등) |
| **Zustand** | 클라이언트 전역 상태 관리 (즐겨찾기, 인증) |
| **Zod + React Hook Form** | 폼 유효성 검사 |
| **TMDB API** | 영화 데이터 소스 |

---

## movie-app과의 기술 스택 비교

`movie-app`(React SPA)에서 각 기술이 담당하던 역할이 Next.js에서 어떻게 변했는지 비교합니다.

| 기술 | movie-app에서 | next-movie-app에서 |
|------|--------------|-------------------|
| **React Router** | 라우팅 전담 | **없음** (폴더 구조가 라우터) |
| **TanStack Query** | 모든 서버 데이터 fetch + 캐싱 | 클라이언트 상호작용이 있는 곳만 (검색 등) |
| **Zustand** | 즐겨찾기 + 인증 상태 | 동일 (클라이언트 컴포넌트에서만 사용) |
| **Zod + RHF** | 로그인 + 검색 폼 검증 | 동일 (클라이언트 컴포넌트) |
| **TMDB API** | 없음 (json-server 사용) | 영화 데이터 소스 |
| **서버 컴포넌트** | 없음 | 초기 데이터 fetch 담당 |

> TanStack Query의 역할이 줄어든 것처럼 보이지만, 검색처럼 사용자 상호작용이 있는 곳에서는 여전히 유용합니다.
> 서버 컴포넌트로 초기 데이터를 가져오고, 이후 클라이언트에서 추가 요청이 필요할 때 TanStack Query를 사용합니다.

---

## 상태 관리 분류

`movie-app`에서 배웠던 상태 분류 원칙이 `next-movie-app`에서도 동일하게 적용됩니다.

| 상태 종류 | 도구 | 예시 |
|-----------|------|------|
| **서버 상태** (초기 렌더링) | 서버 컴포넌트 | 영화 목록, 영화 상세 |
| **서버 상태** (클라이언트 상호작용) | TanStack Query | 검색 결과 |
| **클라이언트 전역 상태** | Zustand | 즐겨찾기, 로그인 여부 |
| **폼 상태** | React Hook Form + Zod | 로그인 폼 입력값 |

---

## 프로젝트 구조

```
src/
├── app/                  # Next.js App Router (파일 = 라우트)
│   ├── layout.tsx        # 공통 레이아웃 (서버 컴포넌트)
│   ├── page.tsx          # 홈 페이지 (/)
│   ├── loading.tsx       # 홈 로딩 Skeleton
│   ├── globals.css
│   ├── movies/
│   │   └── [id]/
│   │       ├── page.tsx      # 상세 페이지 + generateMetadata
│   │       └── loading.tsx   # 상세 페이지 로딩 Skeleton
│   ├── favorites/
│   │   └── page.tsx          # 즐겨찾기 페이지
│   └── search/
│       └── page.tsx          # 검색 결과 페이지
├── components/
│   ├── Header.tsx        # 네비게이션 (클라이언트 컴포넌트)
│   ├── Providers.tsx     # QueryClientProvider 래퍼 (클라이언트 컴포넌트)
│   ├── MovieCard.tsx     # 영화 카드 UI (서버 컴포넌트)
│   ├── MovieList.tsx     # 카드 그리드 목록
│   ├── GenreFilter.tsx   # 장르 필터 UI + 선택 상태 관리 (클라이언트 컴포넌트)
│   ├── FavoriteButton.tsx # 즐겨찾기 버튼 (클라이언트 컴포넌트)
│   ├── FavoritesList.tsx  # 즐겨찾기 목록 (클라이언트 컴포넌트)
│   ├── SearchForm.tsx     # 검색 폼 (클라이언트 컴포넌트)
│   └── ui/               # shadcn/ui 컴포넌트
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── skeleton.tsx
├── lib/
│   ├── tmdb.ts           # TMDB API 호출 함수 모음
│   ├── logger.ts         # 환경별 로거 (개발: console, 프로덕션: noop)
│   └── utils.ts          # 유틸리티 함수 (cn 등)
├── schemas/
│   └── search.schema.ts  # 검색 폼 Zod 스키마
├── store/
│   └── favoriteStore.ts  # 즐겨찾기 Zustand store
└── types/
    ├── movie.types.ts    # Movie, MovieDetail, Genre 타입 정의
    ├── user.types.ts     # User, AuthState 타입 정의
    └── index.ts          # 배럴 파일 (타입 re-export 중앙 진입점)
```

---

## 시작하기

### 환경 설정

1. 패키지 설치

```bash
npm install
```

2. 환경변수 파일 생성

```bash
cp .env.example .env.local
```

3. `.env.local` 파일에 TMDB API 키 입력

```bash
TMDB_API_KEY=여기에_발급받은_API_키_입력
```

> TMDB API 키 발급: [themoviedb.org](https://www.themoviedb.org/) → 프로필 → 설정 → API

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

---

## 참고 링크

- [Next.js 공식 문서](https://nextjs.org/docs)
- [TMDB API 문서](https://developer.themoviedb.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
