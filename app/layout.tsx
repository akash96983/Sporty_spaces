'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { usePathname } from "next/navigation";
import { Toaster } from 'react-hot-toast';
import { FilterProvider } from './context/FilterContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  console.log('=== ROOT LAYOUT PATHNAME ===', pathname);
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        <title>Sporty Spaces - Book Your Perfect Sports Venue</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 via-white to-slate-50 h-screen overflow-hidden flex flex-col`}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
          }}
        />
        <FilterProvider>
          {!isAuthPage && <Navbar />}
          <main className={`flex-1 overflow-y-auto ${!isAuthPage ? 'mt-0' : ''}`}>
            {children}
          </main>
        </FilterProvider>
      </body>
    </html>
  );
}
