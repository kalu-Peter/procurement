"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

interface DispatchLog {
  id: string;
  po_number: string;
  supplier_name: string;
  recipient_email: string;
  dispatch_type: string;
  status: "pending" | "sent" | "failed" | "bounced";
  dispatch_date: string;
  response_notes: string;
  error_message?: string;
}

export default function DispatchLogPage() {
  const [user, setUser] = useState<any>(null);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDispatchLogs();
      // Auto-refresh every 15 seconds
      const interval = setInterval(fetchDispatchLogs, 15000);
      return () => clearInterval(interval);
    }
  }, [user, filterStatus]);

  const fetchDispatchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);

      const response = await fetch(
        `http://localhost:8000/api/dispatch-log/index.php?${params}`
      );
      const data = await response.json();

      if (data.success) {
        setDispatchLogs(data.dispatch_logs || []);
      }
    } catch (error) {
      console.error("Error fetching dispatch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; icon: string }
    > = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: "ri-time-line",
      },
      sent: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: "ri-send-plane-fill",
      },
      failed: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: "ri-close-line",
      },
      bounced: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: "ri-alert-line",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <i className={`${config.icon} mr-1`}></i>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                P.O. Dispatch Log
              </h1>
              <p className="text-gray-600 mt-2">
                Track all purchase order dispatch activities and status
              </p>
            </div>
            <Link
              href="/purchase-orders"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <i className="ri-arrow-left-line"></i>
              <span>Back to P.O.</span>
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {["pending", "sent", "failed", "bounced"].map((status) => (
              <div
                key={status}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <i className="ri-send-plane-line text-blue-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {status}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {dispatchLogs.filter((d) => d.status === status).length}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
              </select>
              <button
                onClick={() => {
                  setFilterStatus("");
                  fetchDispatchLogs();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchDispatchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto flex items-center space-x-2"
              >
                <i className="ri-refresh-line"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Dispatch Log Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">Loading dispatch logs...</div>
              </div>
            ) : dispatchLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-send-plane-line text-gray-400 text-3xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No dispatch records
                </h3>
                <p className="text-gray-500">
                  Dispatch logs will appear here after P.O. is sent
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        P.O. Number
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Supplier
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Recipient Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Dispatch Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dispatchLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {log.po_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.supplier_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.recipient_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                          {log.dispatch_type}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(log.dispatch_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {log.status === "failed" ? (
                            <span className="text-red-600">
                              {log.error_message || "Failed"}
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              {log.response_notes || "-"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
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
