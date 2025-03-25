import Link from 'next/link';
import Image from 'next/image';
import HeaderAuth from './header-auth';

export function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-b border-indigo-50 dark:border-slate-800">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/1024-t.svg" alt="Wolian AI" width={32} height={32} />
            <span className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              Wolian AI
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <HeaderAuth />
        </div>
      </div>
    </nav>
  );
}
