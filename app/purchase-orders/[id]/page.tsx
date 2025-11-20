"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  supplier_email: string;
  total_amount: number;
  status: string;
  po_date: string;
  expected_delivery_date: string;
  payment_terms: string;
  delivery_address: string;
  notes: string;
  items: any[];
}

interface GoodsReceipt {
  id: string;
  gr_number: string;
  status: string;
  receipt_date: string;
  total_received_amount: number;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const poId = params.id as string;
  const [user, setUser] = useState(getCurrentUser());
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGRModal, setShowGRModal] = useState(false);
  const [grItems, setGrItems] = useState<any[]>([]);

  useEffect(() => {
    if (poId) {
      fetchPurchaseOrder();
      fetchGoodsReceipts();
    }
  }, [poId]);

  const fetchPurchaseOrder = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/purchase-orders/index.php?id=${poId}`
      );
      const data = await response.json();

      if (data.success && data.pos.length > 0) {
        setPo(data.pos[0]);
        // Initialize GR items from PO items
        if (data.pos[0].items) {
          setGrItems(
            data.pos[0].items.map((item: any) => ({
              po_item_id: item.id,
              asset_name: item.asset_name,
              quantity_ordered: item.quantity,
              quantity_received: 0,
              unit_price: item.unit_price,
              inspection_status: "pass",
              condition_notes: "",
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching PO:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoodsReceipts = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/goods-receipts/index.php?po_id=${poId}`
      );
      const data = await response.json();

      if (data.success) {
        setGoodsReceipts(data.goods_receipts);
      }
    } catch (error) {
      console.error("Error fetching GRs:", error);
    }
  };

  const handleDispatchPO = async () => {
    try {
      // Update PO status to sent
      const response = await fetch(
        "http://localhost:8000/api/purchase-orders/index.php",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: poId,
            status: "sent",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Here you would add email dispatch logic
        alert("P.O. dispatched successfully to " + po?.supplier_email);
        fetchPurchaseOrder();
      }
    } catch (error) {
      console.error("Error dispatching PO:", error);
    }
  };

  const handleCreateGoodsReceipt = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/goods-receipts/index.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            po_id: poId,
            received_by: user?.id,
            received_by_name: user?.name,
            items: grItems,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Goods receipt created successfully");
        setShowGRModal(false);
        fetchGoodsReceipts();
        fetchPurchaseOrder();
      }
    } catch (error) {
      console.error("Error creating GR:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      generated: "bg-blue-100 text-blue-800",
      sent: "bg-purple-100 text-purple-800",
      acknowledged: "bg-indigo-100 text-indigo-800",
      partial: "bg-yellow-100 text-yellow-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
          statusConfig[status] || statusConfig.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
          <div className="text-gray-500">Loading purchase order details...</div>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-red-500">Purchase Order not found</div>
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
                  {po.po_number}
                </h1>
                {getStatusBadge(po.status)}
              </div>
              <p className="text-gray-600">Supplier: {po.supplier_name}</p>
            </div>
            <div className="flex gap-2">
              {po.status === "draft" && (
                <button
                  onClick={handleDispatchPO}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <i className="ri-send-plane-line"></i>
                  <span>Dispatch P.O.</span>
                </button>
              )}
              {po.status !== "cancelled" && (
                <button
                  onClick={() => setShowGRModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                >
                  <i className="ri-inbox-line"></i>
                  <span>Receive Goods</span>
                </button>
              )}
              <Link
                href="/purchase-orders"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center space-x-2"
              >
                <i className="ri-arrow-left-line"></i>
                <span>Back</span>
              </Link>
            </div>
          </div>

          {/* P.O. Details */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Supplier Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">
                    {po.supplier_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {po.supplier_email || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Order Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(po.po_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Delivery</p>
                  <p className="font-medium text-gray-900">
                    {po.expected_delivery_date
                      ? new Date(po.expected_delivery_date).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Payment Terms
              </h3>
              <p className="font-medium text-gray-900">
                {po.payment_terms || "Not specified"}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Total Amount
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                KES {po.total_amount?.toLocaleString() || "0"}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Line Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Asset
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {po.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.asset_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        KES {item.unit_price?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        KES {item.line_total?.toLocaleString() || "0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Goods Receipts Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Goods Receipts (Three-Way Match)
            </h3>
            {goodsReceipts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No goods receipts recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {goodsReceipts.map((gr: any) => (
                  <div
                    key={gr.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {gr.gr_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        Received:{" "}
                        {new Date(gr.receipt_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          gr.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : gr.status === "partial"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {gr.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        KES {gr.total_received_amount?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Goods Receipt Modal */}
        {showGRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Record Goods Receipt
              </h2>

              <div className="space-y-6 mb-6">
                {grItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 mb-4">
                      {item.asset_name}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity Ordered
                        </label>
                        <input
                          type="number"
                          value={item.quantity_ordered}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity Received
                        </label>
                        <input
                          type="number"
                          value={item.quantity_received}
                          onChange={(e) => {
                            const newItems = [...grItems];
                            newItems[index].quantity_received =
                              parseInt(e.target.value) || 0;
                            setGrItems(newItems);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Inspection Status
                        </label>
                        <select
                          value={item.inspection_status}
                          onChange={(e) => {
                            const newItems = [...grItems];
                            newItems[index].inspection_status = e.target.value;
                            setGrItems(newItems);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="conditional">Conditional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition Notes
                        </label>
                        <input
                          type="text"
                          placeholder="Any issues or notes..."
                          value={item.condition_notes}
                          onChange={(e) => {
                            const newItems = [...grItems];
                            newItems[index].condition_notes = e.target.value;
                            setGrItems(newItems);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCreateGoodsReceipt}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Create Goods Receipt
                </button>
                <button
                  onClick={() => setShowGRModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
