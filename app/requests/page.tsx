"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

interface AssetRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  requester_department: string;
  asset_name: string;
  asset_category: string;
  asset_description?: string;
  justification: string;
  estimated_cost?: number;
  urgency: string;
  preferred_vendor?: string;
  budget_code?: string;
  expected_delivery_date?: string;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function RequestsPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    fulfilled: 0,
  });

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams({
        user_id: user?.id || "",
        user_role: user?.role || "",
      });

      const response = await fetch(
        `http://localhost:8000/api/asset-requests/index.php?${params}`
      );
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests);
        setStats(data.stats);
      } else {
        console.error("Failed to fetch requests:", data.error);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "fulfilled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Normal":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Asset Requests
              </h1>
              <p className="text-gray-600 mt-2">
                Track your asset requisition requests
              </p>
            </div>
            <Link
              href="/requests/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
            >
              <i className="ri-add-line"></i>
              <span>New Request</span>
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <i className="ri-time-line text-yellow-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.approved}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <i className="ri-close-line text-red-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.rejected}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <i className="ri-package-line text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fulfilled</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.fulfilled}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">Loading requests...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Asset
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Urgency
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Cost
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Requested
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center">
                            <i className="ri-inbox-line text-4xl text-gray-400 mb-4"></i>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              No requests found
                            </h3>
                            <p className="text-gray-600 mb-4">
                              You haven't submitted any asset requests yet.
                            </p>
                            <Link
                              href="/requests/new"
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                            >
                              Submit Your First Request
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.asset_name}
                              </div>
                              {request.asset_description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {request.asset_description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {request.asset_category}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(
                                request.urgency
                              )}`}
                            >
                              {request.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {request.estimated_cost
                              ? `KES ${request.estimated_cost.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/requests/${request.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <i className="ri-eye-line mr-1"></i>
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
