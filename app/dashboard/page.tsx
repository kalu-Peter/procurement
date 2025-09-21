'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Redirect to role-specific dashboard
    if (user.role === 'admin') {
      router.push('/dashboard/admin');
    } else if (user.role === 'procurement_officer') {
      router.push('/dashboard/procurement');
    } else if (user.role === 'department_head') {
      router.push('/dashboard/department');
    }
  }, [router, user]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Loading your dashboard...</p>
      </div>
    </div>
  );
}
