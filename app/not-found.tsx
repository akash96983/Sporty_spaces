'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-emerald-600 mb-4">404</h1>
        <p className="text-2xl text-slate-700 mb-6">Page Not Found</p>
        <p className="text-slate-600 mb-8">The page you are looking for doesn't exist.</p>
        <p className="text-sm text-slate-500">Redirecting to home in 5 seconds...</p>
        <button
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Go Home Now
        </button>
      </div>
    </div>
  );
}
