// 이 파일은 브라우저에서만 실행됩니다. useState 등 React 훅을 사용하기 때문입니다.
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState로 생성해야 각 사용자(요청)마다 독립적인 QueryClient 인스턴스를 갖습니다.
  // 모듈 최상단에 선언하면 모든 사용자가 하나의 캐시를 공유하게 되어
  // 사용자 A의 데이터가 사용자 B에게 보이는 심각한 버그가 발생합니다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5 // 5분간 캐시 유지 — 같은 데이터를 5분 안에 다시 요청하면 서버 호출 없이 캐시를 반환합니다.
          }
        }
      })
  );

  return (
    // QueryClientProvider로 감싸면 하위의 모든 컴포넌트에서 TanStack Query를 사용할 수 있습니다.
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 중에만 표시되는 TanStack Query 디버깅 도구입니다. 빌드 시 자동으로 제거됩니다. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
