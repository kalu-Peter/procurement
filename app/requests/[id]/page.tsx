"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [request, setRequest] = useState<AssetRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  useEffect(() => {
    if (user && params.id) {
      fetchRequestDetails();
    }
  }, [user, params.id]);

  const fetchRequestDetails = async () => {
    try {
      const queryParams = new URLSearchParams({
        user_role: user?.role || "",
        ...(user?.role !== "admin" &&
          user?.role !== "procurement_officer" && { user_id: user?.id || "" }),
      });

      const response = await fetch(
        `http://localhost:8000/api/asset-requests/index.php?${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        // Find the specific request by ID
        const foundRequest = data.requests.find(
          (req: AssetRequest) => req.id === params.id
        );

        if (foundRequest) {
          setRequest(foundRequest);
        } else {
          setError(
            "Request not found or you do not have permission to view it."
          );
        }
      } else {
        setError("Failed to fetch request details: " + data.error);
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
      setError("Failed to fetch request details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "fulfilled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Normal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "ri-time-line";
      case "approved":
        return "ri-check-circle-line";
      case "rejected":
        return "ri-close-circle-line";
      case "fulfilled":
        return "ri-package-line";
      default:
        return "ri-question-line";
    }
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading request details...</div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-red-600 text-2xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Request Not Found
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/requests"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Back to Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Link
              href="/requests"
              className="text-gray-600 hover:text-blue-600"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Request Details
              </h1>
              <p className="text-gray-600 mt-2">
                View complete information about this asset request
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div
            className={`rounded-lg border-2 p-6 mb-8 ${getStatusColor(
              request.status
            )}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-white bg-opacity-50">
                  <i
                    className={`${getStatusIcon(request.status)} text-2xl`}
                  ></i>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Request{" "}
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </h2>
                  <p className="text-sm opacity-80">
                    {request.status === "pending" && "Waiting for admin review"}
                    {request.status === "approved" &&
                      `Approved ${
                        request.approved_at
                          ? "on " +
                            new Date(request.approved_at).toLocaleDateString()
                          : ""
                      }`}
                    {request.status === "rejected" &&
                      `Rejected ${
                        request.rejected_at
                          ? "on " +
                            new Date(request.rejected_at).toLocaleDateString()
                          : ""
                      }`}
                    {request.status === "fulfilled" &&
                      "Asset has been provided"}
                  </p>
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-full border ${getUrgencyColor(
                  request.urgency
                )}`}
              >
                <span className="text-sm font-medium">
                  {request.urgency} Priority
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Asset Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="ri-computer-line mr-2 text-blue-600"></i>
                  Asset Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Name
                    </label>
                    <p className="text-gray-900 font-medium">
                      {request.asset_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <p className="text-gray-900">{request.asset_category}</p>
                  </div>
                  {request.asset_description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-gray-900">
                        {request.asset_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="ri-file-text-line mr-2 text-blue-600"></i>
                  Request Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Justification
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-900">{request.justification}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {request.estimated_cost && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Cost
                        </label>
                        <p className="text-gray-900 font-medium">
                          KES {request.estimated_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {request.preferred_vendor && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Vendor
                        </label>
                        <p className="text-gray-900">
                          {request.preferred_vendor}
                        </p>
                      </div>
                    )}
                    {request.budget_code && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Budget Code
                        </label>
                        <p className="text-gray-900">{request.budget_code}</p>
                      </div>
                    )}
                    {request.expected_delivery_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Delivery Date
                        </label>
                        <p className="text-gray-900">
                          {new Date(
                            request.expected_delivery_date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {(request.status === "approved" ||
                request.status === "rejected") &&
                request.admin_notes && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="ri-admin-line mr-2 text-blue-600"></i>
                      Admin Review
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {request.approved_at &&
                            new Date(request.approved_at).toLocaleString()}
                          {request.rejected_at &&
                            new Date(request.rejected_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes
                        </label>
                        <p className="text-gray-900">{request.admin_notes}</p>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Requester Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="ri-user-line mr-2 text-blue-600"></i>
                  Requester
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <p className="text-gray-900">{request.requester_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <p className="text-gray-900">
                      {request.requester_department}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 text-sm">
                      {request.requester_email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="ri-time-line mr-2 text-blue-600"></i>
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Request Created
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {request.approved_at && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Request Approved
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.approved_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.rejected_at && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Request Rejected
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.rejected_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/requests"
                    className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-center transition-colors"
                  >
                    <i className="ri-arrow-left-line mr-2"></i>
                    Back to Requests
                  </Link>

                  {request.status === "approved" && (
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <i className="ri-download-line mr-2"></i>
                      Download Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
