# Step 04 — NextAuth Credentials 로그인

---

## 이 단계에서 만들 것

03단계에서 직접 구현한 쿠키 로그인을 **NextAuth로 교체**한다.
로그인 동작은 똑같지만, 인증 코드를 직접 작성하지 않아도 된다.

**03단계와 비교**

```
03 (직접 구현)              04 (NextAuth)
─────────────────────────────────────────
cookies().set()         →  signIn()
cookies().get()         →  useSession() / auth()
cookies().delete()      →  signOut()
직접 만든 쿠키 로직       →  NextAuth가 암호화·관리
```

---

## 이 단계의 핵심 목표

- NextAuth가 인증 과정을 어떻게 추상화하는지 이해한다
- 서버 컴포넌트와 클라이언트 컴포넌트에서 세션을 읽는 방법을 익힌다

---

## 선행 개념: NextAuth의 API Route

NextAuth는 설치하면 `/api/auth/*` 경로를 자동으로 만들어준다.

```
/api/auth/signin    ← 로그인 처리
/api/auth/signout   ← 로그아웃 처리
/api/auth/session   ← 세션 조회
```

Next.js App Router에서 이 경로는 `app/api/auth/[...nextauth]/route.ts` 파일 하나로 연결된다.

---

## 시작 전 확인

**1. 개발 서버 실행**

```bash
npm run dev
```

**2. 현재 로그인 확인**

`http://localhost:3000/login` 에서 03단계에서 만든 쿠키 로그인이 동작하는지 확인한다.
이 단계가 끝나면 같은 화면에서 NextAuth로 동작하게 된다.

---

## 구현

### 1단계: 패키지 설치

```bash
npm install next-auth@beta
```

---

### 2단계: 환경변수 설정

프로젝트 루트의 `.env.local` 파일에 추가한다.

```
# .env.local
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

**NEXTAUTH_SECRET 생성 방법**

터미널에서 아래 명령으로 랜덤 키를 생성한다.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

출력된 값을 `NEXTAUTH_SECRET`에 붙여넣는다.

**✅ 2단계 중간 확인**

`.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인한다.
시크릿 키가 GitHub에 올라가면 안 된다.

---

### 3단계: NextAuth 설정 파일 만들기

`src/lib/auth.ts` 파일을 생성한다.

> ```
> 아래 코드 설명
> // NextAuth의 핵심 모듈을 불러옵니다.
> import NextAuth from 'next-auth'
> // OAuth(구글, 카카오 등)가 아닌, 이메일/비밀번호 등 사용자가 직접 입력한 정보로 
> // 로그인하기 위한 자격 증명(Credentials) 제공자를 불러옵니다.
> import Credentials from 'next-auth/providers/credentials'
> 
> // NextAuth를 초기화하고, 앱 전역에서 활용할 핵심 함수 4가지를 내보냅니다.
> // - handlers : Next.js API 라우트에서 처리할 GET, POST 요청 핸들러 (app/api/auth/[...nextauth]/route.ts에서 사용)
> // - auth     : 서버 컴포넌트나 서버 액션에서 현재 로그인된 사용자(세션) 정보를 가져올 때 사용하는 함수
> // - signIn   : 서버 측에서 로그인 처리를 수행할 때 호출하는 함수
> // - signOut  : 서버 측에서 로그아웃 처리를 수행할 때 호출하는 함수
> export const { handlers, auth, signIn, signOut } = NextAuth({
>   // 이 아래에는 providers, pages, callbacks 등의 세부 설정이 들어갑니다.
> ```

```tsx
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        // 하드코딩 계정 (임시) — 다음 단계에서 DB 조회로 교체
        if (
          credentials.email === 'admin@test.com' &&
          credentials.password === '1234'
        ) {
          return {
            id: '1',
            name: '테스트 유저',
            email: 'admin@test.com',
          }
        }
        return null  // null 반환 시 로그인 실패
      },
    }),
  ],
  pages: {
    signIn: '/login',  // NextAuth 기본 로그인 페이지 대신 우리 페이지 사용
  },
})
```

**`authorize()`가 하는 일**

```
credentials(이메일, 비밀번호) 받음
  → 일치하면 유저 객체 반환 → 로그인 성공
  → null 반환 → 로그인 실패
```

03단계에서 직접 작성한 `FAKE_USER` 비교 로직과 같은 역할이다.

---

### 4단계: API Route 생성

`src/app/api/auth/[...nextauth]/route.ts` 파일을 생성한다.

```tsx
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

이 파일 하나로 NextAuth가 필요한 모든 인증 API를 자동으로 처리한다.

**✅ 4단계 중간 확인**

브라우저에서 `http://localhost:3000/api/auth/session` 에 접속한다.
`{}` 또는 `{"user": null}` 이 보이면 NextAuth가 정상적으로 동작하는 것이다.

---

### 5단계: LoginForm 수정 (Server Action → NextAuth)

`src/components/LoginForm.tsx`를 수정한다.
기존의 `login` Server Action 대신 NextAuth의 `signIn()`을 사용한다.

**수정 전**

```tsx
import { login } from "@/actions/auth";
const [state, formAction, isPending] = useActionState(login, null);
```

**수정 후**

```tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,  // 직접 리다이렉트 제어
    })

    if (result?.error) {
      setError('이메일 또는 비밀번호가 틀렸습니다.');
    } else {
      window.location.href = '/';
    }

    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">이메일</label>
        <Input type="email" name="email" placeholder="admin@test.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">비밀번호</label>
        <Input type="password" name="password" placeholder="비밀번호 입력" required />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}
```

---

### 6단계: Header 수정 (cookies → useSession)

`src/components/Header.tsx`를 수정한다.

**수정 전 (03단계)**

```tsx
// 서버 컴포넌트에서 cookies()로 읽었음
import { cookies } from 'next/headers'

export default async function Header() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  ...
}
```

**수정 후 (NextAuth)**

```tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">🎬 Movie App</Link>
      <div>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-red-500 hover:underline"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-sm hover:underline">로그인</Link>
        )}
      </div>
    </header>
  )
}
```

---

### 7단계: SessionProvider 추가

`useSession()`을 쓰려면 앱 최상단을 `SessionProvider`로 감싸야 한다.
`src/app/layout.tsx`를 수정한다.

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { SessionProvider } from 'next-auth/react'

export const metadata: Metadata = {
  title: '영화 정보 앱',
  description: 'TMDB 기반 영화 정보 서비스'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

**SessionProvider가 필요한 이유**

`useSession()`은 React Context로 세션 데이터를 공유한다.
`SessionProvider`가 없으면 `useSession()`이 Context를 찾지 못해 에러가 난다.

---

## 서버 컴포넌트에서 세션 읽기

Header를 클라이언트 컴포넌트로 바꿨지만, 서버 컴포넌트에서도 세션을 읽을 수 있다.

```tsx
// 서버 컴포넌트 (page.tsx 등)
import { auth } from '@/lib/auth'

export default async function SomePage() {
  const session = await auth()  // 서버에서 세션 읽기

  if (!session) {
    // 로그인 안 된 사용자 처리
  }

  return <div>{session.user?.email}</div>
}
```

| 위치 | 방법 |
| --- | --- |
| 서버 컴포넌트 | `await auth()` |
| 클라이언트 컴포넌트 | `useSession()` |

---

> ## 브라우저에서 NextAuth 동작 직접 확인하기 (테스트)
>
> 단순히 화면이 바뀌는 것 외에, NextAuth가 내부적으로 어떻게 동작하는지
> 개발자 도구로 직접 테스트해본다.
>
> ### 1. 쿠키 확인 (Application 탭)
> 03단계에서는 우리가 직접 `session`이라는 이름의 쿠키를 구웠다.
> NextAuth는 자체적인 보안 쿠키를 사용한다.
>
> 1. 로그인 후 F12 → 개발자 도구 → **Application 탭** 열기
> 2. Storage → Cookies → `http://localhost:3000` 클릭
> 3. `next-auth.session-token` (또는 `__Secure-next-auth.session-token`)
> 쿠키가 생성된 것을 확인한다.
> 4. 03단계와 달리 값이 알아볼 수 없게 길고 복잡하게 **암호화(JWE)**되어 있는
> 것을 볼 수 있다.
>
> ### 2. 세션 API 확인 (주소창 직접 접속)
> NextAuth가 자동으로 만들어준 세션 조회 API를 직접 호출해본다.
>
> 1. 로그인된 상태에서 브라우저 주소창에 `http://localhost:3000/api/auth/session`
> 을 입력한다.
> 2. 아래와 같이 우리가 `authorize()`에서 반환했던 유저 정보가 JSON으로 나타난다.
>    ```json
>    {
>      "user": { "name": "테스트 유저", "email": "admin@test.com" },
>      "expires": "202x-xx-xxtxx:xx:xx.xxz"
>    }
>    ```
> 이 데이터를 바탕으로 프론트엔드의 `useSession()`이나 백엔드의 `auth()`가 동작하는 것이다.


## 확인

1. `admin@test.com` / `1234` 로 로그인이 된다
2. 헤더에 이메일이 표시된다
3. 새로고침 후에도 로그인 상태가 유지된다
4. 로그아웃 후 `/login` 으로 이동하고 세션이 삭제된다
5. 틀린 비밀번호 입력 시 에러 메시지가 표시된다

---

## Zustand vs NextAuth 비교

|  | Zustand authStore | NextAuth |
| --- | --- | --- |
| 상태 저장 위치 | 브라우저 메모리 | 암호화된 쿠키 |
| 새로고침 후 유지 | persist 미들웨어 필요 | 자동 유지 |
| 서버 컴포넌트 접근 | 불가 | `await auth()`로 가능 |
| 소셜 로그인 | 직접 구현 필요 | 프로바이더 추가만으로 가능 |
| 코드 양 | 많음 | 적음 |

---

## 이 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `src/lib/auth.ts` | NextAuth 설정 — Credentials 프로바이더, authorize 로직 (신규) |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 핸들러 — GET/POST 자동 처리 (신규) |
| `src/components/LoginForm.tsx` | `useActionState` → `signIn('credentials')` 방식으로 교체 |
| `src/components/Header.tsx` | `cookies()` 서버 컴포넌트 → `useSession()` 클라이언트 컴포넌트로 전환 |
| `src/app/layout.tsx` | `SessionProvider` 추가 — `useSession()` 사용을 위한 Context 제공 |