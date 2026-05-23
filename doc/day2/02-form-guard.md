# Step 02 — 폼 이탈 방지

> 예상 소요 시간: 15분

---

## 이탈 방지란?

폼에 뭔가 입력하다가 페이지를 떠나려 할 때 브라우저가 한 번 더 물어보는 기능이다.

```
사용자가 검색창에 "어벤져스 엔드게임" 타이핑 중
  → 실수로 F5(새로고침) 누름
  → 브라우저: "이 페이지를 떠나시겠습니까?"
  → 사용자: "아차, 취소" → 입력 내용 유지
```

“이탈” = 페이지를 떠나는 것, “방지” = 그걸 막는 것.
즉 **입력 중에 실수로 나가는 걸 한 번 막아주는 장치**다.

---

## 이 단계에서 만들 것

검색 폼에 이탈 방지 기능을 추가한다.

**완성 후 동작**

```
1. /search 페이지에서 검색어를 입력한다
2. 입력 도중 브라우저 새로고침 또는 탭 닫기를 시도한다
3. 브라우저가 "이 페이지를 떠나시겠습니까?" 확인 대화상자를 표시한다
4. 검색어를 지우면 → 확인 대화상자가 다시 나타나지 않는다
```

---

## 이 단계의 핵심 목표

- 브라우저 생명주기 이벤트(`beforeunload`)를 이해한다
- useEffect cleanup 패턴을 실전에서 활용한다

---

## 두 가지 이탈 시나리오

```
시나리오 1: 브라우저 닫기 / 새로고침 / 다른 사이트로 이동
  → window.onbeforeunload 로 처리 (브라우저 기본 확인 대화상자)

시나리오 2: 앱 내부 페이지 이동 (홈 → 검색 등)
  → Next.js에 내장된 차단 API 없음
  → 커스텀 구현 필요 (이 수업에서는 시나리오 1만 다룸)
```

---

## 구현: SearchForm에 이탈 방지 추가

사용자가 검색어를 입력 중일 때 페이지를 떠나면 확인 메시지를 보여준다.

```tsx
// src/components/SearchForm.tsx 수정
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchSchema, type SearchFormValues } from "@/schemas/search.schema";

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: searchParams.get("query") ?? "",
    },
  });

  // 입력 중일 때 브라우저 이탈 방지
  useEffect(() => {
    if (!isDirty) return; // 입력이 없으면 이벤트 등록하지 않음

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 브라우저가 기본 확인 메시지를 표시함
    };

    window.addEventListener("beforeunload", handler);

    // cleanup: 컴포넌트 언마운트 시 또는 isDirty 변경 시 이벤트 제거
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]); // isDirty가 바뀔 때마다 재등록

  function onSubmit(data: SearchFormValues) {
    router.push(`/search?query=${encodeURIComponent(data.query)}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <div className="flex-1">
        <Input {...register("query")} placeholder="영화 제목을 입력하세요" />
        {errors.query && (
          <p className="text-sm text-destructive mt-1">
            {errors.query.message}
          </p>
        )}
      </div>
      <Button type="submit">검색</Button>
    </form>
  );
}
```

---

## 핵심 개념

**`isDirty`란?**
React Hook Form이 제공하는 상태다. `defaultValues`와 현재 입력값이 다르면 `true`가 된다.
사용자가 아무것도 입력하지 않았을 때는 이탈 방지를 등록하지 않아도 된다.

**cleanup 함수가 필요한 이유**

```
useEffect 흐름:
  isDirty = false → 이벤트 등록 안 함
  isDirty = true  → 이벤트 등록
  isDirty = false → cleanup 실행 → 이벤트 제거  ← 이게 없으면 계속 이벤트가 남음
  컴포넌트 언마운트 → cleanup 실행 → 이벤트 제거
```

cleanup 없이 이벤트를 제거하지 않으면 페이지 이동 후에도 이탈 방지가 남아 있게 된다.

---

## 확인

```bash
npm run dev
```

1. `/search` 페이지에서 검색어를 입력한다.
2. 브라우저 새로고침을 시도한다.
3. “이 페이지를 떠나시겠습니까?” 확인 메시지가 나타난다.
4. 검색어를 지우면 새로고침 시 확인 메시지가 나타나지 않는다.

> **주의**: 크롬에서 `beforeunload` 메시지 커스텀 텍스트는 보안상 표시되지 않는다. 브라우저가 자체 메시지를 보여준다.

---

## 이 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `src/components/SearchForm.tsx` | `isDirty` + `useEffect` 이탈 방지 로직 추가 |