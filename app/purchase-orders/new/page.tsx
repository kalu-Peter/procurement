"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

interface AssetRequest {
  id: string;
  asset_name: string;
  asset_category: string;
  estimated_cost: number | string;
  status: string;
  requester_name: string;
  requester_email: string;
  requester_department?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  status?: string;
  category?: string;
}

export default function GeneratePOPage() {
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [approvedRequests, setApprovedRequests] = useState<AssetRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [formData, setFormData] = useState({
    expected_delivery_date: "",
    payment_terms: "30 days Net",
    delivery_address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovedRequests = async () => {
    try {
      console.log("Fetching approved requests...");
      const url = `http://localhost:8000/api/asset-requests/index.php?status=approved&user_role=${
        user?.role || "admin"
      }&user_id=${user?.id || ""}`;
      console.log("Request URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("Approved requests response:", data);

      if (data.success && Array.isArray(data.requests)) {
        setApprovedRequests(data.requests);
        if (data.requests.length === 0) {
          setError("No approved requests found");
        }
      } else {
        setError("Failed to fetch approved requests");
        console.error("API error:", data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError("Error fetching approved requests");
    }
  };

  const fetchSuppliers = async () => {
    try {
      console.log("Fetching suppliers...");
      const response = await fetch(
        "http://localhost:8000/api/suppliers/list.php"
      );
      const data = await response.json();

      console.log("Suppliers response:", data);

      if (data.success && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
        if (data.suppliers.length === 0) {
          setError((prev) =>
            prev ? prev + "; No suppliers found" : "No suppliers found"
          );
        }
      } else {
        setError((prev) =>
          prev
            ? prev + "; Failed to fetch suppliers"
            : "Failed to fetch suppliers"
        );
        console.error("Suppliers API error:", data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError((prev) =>
        prev ? prev + "; Error fetching suppliers" : "Error fetching suppliers"
      );
    }
  };

  useEffect(() => {
    const initData = async () => {
      console.log("Current user:", user);
      if (user?.id) {
        console.log("User found, fetching data...");
        await Promise.all([fetchApprovedRequests(), fetchSuppliers()]);
        console.log("Data fetch complete");
      } else {
        console.log("No user ID, setting loading to false");
      }
      setLoading(false);
    };
    initData();
  }, [user]);

  // Log state changes for debugging
  useEffect(() => {
    console.log(
      "State update - Loading:",
      loading,
      "Requests:",
      approvedRequests.length,
      "Suppliers:",
      suppliers.length,
      "Error:",
      error
    );
  }, [loading, approvedRequests, suppliers, error]);

  const handleGeneratePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRequest) {
      alert("Please select an approved request");
      return;
    }

    if (!selectedSupplier) {
      alert("Please select a supplier");
      return;
    }

    try {
      setSubmitting(true);

      const request = approvedRequests.find((r) => r.id === selectedRequest);
      const supplier = suppliers.find((s) => s.id === selectedSupplier);

      if (!request || !supplier) {
        alert("Invalid selection");
        return;
      }

      console.log("Creating PO with:", {
        request_id: selectedRequest,
        supplier_name: supplier.name,
        created_by: user?.id,
        created_by_name: user?.name,
      });

      const poData = {
        request_id: selectedRequest,
        supplier_name: supplier.name,
        supplier_email: supplier.email || "",
        created_by: user?.id,
        created_by_name: user?.name,
        expected_delivery_date: formData.expected_delivery_date,
        payment_terms: formData.payment_terms,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        total_amount: parseFloat(request.estimated_cost?.toString() || "0"),
        items: [
          {
            asset_name: request.asset_name,
            asset_category: request.asset_category,
            quantity: 1,
            unit_price: parseFloat(request.estimated_cost?.toString() || "0"),
            uom: "Unit",
          },
        ],
      };

      console.log("PO Data:", poData);

      const response = await fetch(
        "http://localhost:8000/api/purchase-orders/index.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(poData),
        }
      );

      const data = await response.json();
      console.log("PO Response:", data);

      if (data.success) {
        alert(`P.O. generated successfully: ${data.po_number}`);
        router.push(`/purchase-orders/${data.po_id}`);
      } else {
        alert("Error: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error generating PO:", error);
      alert("Failed to generate P.O.: " + error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">
            Loading approved requests and suppliers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href="/purchase-orders"
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 mb-4"
            >
              <i className="ri-arrow-left-line"></i>
              <span>Back to Purchase Orders</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Generate Purchase Order
            </h1>
            <p className="text-gray-600 mt-2">
              Create a new P.O. from an approved asset request
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <p className="font-medium">⚠️ {error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {approvedRequests.length === 0 || suppliers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-alert-line text-yellow-600 text-3xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {approvedRequests.length === 0
                    ? "No approved requests"
                    : "No suppliers available"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {approvedRequests.length === 0
                    ? "There are no approved asset requests available. Approved requests: " +
                      approvedRequests.length +
                      " | Suppliers: " +
                      suppliers.length
                    : "There are no suppliers available. Approved requests: " +
                      approvedRequests.length +
                      " | Suppliers: " +
                      suppliers.length}
                </p>
                <Link
                  href="/purchase-orders"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Back
                </Link>
              </div>
            ) : (
              <form onSubmit={handleGeneratePO} className="space-y-6">
                {/* Select Request */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Approved Request *
                  </label>
                  <select
                    value={selectedRequest}
                    onChange={(e) => setSelectedRequest(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a request...</option>
                    {approvedRequests.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.asset_name} (KES{" "}
                        {req.estimated_cost?.toLocaleString()}) -{" "}
                        {req.requester_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Request Details Preview */}
                {selectedRequest && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {approvedRequests
                      .filter((r) => r.id === selectedRequest)
                      .map((req) => (
                        <div key={req.id}>
                          <h4 className="font-medium text-gray-900 mb-3">
                            {req.asset_name}
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Requested by</p>
                              <p className="font-medium text-gray-900">
                                {req.requester_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Department</p>
                              <p className="font-medium text-gray-900">
                                {req.requester_department || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Estimated Cost</p>
                              <p className="font-medium text-gray-900">
                                KES {req.estimated_cost?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Category</p>
                              <p className="font-medium text-gray-900">
                                {req.asset_category}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Select Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Supplier *
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a supplier...</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expected Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expected_delivery_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_terms: e.target.value,
                      })
                    }
                    placeholder="e.g., 30 days Net"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    value={formData.delivery_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delivery_address: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Enter delivery address..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Any special instructions or notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={
                      submitting || !selectedRequest || !selectedSupplier
                    }
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-file-text-line"></i>
                        <span>Generate P.O.</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/purchase-orders"
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition flex items-center justify-center space-x-2"
                  >
                    <i className="ri-close-line"></i>
                    <span>Cancel</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
