"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

export default function SubmitBidPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [bidAmount, setBidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!user || user.role !== "supplier") {
      setError("You must be logged in as a supplier to submit a bid.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/tenders/submit_bid.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tender_id: params.id,
          supplier_id: user.id,
          bid_amount: bidAmount,
          notes: notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/tenders/${params.id}`);
      } else {
        setError(data.error || "Failed to submit bid.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "supplier") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={() => {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
      }} />
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Submit Bid for Tender
            </h1>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
                  Bid Amount (KES)
                </label>
                <input
                  id="bidAmount"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
