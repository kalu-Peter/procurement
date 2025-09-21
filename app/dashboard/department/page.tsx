'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

export default function DepartmentDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'department_head') {
      router.push('/');
      return;
    }
    setLoading(false);
  }, [router, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Department Head Dashboard</h1>
          <div className="text-sm text-gray-600">Welcome back, {user?.name}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Department Assets</h3>
            <p className="text-3xl font-bold">loading...</p>
          </div>
          <div className="bg-green-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Active Requests</h3>
            <p className="text-3xl font-bold">loading...</p>
          </div>
          <div className="bg-orange-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold">loading...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Asset Requests</h2>
            <div className="space-y-4">
              <Link 
                href="/requests/new" 
                className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center transition-colors"
              >
                New Asset Request
              </Link>
              <Link 
                href="/requests/department" 
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                View Department Requests
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Department Assets</h2>
            <div className="space-y-4">
              <Link 
                href="/assets/department" 
                className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center transition-colors"
              >
                View Department Assets
              </Link>
              <Link 
                href="/transfers/department" 
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Asset Transfers
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Reports</h2>
            <div className="space-y-4">
              <Link 
                href="/reports/department-assets" 
                className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-center transition-colors"
              >
                Asset Reports
              </Link>
              <Link 
                href="/reports/department-usage" 
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Usage Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
