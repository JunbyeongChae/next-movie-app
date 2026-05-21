# Step 03 — 순수 Next.js 로그인 구현

> 예상 소요 시간: 30분

---

## 이 단계에서 만들 것

**Next.js 기본 기능만으로** 간단한 형태의 로그인 기능을 만든다.

**완성 후 동작**

```
1. /login 접속 → 이메일 + 비밀번호 입력
2. 로그인 성공 → 홈으로 이동, 헤더에 이메일 표시
3. 새로고침해도 로그인이 유지된다
4. 로그아웃 버튼 클릭 → 로그인 페이지로 이동
```

**왜 라이브러리 없이 먼저 만드나?**

나중에 NextAuth를 도입할 때 “NextAuth가 이 과정을 자동으로 해준다”는 게 와닿으려면 직접 구현해본 경험이 필요하다.

---

## 이 단계의 핵심 목표

- 쿠키가 로그인 상태를 유지하는 원리를 이해한다
- Server Action으로 폼 데이터를 서버에서 처리하는 방법을 익힌다
- 브라우저 개발자 도구에서 쿠키를 직접 확인한다

---

## 핵심 개념: 쿠키란?

브라우저가 서버에 요청을 보낼 때마다 **자동으로 함께 보내는 작은 데이터 조각**이다.

로그인 후 서버가 쿠키에 “이 사람은 admin@test.com으로 로그인했음”을 저장하면
이후 모든 요청에서 브라우저가 그 쿠키를 자동으로 보내고, 서버는 그걸 읽어 로그인 상태를 확인한다.

```
① 사용자: 이메일 + 비밀번호 전송
② 서버: 확인 완료 → 쿠키에 session=admin@test.com 저장
③ 브라우저: 이후 모든 요청에 쿠키 자동 첨부
④ 서버: 쿠키를 읽어 "로그인된 사용자"로 인식
```

---

## 사용할 Next.js 기술

| 기술 | 역할 |
| --- | --- |
| **Server Action** (`"use server"`) | 폼 데이터를 서버에서 처리 |
| **`cookies()`** (`next/headers`) | 쿠키 저장 · 읽기 · 삭제 |
| **`redirect()`** (`next/navigation`) | 로그인 후 페이지 이동 |
| **`useActionState`** (`react`) | Server Action의 반환값(에러 메시지 등)을 클라이언트에서 읽기 |

---

## 시작 전 확인

코드를 작성하기 전에 현재 프로젝트 상태를 확인한다.

**1. 개발 서버 실행**

```bash
npm run dev
```

**2. `/login` 페이지가 이미 있는지 확인**

브라우저에서 `http://localhost:3000/login` 접속.
404 페이지가 나오면 정상이다 — 아직 만들지 않았으니 없는 게 맞다.

**3. `src/actions/` 폴더 생성**

이 폴더는 Server Action 파일을 모아두는 곳이다. 아직 없으면 직접 생성한다.

```
src/
└── actions/      ← 이 폴더를 새로 만든다
```

---

## 구현

### 1단계: 로그인 페이지 만들기

`src/app/login/page.tsx` 파일을 생성한다.

```tsx
// src/app/login/page.tsx
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1>
        <LoginForm />
      </div>
    </main>
  );
}
```

**✅ 1단계 중간 확인**

파일을 저장하고 `http://localhost:3000/login` 에 접속한다.
`LoginForm`을 아직 만들지 않았으므로 빨간 에러가 나온다. 이건 정상이다.
2단계, 3단계를 마치면 에러가 사라진다.

---

### 2단계: Server Action 만들기

`src/actions/auth.ts` 파일을 생성한다.

```ts
// src/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 하드코딩 계정 (임시)
const FAKE_USER = {
  email: "admin@test.com",
  password: "1234",
};

export async function login(_: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (email === FAKE_USER.email && password === FAKE_USER.password) {
    const cookieStore = await cookies();
    cookieStore.set("session", email, {
      httpOnly: true,        // JavaScript로 접근 불가 (XSS 방어)
      maxAge: 60 * 60 * 24, // 24시간
      path: "/",
    });
    redirect("/");
  }

  return { error: "이메일 또는 비밀번호가 틀렸습니다." };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
```

**`httpOnly: true`가 중요한 이유**

```
httpOnly: true  → 브라우저 JS(document.cookie)로 읽을 수 없음
httpOnly: false → JS로 쿠키를 탈취하는 XSS 공격에 노출됨
```

개발자 도구에서는 여전히 보이지만, 페이지의 JavaScript 코드로는 접근이 안 된다.

**`_: unknown` 첫 번째 인자가 뭔가?**

`useActionState`와 함께 쓰는 Server Action은 인자가 두 개다.
첫 번째는 이전 상태(prevState), 두 번째가 FormData다.
지금은 이전 상태를 쓰지 않으니 `_`로 무시한다.

---

### 3단계: 로그인 폼 컴포넌트 만들기

`src/components/LoginForm.tsx` 파일을 생성한다.

```tsx
// src/components/LoginForm.tsx
"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">이메일</label>
        <Input
          type="email"
          name="email"
          placeholder="admin@test.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">비밀번호</label>
        <Input
          type="password"
          name="password"
          placeholder="비밀번호 입력"
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}
```

**`useActionState` 구조**

```tsx
const [state, formAction, isPending] = useActionState(action, 초기값);
//     ↑ 반환값     ↑ form에 넘길 함수  ↑ 처리 중 여부
```

Server Action이 `return { error: "..." }`를 반환하면 `state`에 담긴다.
`isPending`이 `true`인 동안 버튼을 비활성화해 중복 제출을 막는다.

**✅ 3단계 중간 확인**

파일을 저장하고 로그인을 테스트해본다.

```
1. http://localhost:3000/login 접속
2. admin@test.com / 1234 입력 후 로그인 버튼 클릭
3. 홈(/)으로 이동되면 성공
4. 틀린 비밀번호 입력 → "이메일 또는 비밀번호가 틀렸습니다." 메시지 확인
```

헤더에 로그인 상태가 아직 반영되지 않는 건 정상이다. 4단계에서 헤더를 수정한다.

---

### 4단계: 헤더에 로그인 상태 표시

**현재 Header.tsx 상태**

지금 `src/components/Header.tsx`는 `'use client'` 컴포넌트로, `usePathname`으로 현재 경로를 읽어 활성 링크를 강조한다. 로그인 상태 표시가 없다.

```tsx
// 현재 코드 (수정 전)
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/search', label: '검색' },
  { href: '/favorites', label: '즐겨찾기' },
]

export default function Header() {           // ← 일반 함수 (async 아님)
  const pathname = usePathname()             // ← 활성 링크 강조용
  ...
}
```

이걸 쿠키 기반으로 교체한다. 바뀌는 핵심 두 가지:
- `'use client'` 제거 → 서버 컴포넌트로 전환
- `usePathname` 제거 → `cookies()`로 로그인 상태 확인 후 UI 분기

**`async`가 붙는 이유**

`cookies()`는 Next.js 15부터 `await`가 필요한 비동기 함수다.
함수 안에서 `await`를 쓰려면 함수 자체가 `async`여야 한다.

```tsx
// cookies()는 비동기라 await 없이 쓰면 에러가 난다
const cookieStore = await cookies();  // ← await 필요 → Header가 async여야 함
```

**수정 후 전체 코드**

`src/components/Header.tsx`를 아래 내용으로 교체한다.

```tsx
// src/components/Header.tsx
import { cookies } from "next/headers";
import { logout } from "@/actions/auth";
import Link from "next/link";

export default async function Header() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  const isLoggedIn = !!session;

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        🎬 Movie App
      </Link>
      <div>
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.value}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-red-500 hover:underline"
              >
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="text-sm hover:underline">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
```

---

## 브라우저에서 쿠키 직접 확인하기

로그인 후 쿠키가 실제로 저장됐는지 확인해보자.

### Application 탭에서 확인

```
1. 로그인 후 F12 → 개발자 도구 열기
2. 상단 탭에서 "Application" 클릭
3. 좌측 트리: Storage → Cookies → http://localhost:3000
4. "session" 쿠키가 나타난다
```

쿠키 목록에서 이런 정보를 볼 수 있다.

| Name | Value | HttpOnly | Expires / Max-Age |
| --- | --- | --- | --- |
| session | admin@test.com | ✓ | 24시간 후 |
- **HttpOnly에 체크**가 있으면 JS로 읽을 수 없다는 뜻이다.
- **Value**에 이메일이 그대로 보인다 — 나중에 이 부분이 문제가 된다.

### Network 탭에서 흐름 확인

```
1. F12 → Network 탭 열기
2. 로그인 버튼 클릭
3. 요청 목록에서 로그인 요청 클릭
4. "Response Headers" 항목 확인 → Set-Cookie: session=admin@test.com
5. 이후 다른 요청 클릭 → "Request Headers" → Cookie: session=admin@test.com
```

서버가 `Set-Cookie`로 쿠키를 심으면, 이후 브라우저가 모든 요청에 `Cookie`를 자동으로 붙인다.
이 흐름이 쿠키 기반 인증의 전부다.

### 로그아웃 후 확인

```
1. 로그아웃 버튼 클릭
2. Application → Cookies 다시 확인
3. "session" 쿠키가 사라진다
```

---

## 확인

```bash
npm run dev
```

1. 서버가 실행되면 아래 순서로 확인한다.
2. `http://localhost:3000/login` 접속
3. `admin@test.com` / `1234` 입력 후 로그인
4. 홈으로 이동되고 헤더에 이메일이 보인다
5. 새로고침해도 로그인이 유지된다
6. 개발자 도구 → Application → Cookies → `session` 쿠키 확인
7. Network 탭에서 `Set-Cookie` → `Cookie` 흐름 확인
8. 로그아웃 후 쿠키가 삭제됨을 확인

---

## ⚠️ 문제 발견

`src/actions/auth.ts`를 다시 보자.

```tsx
const FAKE_USER = {
  email: "admin@test.com",
  password: "1234",  // ← 비밀번호가 코드에 그대로 있다
};
```

그리고 Application 탭의 쿠키 Value를 보면:

```
session = admin@test.com  ← 이메일이 그대로 저장돼 있다
```

지금은 테스트용이라 괜찮아 보이지만, 실제 서비스라면:

- 코드가 GitHub에 올라가는 순간 비밀번호가 공개된다
- 여러 사용자를 관리할 수 없다
- 쿠키에 이메일이 그대로 노출된다

**다음 단계에서 이 문제를 해결한다** → 비밀번호 암호화 + 데이터베이스 도입

---

## 이 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `src/actions/auth.ts` | login / logout Server Action (신규) |
| `src/app/login/page.tsx` | 로그인 페이지 (신규) |
| `src/components/LoginForm.tsx` | 로그인 폼 — `useActionState` 적용 (신규) |
| `src/components/Header.tsx` | 서버 컴포넌트 전환, 쿠키 기반 로그인 상태 표시 |