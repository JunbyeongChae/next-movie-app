# Server Action

**Next.js Server Action 완벽 이해하기: DB 직접 접근 예시**

> 프론트엔드 코드처럼 생겼지만, 실제로는 백엔드(서버)에서만 실행되는 마법 같은 기능인 **Server Action**의 원리를 예시 코드를 통해 라인별로 자세히 분석해 봅니다.

## 📌 작성된 예시 코드

```tsx
export async function changeName(formData: FormData){
  "use server";

  const newName = formData.get("name");

  // 브라우저에서는 쓸 수 없는 DB 직접 접근 코드를 여기서 바로 사용합니다!
  await prisma.user.update({ where: { id: 1 }, data: { name: newName } });
}
```

## 🔍 코드 상세 분석 (Line by Line)

### 1. 함수 선언부

```tsx
export async function changeName(formData: FormData){
```

- **`async` (비동기)**: 데이터베이스 통신 등 시간이 걸리는 서버 작업을 수행하므로 비동기 함수로 선언합니다.
- **`formData: FormData`**: 브라우저의 HTML `<form>`에서 제출된 데이터를 복잡한 변환 없이 그대로 전달받는 객체입니다. 프론트엔드에서 `<form action={changeName}>` 형태로 연결하기만 하면 폼 데이터가 쏙 들어옵니다.

### 2. 🪄 마법의 지시어

```ts
"use server";
```

- 이 한 줄이 Next.js에게 **"이 함수는 절대로 브라우저(프론트엔드)로 보내지 말고, 오직 서버에서만 실행해!"**라고 선언하는 핵심 지시어입니다.
- 프론트엔드 컴포넌트에서 이 함수를 `import`해서 호출하더라도, Next.js가 뒤에서 알아서 숨겨진 API를 만들어 통신하므로 개발자는 API 주소를 신경 쓸 필요가 없습니다.

### 3. 데이터 추출

```ts
const newName = formData.get("name");
```

- 폼 내부에 있는 `<input name="name" />` 요소에 사용자가 입력한 값을 아주 직관적으로 꺼내옵니다. 기존 백엔드처럼 `req.body`를 파싱할 필요가 없습니다.

### 4. 핵심: 데이터베이스 직접 접근 (보안 & 편의성)

```tsx
 await prisma.user.update({ where: { id: 1 }, data: { name: newName } });
}
```

- **`prisma` (ORM)**: 데이터베이스와 상호작용하는 도구입니다. DB 접속 비밀번호나 권한이 필요하므로 절대 브라우저 코드에 포함되면 안 됩니다.
- **Server Action의 압도적인 장점**: `"use server"` 지시어 덕분에 이 코드가 100% 백엔드에서만 실행됨이 보장됩니다. 과거처럼 백엔드 API 폴더에 `/api/updateName` 라우터를 따로 만들고 프론트엔드에서 `fetch`로 찌르는 번거로운 과정 없이, **마치 프론트엔드 함수를 짜듯 한 곳에 백엔드 코드를 안전하게 작성**할 수 있습니다.

## 🎯 핵심 요약

기존 방식이라면 **[프론트엔드 폼 데이터 전송] → [별도의 API 라우터 생성] → [서버에서 파싱 및 DB 접근]**의 3단계를 거쳐야 했습니다.

하지만 **Server Action**을 사용하면 **별도의 백엔드 API를 구축할 필요 없이**, 프론트엔드의 폼 데이터를 받아 안전하게 서버에서 DB를 직접 조작할 수 있습니다. 프론트엔드와 백엔드의 경계가 허물어지는 압도적인 개발 경험(DX)을 제공합니다.

---

## useActionState

`useActionState` 훅은 서버 액션(Server Action) 함수를 폼(form) 제출 이벤트와 연결하여 호출하는 역할을 합니다.

단순히 호출만 연결해 주는 것을 넘어, 서버 액션이 실행되는 동안의 **로딩 상태**와 실행 후 반환된 **결과값**을 클라이언트(브라우저) 화면에서 쉽게 다룰 수 있도록 도와주는 매우 유용한 React 훅입니다.

제공된 자료(`03-login-with-cookie.md`)의 `LoginForm.tsx` 예시를 보면 그 역할을 명확히 알 수 있습니다.

```tsx
import { useActionState } from "react";
import { login } from "@/actions/auth";

export default function LoginForm() {
  // 1. 서버 액션(login)을 useActionState의 첫 번째 인자로 전달합니다.
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    // 2. 반환받은 formAction을 <form>의 action 속성에 연결합니다.
    <form action={formAction}>
       {/* 3. 서버에서 에러 객체를 반환하면 state.error에 담깁니다. */}
       {state?.error && <p>{state.error}</p>}

       {/* 4. 서버 함수가 실행 중일 때는 isPending이 true가 되어 버튼을 비활성화합니다. */}
       <button type="submit" disabled={isPending}>
         {isPending ? "로그인 중..." : "로그인"}
       </button>
    </form>
  )
}
```

**작동 흐름 요약:**

1. 사용자가 "제출(Submit)" 버튼을 누르면 `<form action={formAction}>`이 실행됩니다.
2. React가 알아서 연결된 서버 액션 함수(`login`)를 서버에서 호출하며, 이때 폼에 입력된 데이터(`FormData`)가 서버로 전달됩니다.
3. 서버에서 로직(DB 조회, 쿠키 설정 등)이 처리되는 동안 `isPending`은 `true`가 됩니다.
4. 서버 액션이 실행을 마치고 결과값(예: `{ error: "비밀번호가 틀렸습니다" }`)을 반환하면, 그 값이 `state` 변수에 담겨 화면에 업데이트됩니다.

결론적으로, `useActionState`는 **"서버 액션을 폼과 연결하여 호출하는 다리 역할"**을 하며, 그와 동시에 **"로딩 상태와 서버의 응답 결과까지 한 번에 관리해 주는 훅"**이라고 이해하시면 됩니다!
