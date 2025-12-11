'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

interface DashboardStats {
  pending_requests: number;
  approved_requests: number;
  total_assets: number;
}

export default function ProcurementDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    pending_requests: 0,
    approved_requests: 0,
    total_assets: 0,
  });

  useEffect(() => {
    if (!user || user.role !== 'procurement_officer') {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const [requestsRes, assetsRes] = await Promise.all([
          fetch('http://localhost:8000/api/asset-requests/index.php?user_role=procurement_officer'),
          fetch('http://localhost:8000/api/dashboard_stats.php')
        ]);

        const requestsData = await requestsRes.json();
        const assetsData = await assetsRes.json();

        setStats({
          pending_requests: requestsData.stats.pending || 0,
          approved_requests: requestsData.stats.approved || 0,
          total_assets: assetsData.statistics.total_assets || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Procurement Officer Dashboard</h1>
          <div className="text-sm text-gray-600">Welcome back, {user?.name}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Requests</h3>
            <p className="text-3xl font-bold">{stats.pending_requests}</p>
          </div>
          <div className="bg-green-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Approved Requests</h3>
            <p className="text-3xl font-bold">{stats.approved_requests}</p>
          </div>
          <div className="bg-yellow-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Assets</h3>
            <p className="text-3xl font-bold">{stats.total_assets}</p>
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Asset Requests</h2>
            <div className="space-y-4">
              <Link
                href="/requests"
                className="block bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-center transition-colors"
              >
                Review Requests
              </Link>
              <Link
                href="/requests?status=pending"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Pending Requests
              </Link>
              <Link
                href="/requests?status=approved"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Approved Requests
              </Link>
            </div>
          </div>


          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Purchase Orders
            </h2>
            <div className="space-y-4">
              <Link
                href="/purchase-orders/new"
                className="block bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 text-center transition-colors"
              >
                Create P.O.
              </Link>
              <Link
                href="/purchase-orders"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                View All P.O.s
              </Link>
              <Link
                href="/goods-receipts"
                className="block bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 text-center transition-colors"
              >
                Goods Receipts
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Dispatch Management
            </h2>
            <div className="space-y-4">
              <Link
                href="/dispatch-log"
                className="block bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 text-center transition-colors"
              >
                View Dispatch Log
              </Link>
              <Link
                href="/purchase-orders"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Track Deliveries
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Transfer Management
            </h2>
            <div className="space-y-4">
              <Link
                href="/transfers/new"
                className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-center transition-colors"
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

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Disposal Management
            </h2>
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
        </div>
      </div>
    </div>
  );
}
