'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        🎬 Movie App
      </Link>
      <div>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user?.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-red-500 hover:underline">
              로그아웃
            </button>
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
