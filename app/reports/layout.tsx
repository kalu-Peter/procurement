'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [router, user]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
