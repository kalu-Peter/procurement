"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

interface Stats {
  totalAssets: number;
  activeRequests: number;
  pendingApprovals: number;
}

export default function DepartmentDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0,
    activeRequests: 0,
    pendingApprovals: 0,
  });

  const fetchStats = async () => {
    try {
      // Debug: Log user info
      console.log("Department dashboard user:", user);

      // Fetch asset requests statistics
      const assetRequestsRes = await fetch(
        `http://localhost:8000/api/asset-requests/index.php?user_role=${user?.role}&department=${user?.department}`
      );
      const assetRequestsData = await assetRequestsRes.json();
      console.log("Asset requests data:", assetRequestsData);

      // Fetch transfer requests statistics
      const transfersRes = await fetch(
        `http://localhost:8000/api/transfer/index.php`
      );
      const transfersData = await transfersRes.json();
      console.log("Transfers data:", transfersData);

      // Fetch disposal requests statistics
      const disposalsRes = await fetch(
        `http://localhost:8000/api/disposals/index.php?type=requests&department=${user?.department}`
      );
      const disposalsData = await disposalsRes.json();
      console.log("Disposals data:", disposalsData);

      // Fetch department assets count
      const assetsRes = await fetch(
        `http://localhost:8000/api/assets/index.php?user_role=${user?.role}&user_department=${user?.department}&department=${user?.department}`
      );
      const assetsData = await assetsRes.json();
      console.log("Assets data:", assetsData);

      // Filter transfers and disposals by department
      const departmentTransfers = transfersData.success
        ? transfersData.transfers.filter(
            (transfer: any) =>
              transfer.from_department === user?.department ||
              transfer.to_department === user?.department
          )
        : [];

      const departmentDisposals = disposalsData.success
        ? disposalsData.disposals
        : [];

      // Calculate active requests (pending status)
      const pendingAssetRequests = assetRequestsData.stats?.pending || 0;
      const pendingTransfers = departmentTransfers.filter(
        (t: any) => t.status === "pending"
      ).length;
      const pendingDisposals = departmentDisposals.filter(
        (d: any) => d.status === "Pending"
      ).length;

      // Calculate pending approvals (same as active for department head view)
      const activeRequests =
        pendingAssetRequests + pendingTransfers + pendingDisposals;
      const pendingApprovals = activeRequests; // For department head, these are the same

      // Get total department assets
      const totalAssets = assetsData.success ? assetsData.assets.length : 0;

      setStats({
        totalAssets,
        activeRequests,
        pendingApprovals,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "department_head") {
      router.push("/");
      return;
    }

    fetchStats();
    setLoading(false);
  }, [router, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            Department Head Dashboard
          </h1>
          <div className="text-sm text-gray-600">
            Welcome back, {user?.name}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Department Assets</h3>
            <p className="text-3xl font-bold">{stats.totalAssets}</p>
            <p className="text-sm opacity-80">Total assets in department</p>
          </div>
          <div className="bg-green-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Active Requests</h3>
            <p className="text-3xl font-bold">{stats.activeRequests}</p>
            <p className="text-sm opacity-80">
              Pending asset, transfer & disposal requests
            </p>
          </div>
          <div className="bg-orange-500 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold">{stats.pendingApprovals}</p>
            <p className="text-sm opacity-80">Requests awaiting approval</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Asset Requests
            </h2>
            <div className="space-y-4">
              <Link
                href="/requests/new"
                className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center transition-colors"
              >
                New Asset Request
              </Link>
              <Link
                href="/requests"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                View My Requests
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Asset Management
            </h2>
            <div className="space-y-4">
              <Link
                href="/assets"
                className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center transition-colors"
              >
                View Department Assets
              </Link>
              <Link
                href="/transfers"
                className="block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-center transition-colors"
              >
                Asset Transfers
              </Link>
              <Link
                href="/disposals"
                className="block bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-center transition-colors"
              >
                Asset Disposals
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Reports & Analytics
            </h2>
            <div className="space-y-4">
              <Link
                href="/reports/department-assets"
                className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-center transition-colors"
              >
                Asset Reports
              </Link>
              <Link
                href="/reports/department-usage"
                className="block bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center transition-colors"
              >
                Usage Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
