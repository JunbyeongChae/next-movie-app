// Next.js가 이 파일명을 규약으로 인식합니다. 별도 설정 없이 모든 페이지에 자동 적용됩니다.

import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { SessionProvider } from 'next-auth/react';

// 브라우저 탭 제목과 SEO 설명을 서버에서 처리합니다. JavaScript 없이 동작합니다.
export const metadata: Metadata = {
  title: '영화 정보 앱',
  description: 'TMDB 기반 영화 정보 서비스'
};

export default function RootLayout({
  children // 현재 URL에 맞는 page.tsx가 Next.js에 의해 자동으로 전달됩니다.
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
