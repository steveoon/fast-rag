import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import 'katex/dist/katex.min.css';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { headers } from 'next/headers';

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
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isChatBotPage = pathname.startsWith('/chat-bot/');

  return (
    <html suppressHydrationWarning lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="min-h-screen flex flex-col">
              {!isChatBotPage && <NavBar />}
              <main className={`flex-grow ${!isChatBotPage ? 'pt-16' : ''}`}>{children}</main>
              {!isChatBotPage && <Footer />}
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
