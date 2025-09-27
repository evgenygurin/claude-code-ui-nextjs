import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Claude Code UI',
  description:
    'Modern web interface for Claude Code CLI and Cursor CLI built with Next.js',
  keywords: ['claude', 'cursor', 'ai', 'code', 'ui', 'nextjs', 'vercel'],
  authors: [{ name: 'Claude Code UI Contributors' }],
  creator: 'Claude Code UI Contributors',
  openGraph: {
    title: 'Claude Code UI',
    description: 'Modern web interface for Claude Code CLI and Cursor CLI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude Code UI',
    description: 'Modern web interface for Claude Code CLI and Cursor CLI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
