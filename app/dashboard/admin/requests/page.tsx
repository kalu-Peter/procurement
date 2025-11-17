"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function AdminRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    fulfilled: 0,
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (
      !user ||
      (user.role !== "admin" && user.role !== "procurement_officer")
    ) {
      router.push("/");
      return;
    }
    fetchRequests();
  }, [user, router, statusFilter, departmentFilter]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: "", type: "success" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams({
        user_role: user?.role || "",
        ...(statusFilter && { status: statusFilter }),
        ...(departmentFilter && { department: departmentFilter }),
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

  const handleAction = async (
    request: AssetRequest,
    action: "approve" | "reject"
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    setActionLoading(selectedRequest.id);

    try {
      const response = await fetch(
        "http://localhost:8000/api/asset-requests/update.php",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedRequest.id,
            action: actionType,
            admin_notes: adminNotes,
            admin_id: user?.id,
            user_role: user?.role,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotification({
          show: true,
          message: `Request has been ${actionType}d successfully`,
          type: "success",
        });
        setIsModalOpen(false);
        fetchRequests(); // Refresh the list
      } else {
        setNotification({
          show: true,
          message: data.error || `Failed to ${actionType} request`,
          type: "error",
        });
      }
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      setNotification({
        show: true,
        message: `Failed to ${actionType} request. Please try again.`,
        type: "error",
      });
    } finally {
      setActionLoading(null);
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

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i
                className={`${
                  notification.type === "success"
                    ? "ri-check-circle-line text-green-600"
                    : "ri-error-warning-line text-red-600"
                } text-lg`}
              ></i>
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  notification.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {notification.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() =>
                  setNotification({ show: false, message: "", type: "success" })
                }
                className={`inline-flex rounded-md p-1.5 focus:outline-none ${
                  notification.type === "success"
                    ? "text-green-500 hover:bg-green-100"
                    : "text-red-500 hover:bg-red-100"
                }`}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Asset Requests Management
              </h1>
              <p className="text-gray-600 mt-2">
                Review and manage asset requisition requests
              </p>
            </div>
            <Link
              href="/dashboard/admin"
              className="text-gray-600 hover:text-blue-600"
            >
              <i className="ri-arrow-left-line text-xl"></i>
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
                  <p className="text-sm font-medium text-gray-600">
                    Pending Review
                  </p>
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

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Legal">Legal</option>
                </select>
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
                        Requester
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Asset
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
                          No asset requests found
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.requester_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.requester_department}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.asset_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.asset_category}
                              </div>
                            </div>
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
                            <div className="flex space-x-2">
                              {request.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleAction(request, "approve")
                                    }
                                    disabled={actionLoading === request.id}
                                    className="text-green-600 hover:text-green-800 disabled:opacity-50 text-sm"
                                  >
                                    <i className="ri-check-line mr-1"></i>
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAction(request, "reject")
                                    }
                                    disabled={actionLoading === request.id}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm"
                                  >
                                    <i className="ri-close-line mr-1"></i>
                                    Reject
                                  </button>
                                </>
                              )}
                              <Link
                                href={`/requests/${request.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <i className="ri-eye-line mr-1"></i>
                                View
                              </Link>
                            </div>
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

      {/* Action Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === "approve" ? "Approve" : "Reject"} Request
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Asset:</strong> {selectedRequest.asset_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Requester:</strong> {selectedRequest.requester_name} (
                {selectedRequest.requester_department})
              </p>
              <p className="text-sm text-gray-600">
                <strong>Justification:</strong> {selectedRequest.justification}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes{" "}
                {actionType === "reject" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter notes for ${actionType}ing this request...`}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionType === "reject" && !adminNotes.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
