"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  documents: any[];
}

export default function TenderDetailsPage() {
  const params = useParams();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchTenderDetails(params.id as string);
    }
  }, [params.id]);

  const fetchTenderDetails = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/tenders/show.php?id=${id}`
      );
      const data = await response.json();
      if (data.success) {
        setTender(data.tender);
      }
    } catch (error) {
      console.error("Error fetching tender details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading tender details...</p>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Tender not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {tender.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Tender No: {tender.tender_number}
                </p>
              </div>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  tender.status === "open"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {tender.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-sm text-gray-600">
              <div>
                <strong>Category:</strong> {tender.category}
              </div>
              <div>
                <strong>Published:</strong>{" "}
                {new Date(tender.published_at).toLocaleDateString()}
              </div>
              <div>
                <strong>Deadline:</strong>{" "}
                {new Date(tender.deadline).toLocaleString()}
              </div>
            </div>
            <div className="prose max-w-none">
              <p>{tender.description}</p>
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Tender Documents
              </h2>
              {tender.documents.length > 0 ? (
                <ul className="space-y-3">
                  {tender.documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={`http://localhost:8000/${doc.document_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {doc.document_name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No documents available for this tender.</p>
              )}
            </div>
            {tender.status === "open" && (
              <div className="mt-8 pt-6 border-t border-gray-200 text-right">
                <Link
                  href={`/tenders/${tender.id}/submit`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Submit Bid
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
