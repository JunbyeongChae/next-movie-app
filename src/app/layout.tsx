// Next.js가 이 파일명을 규약으로 인식합니다. 별도 설정 없이 모든 페이지에 자동 적용됩니다.

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';

const geist = Geist({ subsets: ['latin'] });

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
    // layout.tsx가 html과 body까지 직접 렌더링합니다. 전체 HTML 문서의 껍데기 역할입니다.
    <html lang="ko">
      <body className={geist.className}>
        {/* Header와 모든 페이지({children})가 TanStack Query를 사용할 수 있도록 함께 감쌉니다. */}
        <Providers>
          <Header />
          {/* 모든 페이지가 이 영역 안에 렌더링됩니다. */}
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
