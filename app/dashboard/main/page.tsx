"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, User } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Redirect to login if no user
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // Redirect to role-specific dashboard
    if (currentUser.role === "admin") {
      router.push("/dashboard/admin");
    } else if (currentUser.role === "procurement_officer") {
      router.push("/dashboard/procurement");
    } else if (currentUser.role === "department_head") {
      router.push("/dashboard/department");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600">
              Manage your organization's assets and procurement efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                  <p className="text-gray-600 text-sm">Total Assets</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-computer-line text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                  <p className="text-gray-600 text-sm">Pending Transfers</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="ri-exchange-line text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">KES 2.4M</p>
                  <p className="text-gray-600 text-sm">Total Value</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-green-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">15</p>
                  <p className="text-gray-600 text-sm">Disposals This Month</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="ri-delete-bin-line text-red-600 text-xl"></i>
                </div>
              </div>
            </div>

            <Link
              href="/purchase-orders"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-gray-600 text-sm">Purchase Orders</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <i className="ri-file-text-line text-indigo-600 text-xl"></i>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link
                  href="/assets/new"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-add-line text-blue-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    Add Asset
                  </span>
                </Link>

                <Link
                  href="/transfers/new"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-exchange-line text-yellow-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    Transfer Asset
                  </span>
                </Link>

                <Link
                  href="/disposals/new"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-delete-bin-line text-red-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    Dispose Asset
                  </span>
                </Link>

                <Link
                  href="/assets/import"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-file-excel-line text-green-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    Import Excel
                  </span>
                </Link>

                <Link
                  href="/purchase-orders/new"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-file-text-line text-indigo-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    Create P.O.
                  </span>
                </Link>

                <Link
                  href="/goods-receipts"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-inbox-line text-cyan-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    Goods Receipts
                  </span>
                </Link>

                <Link
                  href="/dispatch-log"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-send-plane-line text-teal-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    Dispatch Log
                  </span>
                </Link>

                <Link
                  href="/reports"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="ri-bar-chart-line text-purple-600 text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    View Reports
                  </span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-add-line text-blue-600 text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      New asset added
                    </p>
                    <p className="text-xs text-gray-500">
                      Dell OptiPlex 7090 - IT Department
                    </p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-exchange-line text-yellow-600 text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      Transfer approved
                    </p>
                    <p className="text-xs text-gray-500">
                      HP Printer - Engineering to Finance
                    </p>
                    <p className="text-xs text-gray-400">5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-delete-bin-line text-red-600 text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      Asset disposed
                    </p>
                    <p className="text-xs text-gray-500">
                      Old laptop - HR Department
                    </p>
                    <p className="text-xs text-gray-400">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-file-excel-line text-green-600 text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      Excel import
                    </p>
                    <p className="text-xs text-gray-500">
                      125 assets imported successfully
                    </p>
                    <p className="text-xs text-gray-400">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
