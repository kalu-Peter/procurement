"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const test = async () => {
      try {
        console.log("Testing Approved Requests API...");
        const reqRes = await fetch(
          "http://localhost:8000/api/asset-requests/index.php?status=approved&user_role=admin"
        );
        const reqData = await reqRes.json();
        console.log("Requests Response:", reqData);
        setRequests(reqData.requests || []);

        console.log("Testing Suppliers API...");
        const supRes = await fetch(
          "http://localhost:8000/api/suppliers/list.php"
        );
        const supData = await supRes.json();
        console.log("Suppliers Response:", supData);
        setSuppliers(supData.suppliers || []);

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    test();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug</h1>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">
          Approved Requests: {requests.length}
        </h2>
        {requests.length > 0 && (
          <div className="bg-gray-100 p-4 rounded">
            {requests.map((req: any) => (
              <div key={req.id} className="mb-2">
                <strong>{req.asset_name}</strong> - KES {req.estimated_cost} (
                {req.requester_name})
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">
          Suppliers: {suppliers.length}
        </h2>
        {suppliers.length > 0 && (
          <div className="bg-gray-100 p-4 rounded">
            {suppliers.map((sup: any) => (
              <div key={sup.id} className="mb-2">
                <strong>{sup.name}</strong> - {sup.email}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
