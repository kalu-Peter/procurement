"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

interface GoodsReceipt {
  id: string;
  gr_number: string;
  po_id: string;
  po_number: string;
  supplier_name: string;
  status: "pending" | "partial" | "complete" | "accepted" | "rejected";
  total_received_amount: number;
  receipt_date: string;
  received_by_name?: string;
  items?: any[];
}

interface GRItem {
  id: string;
  asset_name: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  unit_price: number;
  line_total: number;
  inspection_status: string;
  condition_notes?: string;
}

export default function GoodsReceiptDetailPage() {
  const params = useParams();
  const grId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [gr, setGr] = useState<GoodsReceipt | null>(null);
  const [grItems, setGrItems] = useState<GRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (grId && user) {
      fetchGoodsReceipt();
      fetchGRItems();
    }
  }, [grId, user]);

  const fetchGoodsReceipt = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/goods-receipts/index.php?id=${grId}`
      );
      const data = await response.json();

      if (
        data.success &&
        data.goods_receipts &&
        data.goods_receipts.length > 0
      ) {
        const receipt = data.goods_receipts[0];
        setGr(receipt);
        setSelectedStatus(receipt.status);
      }
    } catch (error) {
      console.error("Error fetching GR:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGRItems = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/gr-items/index.php?gr_id=${grId}`
      );
      const data = await response.json();

      if (data.success && data.items) {
        setGrItems(data.items);
      }
    } catch (error) {
      console.error("Error fetching GR items:", error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      alert("Please select a status");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        "http://localhost:8000/api/goods-receipts/index.php",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: grId,
            status: selectedStatus,
            status_notes: statusNotes,
            updated_by: user?.id,
            updated_by_name: user?.name,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`Goods Receipt status updated to ${selectedStatus}`);
        setShowUpdateModal(false);
        setStatusNotes("");
        setTimeout(() => {
          fetchGoodsReceipt();
        }, 500);
      } else {
        alert("Error: " + (data.message || "Failed to update status"));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error);
    } finally {
      setUpdating(false);
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
      partial: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: "ri-inbox-line",
      },
      complete: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        icon: "ri-checkbox-multiple-line",
      },
      accepted: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: "ri-check-line",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: "ri-close-line",
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

  if (!isHydrated) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">
            Please login to access this page
          </div>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading goods receipt details...</div>
        </div>
      </div>
    );
  }

  if (!gr) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-red-500">Goods Receipt not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {gr.gr_number}
                </h1>
                {getStatusBadge(gr.status)}
              </div>
              <p className="text-gray-600">Supplier: {gr.supplier_name}</p>
              <p className="text-gray-600">P.O. Number: {gr.po_number}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpdateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <i className="ri-edit-line"></i>
                <span>Update Status</span>
              </button>
              <Link
                href="/goods-receipts"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center space-x-2"
              >
                <i className="ri-arrow-left-line"></i>
                <span>Back</span>
              </Link>
            </div>
          </div>

          {/* General Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Goods Receipt Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  GR Number
                </label>
                <p className="text-gray-900 font-medium">{gr.gr_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Status
                </label>
                <p>{getStatusBadge(gr.status)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  P.O. Number
                </label>
                <Link
                  href={`/purchase-orders/${gr.po_id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {gr.po_number}
                </Link>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Supplier Name
                </label>
                <p className="text-gray-900">{gr.supplier_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Receipt Date
                </label>
                <p className="text-gray-900">
                  {new Date(gr.receipt_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Total Received Amount
                </label>
                <p className="text-gray-900 font-semibold">
                  KES {gr.total_received_amount?.toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Received By
                </label>
                <p className="text-gray-900">
                  {gr.received_by_name || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* GR Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Received Items
            </h2>
            {grItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No items in this goods receipt
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Asset Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Ordered
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Received
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Accepted
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Rejected
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Line Total
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Inspection
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {grItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.asset_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.quantity_ordered}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.quantity_received}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-700 font-medium">
                          {item.quantity_accepted}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-700 font-medium">
                          {item.quantity_rejected}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          KES {item.unit_price?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          KES {item.line_total?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                              item.inspection_status === "pass"
                                ? "bg-green-100 text-green-800"
                                : item.inspection_status === "fail"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {item.inspection_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <i className="ri-inbox-line text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Items Ordered
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {grItems.reduce(
                      (sum, item) => sum + item.quantity_ordered,
                      0
                    )}
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
                  <p className="text-sm font-medium text-gray-600">
                    Total Accepted
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {grItems.reduce(
                      (sum, item) => sum + item.quantity_accepted,
                      0
                    )}
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
                  <p className="text-sm font-medium text-gray-600">
                    Total Rejected
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {grItems.reduce(
                      (sum, item) => sum + item.quantity_rejected,
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Update Goods Receipt Status
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Status --</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="complete">Complete</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any notes about this status update..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setStatusNotes("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || !selectedStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
