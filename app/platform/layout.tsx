import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, Users, Key, FileText, Home, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import Loading from '@/components/loading';
import { ReactNode } from 'react';
import { AuroraBackground } from '@/components/aurora-background';

function Sidebar() {
  const t = useTranslations('Platform.Sidebar');

  const sidebarItems = [
    { href: '/platform', label: t('home'), icon: Home },
    { href: '/platform/clients-management', label: t('clientsManagement'), icon: Users },
    { href: '/platform/data-management', label: t('dataManagement'), icon: FileText },
    { href: '/platform/general-settings', label: t('generalSettings'), icon: Settings },
    { href: '/platform/reset-password', label: t('resetPassword'), icon: Key },
  ];

  return (
    <ScrollArea className="h-full py-6 pl-4 pr-6">
      <nav className="space-y-2">
        {sidebarItems.map(item => (
          <Link key={item.href} href={item.href} passHref>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-blue-800 hover:bg-blue-100 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
            >
              <item.icon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-300" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </ScrollArea>
  );
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex relative min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 overflow-hidden">
      <AuroraBackground variant="minimal" className="opacity-40" />

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden text-blue-600 dark:text-blue-300"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/90"
        >
          <Sidebar />
        </SheetContent>
      </Sheet>

      <aside className="hidden md:block w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 dark:bg-gray-900/90 dark:border-gray-800 z-10 relative">
        <Sidebar />
      </aside>

      <main className="flex-1 p-6 relative overflow-auto bg-transparent z-10">
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </main>
    </div>
  );
}
