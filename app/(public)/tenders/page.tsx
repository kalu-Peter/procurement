"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Tender {
  id: string;
  tender_number: string;
  title: string;
  description: string;
  category: string;
  status: string;
  deadline: string;
  published_at: string;
}

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/tenders/index.php");
      const data = await response.json();
      if (data.success) {
        setTenders(data.tenders);
      }
    } catch (error) {
      console.error("Error fetching tenders:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Open Tenders</h1>
              <p className="text-gray-600 mt-2">
                Browse and bid on open tenders
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p>Loading tenders...</p>
            </div>
          ) : tenders.length === 0 ? (
            <div className="text-center py-12">
              <p>No open tenders at the moment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Tender Number
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Deadline
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenders.map((tender) => (
                      <tr key={tender.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {tender.tender_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {tender.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {tender.category}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              tender.status === "open"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tender.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(tender.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/tenders/${tender.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <i className="ri-eye-line mr-1"></i>
                            View Details
                          </Link>
                          <Link
                            href={`/tenders/${tender.id}/submit`}
                            className="text-green-600 hover:text-green-800 text-sm font-medium ml-4"
                          >
                            <i className="ri-send-plane-line mr-1"></i>
                            Submit Bid
                          </Link>
                        </td>
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
