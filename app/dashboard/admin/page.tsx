'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
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
          <h1 className="text-3xl font-semibold text-gray-800">Admin Dashboard</h1>
          <div className="text-sm text-gray-600">Welcome back, {user?.name}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Assets</h3>
            <p className="text-3xl font-bold">loading...</p>
          </div>
          <div className="bg-green-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Active Transfers</h3>
            <p className="text-3xl font-bold">loading...</p>
          </div>
          <div className="bg-purple-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Disposals</h3>
            <p className="text-3xl font-bold">loading...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Asset Management</h2>
            <div className="space-y-4">
              <Link 
                href="/assets/new" 
                className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center transition-colors"
              >
                Add New Asset
              </Link>
              <Link 
                href="/assets" 
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                View All Assets
              </Link>
              <Link 
                href="/assets/import" 
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Import Assets
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Disposal Management</h2>
            <div className="space-y-4">
              <Link 
                href="/disposals/new" 
                className="block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-center transition-colors"
              >
                Create Disposal
              </Link>
              <Link 
                href="/disposals" 
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                View Disposals
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Transfer Management</h2>
            <div className="space-y-4">
              <Link 
                href="/transfers/new" 
                className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center transition-colors"
              >
                Create Transfer
              </Link>
              <Link 
                href="/transfers" 
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                View Transfers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
