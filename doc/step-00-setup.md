# Step 0 — 프로젝트 생성 및 기본 설정

> 예상 소요 시간: 20분

---

## 이 단계에서 설정하는 것

- Next.js 프로젝트를 생성하고 필요한 라이브러리를 설치합니다.
- TMDB API 키를 발급받아 환경변수로 연결합니다.
- 앞으로 사용할 폴더 구조를 미리 만들어둡니다.

---

## 1. 프로젝트 생성

```bash
npx create-next-app@latest next-movie-app
```

설치 중 아래와 같이 선택합니다.

```
√ Would you like to use the recommended Next.js defaults? » No, customize settings
√ Would you like to use TypeScript? » Yes
√ Which linter would you like to use? » ESLint
√ Would you like to use React Compiler? » No
√ Would you like to use Tailwind CSS? » Yes
√ Would you like your code inside a `src/` directory? » Yes
√ Would you like to use App Router? (recommended) » Yes
√ Would you like to customize the import alias (`@/*` by default)? » No
√ Would you like to include AGENTS.md to guide coding agents? » Yes
```

설치 완료 후 프로젝트 폴더로 이동합니다.

```bash
cd next-movie-app
```

---

## 2. 추가 패키지 설치

```bash
# 서버 상태 관리
npm install @tanstack/react-query @tanstack/react-query-devtools

# 클라이언트 상태 관리
npm install zustand

# 폼 검증
npm install zod react-hook-form @hookform/resolvers
```

---

## 3. Shadcn UI 설치

### Shadcn UI란?

미리 만들어진 컴포넌트를 프로젝트 안으로 **직접 복사**하는 방식의 UI 라이브러리입니다.

`npm install`로 설치하는 라이브러리와 달리 코드가 내 프로젝트 안에 들어오므로, 자유롭게 수정할 수 있다는 장점이 있습니다.

### 초기화

```bash
npx shadcn@latest init
```

```
Select a component library?          Radix
Which preset would you like to use?  Nova
```

### 컴포넌트 추가

자주 사용할 컴포넌트를 미리 추가합니다.

```bash
npx shadcn@latest add button input card skeleton badge
```

### 설치 확인

| 확인 항목 | 위치 |
|---|---|
| `button.tsx`, `input.tsx`, `card.tsx`, `skeleton.tsx`, `badge.tsx` | `src/components/ui/` |
| `components.json` | 프로젝트 루트 |
| `src/lib/utils.ts` | `src/lib/` |

---

## 4. TMDB API 키 설정

### API 키 발급

1. [themoviedb.org](https://www.themoviedb.org/) 에 접속하여 회원가입합니다. (이메일 인증 필요)
2. 우측 상단 **프로필 → 설정 → API** 메뉴로 이동합니다.
3. API 키를 발급받습니다. (무료, 즉시 발급)

> **주의:** 한 반이 동시에 요청할 경우 접속 제한이 걸릴 수 있습니다. 가입이 안 된다면 **휴대폰**으로 시도하세요.
> 가입 시 도메인: `http://localhost:3000`

### 환경변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 만들고 발급받은 API 키를 입력합니다.

```bash
# .env.local
TMDB_API_KEY=여기에_발급받은_API_키_입력
```

> `.env.local`은 `.gitignore`에 자동으로 포함되어 있습니다.
> GitHub에 푸시해도 키가 노출되지 않습니다.

### `NEXT_PUBLIC_` 접두사의 의미

환경변수는 접두사에 따라 접근 범위가 달라집니다.

```bash
# 서버에서만 접근 가능 — API 키 등 민감한 값
TMDB_API_KEY=abc123

# 브라우저에서도 접근 가능 — 공개해도 무방한 값
NEXT_PUBLIC_SITE_URL=https://my-movie-app.com
```

API 키처럼 외부에 노출되면 안 되는 값은 반드시 `NEXT_PUBLIC_` 없이 작성합니다.
브라우저 개발자 도구에서도 값이 보이지 않습니다.

---

## 기술 스택 역할 비교

`movie-app`과 비교하여 각 기술의 역할이 어떻게 변했는지 확인합니다.

| 기술 | movie-app | next-movie-app |
|---|---|---|
| **React Router** | 라우팅 전담 | 없음 (폴더가 라우터) |
| **TanStack Query** | 모든 서버 데이터 fetch + 캐싱 | 클라이언트 상호작용이 있는 곳만 (검색 등) |
| **Zustand** | 즐겨찾기 + 인증 상태 | 동일 (클라이언트 컴포넌트에서만 사용) |
| **Zod + RHF** | 로그인 + 검색 폼 검증 | 동일 (클라이언트 컴포넌트) |
| **TMDB API** | 없음 (json-server 사용) | 영화 데이터 소스 |
| **서버 컴포넌트** | 없음 | 초기 데이터 fetch 담당 |

> TanStack Query의 역할이 줄어든 것처럼 보이지만, 검색 같은 사용자 상호작용이 있는 곳에서는 여전히 유용합니다.
> 서버 컴포넌트로 초기 데이터를 가져오고, 이후 클라이언트에서 추가 요청이 필요할 때 TanStack Query를 활용합니다.
