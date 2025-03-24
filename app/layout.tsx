import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { createClient } from '@/lib/utils/supabase/server';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Wolian AI',
  description: 'Transform your content with into a API endpoint',
  openGraph: {
    images: ['/1024-t.svg'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html suppressHydrationWarning lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider initialUser={user}>
              <div className="min-h-screen flex flex-col">
                <NavBar />
                <main className="flex-grow pt-16">{children}</main>
                <Footer />
              </div>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
