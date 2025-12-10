"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_assets: 0,
    active_transfers: 0,
    pending_disposals: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setLoading(false);
    fetchDashboardStats();
  }, [router, user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/dashboard_stats.php"
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.statistics);
      } else {
        console.error("Failed to fetch dashboard stats:", data.error);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            Admin Dashboard
          </h1>
          <div className="text-sm text-gray-600">
            Welcome back, {user?.name}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/assets"
            className="bg-blue-500 text-white rounded-lg shadow-lg p-6 hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Total Assets</h3>
                <p className="text-3xl font-bold">
                  {statsLoading
                    ? "Loading..."
                    : stats.total_assets.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                <i className="ri-archive-line"></i>
              </div>
            </div>
          </Link>
          <Link
            href="/transfers"
            className="bg-green-500 text-white rounded-lg shadow-lg p-6 hover:bg-green-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Active Transfers</h3>
                <p className="text-3xl font-bold">
                  {statsLoading
                    ? "Loading..."
                    : stats.active_transfers.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                <i className="ri-arrow-left-right-line"></i>
              </div>
            </div>
          </Link>
          <Link
            href="/disposals"
            className="bg-purple-500 text-white rounded-lg shadow-lg p-6 hover:bg-purple-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Pending Disposals
                </h3>
                <p className="text-3xl font-bold">
                  {statsLoading
                    ? "Loading..."
                    : stats.pending_disposals.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                <i className="ri-delete-bin-line"></i>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Asset Management
            </h2>
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Asset Requests
            </h2>
            <div className="space-y-4">
              <Link
                href="/dashboard/admin/requests"
                className="block bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-center transition-colors"
              >
                Review Requests
              </Link>
              <Link
                href="/dashboard/admin/requests?status=pending"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Pending Requests
              </Link>
              <Link
                href="/dashboard/admin/requests?status=approved"
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
              User Management
            </h2>
            <div className="space-y-4">
              <Link
                href="/dashboard/admin/users/register"
                className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center transition-colors"
              >
                Register New User
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Manage Users
              </Link>
              <Link
                href="/suppliers-list"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Manage Suppliers
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
