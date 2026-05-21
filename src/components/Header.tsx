import { cookies } from 'next/headers';
import { logout } from '@/actions/auth';
import Link from 'next/link';

export default async function Header() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  const isLoggedIn = !!session;

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        🎬 Movie App
      </Link>
      <div>
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.value}</span>
            <form action={logout}>
              <button type="submit" className="text-sm text-red-500 hover:underline">
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
