'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/search', label: '검색' },
  { href: '/favorites', label: '즐겨찾기' }
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b px-6 py-4 flex items-center gap-6">
      <Link href="/" className="font-bold text-lg">
        🎬 MovieApp
      </Link>
      <nav className="flex gap-4">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={pathname === link.href ? 'font-bold underline' : 'text-gray-500'}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
