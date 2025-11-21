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

interface POItem {
  asset_name: string;
  asset_category: string;
  quantity: number;
  unit_price: number;
  uom: string;
  request_id?: string;
}

export default function GeneratePOPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [approvedRequests, setApprovedRequests] = useState<AssetRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [formData, setFormData] = useState({
    expected_delivery_date: "",
    payment_terms: "30 days Net",
    delivery_address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [newItem, setNewItem] = useState<POItem>({
    asset_name: "",
    asset_category: "",
    quantity: 1,
    unit_price: 0,
    uom: "Unit",
    request_id: "",
  });

  // Initialize user on component mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    console.log("User initialized:", currentUser);
  }, []);

  const fetchApprovedRequests = async (userData: any) => {
    try {
      console.log("Fetching approved requests...");
      const url = `http://localhost:8000/api/asset-requests/index.php?status=approved&user_role=${
        userData?.role || "admin"
      }&user_id=${userData?.id || ""}`;
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
        await Promise.all([fetchApprovedRequests(user), fetchSuppliers()]);
        console.log("Data fetch complete");
      } else {
        console.log("No user ID, setting loading to false");
      }
      setLoading(false);
    };
    initData();
  }, [user]);

  const handleAddItemFromRequest = (requestId: string) => {
    const request = approvedRequests.find((r) => r.id === requestId);
    if (!request) return;

    const item: POItem = {
      asset_name: request.asset_name,
      asset_category: request.asset_category,
      quantity: 1,
      unit_price: parseFloat(request.estimated_cost?.toString() || "0"),
      uom: "Unit",
      request_id: requestId,
    };

    setPoItems([...poItems, item]);
    setNewItem({
      asset_name: "",
      asset_category: "",
      quantity: 1,
      unit_price: 0,
      uom: "Unit",
      request_id: "",
    });
  };

  const handleAddCustomItem = () => {
    if (
      !newItem.asset_name ||
      newItem.quantity <= 0 ||
      newItem.unit_price <= 0
    ) {
      alert("Please fill all item fields correctly");
      return;
    }

    setPoItems([...poItems, { ...newItem }]);
    setNewItem({
      asset_name: "",
      asset_category: "",
      quantity: 1,
      unit_price: 0,
      uom: "Unit",
      request_id: "",
    });
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const calculateLineTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateTotalAmount = () => {
    return poItems.reduce(
      (sum, item) => sum + calculateLineTotal(item.quantity, item.unit_price),
      0
    );
  };

  const handleGeneratePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      alert("Please select a supplier");
      return;
    }

    if (poItems.length === 0) {
      alert("Please add at least one item to the purchase order");
      return;
    }

    try {
      setSubmitting(true);

      const supplier = suppliers.find((s) => s.id === selectedSupplier);

      if (!supplier) {
        alert("Invalid supplier selection");
        return;
      }

      const poData = {
        supplier_name: supplier.name,
        supplier_email: supplier.email || "",
        created_by: user?.id,
        created_by_name: user?.name,
        expected_delivery_date: formData.expected_delivery_date,
        payment_terms: formData.payment_terms,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        total_amount: calculateTotalAmount(),
        items: poItems.map((item) => ({
          asset_name: item.asset_name,
          asset_category: item.asset_category,
          quantity: item.quantity,
          unit_price: item.unit_price,
          uom: item.uom,
          request_id: item.request_id,
        })),
      };

      console.log("PO Data being sent:", poData);

      const response = await fetch(
        "http://localhost:8000/api/purchase-orders/index.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(poData),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("PO Response:", data);

      if (data.success) {
        const poId = data.po_id;
        console.log("P.O. generated successfully with ID:", poId);
        alert(
          `P.O. generated successfully: ${
            data.po_number
          }\nTotal Amount: KES ${calculateTotalAmount().toLocaleString()}`
        );

        window.location.href = `/purchase-orders/${poId}`;
      } else {
        const errorMsg = "Error: " + (data.message || "Unknown error");
        console.error("PO generation failed:", data);
        alert(errorMsg);
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
        <div className="max-w-4xl mx-auto">
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
              Create a new P.O. with multiple items for a supplier
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <p className="font-medium">⚠️ {error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">
                  Loading approved requests and suppliers...
                </div>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-alert-line text-yellow-600 text-3xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No suppliers available
                </h3>
                <p className="text-gray-500 mb-6">
                  There are no suppliers available to create a purchase order.
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
              <form onSubmit={handleGeneratePO} className="space-y-8">
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

                {/* PO Items Section */}
                <div className="border-t pt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Purchase Order Items
                  </h2>

                  {/* Add Items from Approved Requests */}
                  {approvedRequests.length > 0 && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-4">
                        Add Items from Approved Requests
                      </h3>
                      <div className="space-y-2">
                        {approvedRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {req.asset_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                KES {req.estimated_cost?.toLocaleString()} •{" "}
                                {req.requester_name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddItemFromRequest(req.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <i className="ri-add-line mr-1"></i>Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Item */}
                  <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Add Custom Item
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Asset Name
                        </label>
                        <input
                          type="text"
                          value={newItem.asset_name}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              asset_name: e.target.value,
                            })
                          }
                          placeholder="Enter asset name..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <input
                          type="text"
                          value={newItem.asset_category}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              asset_category: e.target.value,
                            })
                          }
                          placeholder="e.g., Equipment"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit of Measure
                        </label>
                        <select
                          value={newItem.uom}
                          onChange={(e) =>
                            setNewItem({ ...newItem, uom: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Unit</option>
                          <option>Box</option>
                          <option>Carton</option>
                          <option>Meter</option>
                          <option>Kilogram</option>
                          <option>Liter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price (KES)
                        </label>
                        <input
                          type="number"
                          value={newItem.unit_price}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              unit_price: parseFloat(e.target.value) || 0,
                            })
                          }
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddCustomItem}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                        >
                          <i className="ri-add-line"></i>
                          <span>Add Item</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  {poItems.length > 0 && (
                    <div className="mb-8 overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                              Asset Name
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                              Category
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                              UOM
                            </th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                              Line Total
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {poItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.asset_name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.asset_category}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900 font-medium">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.uom}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">
                                KES {item.unit_price.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                KES{" "}
                                {calculateLineTotal(
                                  item.quantity,
                                  item.unit_price
                                ).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <i className="ri-delete-line"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan={5} className="px-4 py-3 text-right">
                              Total Amount:
                            </td>
                            <td className="px-4 py-3 text-right text-lg text-blue-600">
                              KES {calculateTotalAmount().toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* PO Details */}
                <div className="border-t pt-8 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Purchase Order Details
                  </h2>

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
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={
                      submitting || !selectedSupplier || poItems.length === 0
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
