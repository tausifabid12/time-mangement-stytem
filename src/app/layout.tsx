import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskFlow - Time Management System',
  description: 'Focus. Track. Achieve. A beautiful task and time management system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className='h-screen overflow-hidden'>
        {children}
      </body>
    </html>
  );
}