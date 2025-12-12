"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

interface Bid {
  id: string;
  tender_title: string;
  supplier_name: string;
  bid_amount: number;
  notes: string;
  submitted_at: string;
}

export default function SubmittedBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/bids/index.php");
      const data = await response.json();
      if (data.success) {
        setBids(data.bids);
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Submitted Bids
          </h1>
          {loading ? (
            <p>Loading bids...</p>
          ) : bids.length === 0 ? (
            <p>No bids submitted yet.</p>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Tender Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Supplier Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Bid Amount (KES)
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Submitted At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bids.map((bid) => (
                      <tr key={bid.id}>
                        <td className="px-6 py-4">{bid.tender_title}</td>
                        <td className="px-6 py-4">{bid.supplier_name}</td>
                        <td className="px-6 py-4">
                          {bid.bid_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(bid.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">{bid.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
