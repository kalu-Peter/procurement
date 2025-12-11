"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  details: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export default function ActivityLogsPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [period, setPeriod] = useState("year:2025");

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchLogs();
    }
  }, [user, page, period]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType: "activity-logs",
        period: period,
        page: page.toString(),
        limit: "20",
      });
      const response = await fetch(
        `http://localhost:8000/api/reports/index.php?${params}`
      );
      const data = await response.json();

      if (data.data) {
        setLogs(data.data);
        setTotalPages(data.totalPages);
      } else {
        console.error("Failed to fetch activity logs:", data.message);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return <div>Access denied. Please login as an admin.</div>;
  }

  return (
    <main className="px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Activity Logs</h1>

        {/* Filters */}
        <div className="mb-6">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border-gray-300 rounded-md"
          >
            <option value="year:2025">This Year (2025)</option>
            <option value="month:12">This Month (December)</option>
            <option value="quarter:4">This Quarter (Q4)</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">Loading activity logs...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.user_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.resource_type}
                      </td>
                      <td className="px-6 py-4 text-sm">{log.details}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
