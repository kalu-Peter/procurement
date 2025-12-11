"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Link from "next/link";

interface Disposal {
  id: string;
  asset_id: string;
  asset_name?: string;
  asset_tag?: string;
  department?: string;
  reason?: string;
  method?: string;
  requested_by: string;
  requested_by_name?: string;
  status: string;
  request_date: string;
  approved_by?: string;
  approved_date?: string;
  source_type?: string;
}

export default function DisposalsPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState("requests");
  const [disposalRequests, setDisposalRequests] = useState<Disposal[]>([]);
  const [disposalRecords, setDisposalRecords] = useState<Disposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordFilter, setRecordFilter] = useState("all"); // all, approved, rejected
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState<Disposal | null>(
    null
  );

  useEffect(() => {
    fetchDisposals();
  }, [activeTab, recordFilter]);

  // Fetch both requests and records on mount to get accurate counts
  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch requests (only pending)
      const requestParams = new URLSearchParams();
      requestParams.append("type", "requests");
      if (user?.department && user?.role !== "admin" && user?.role !== "procurement_officer") {
        requestParams.append("department", user.department);
      }
      if(user) {
        requestParams.append("user_id", user.id);
      }

      const requestsResponse = await fetch(
        `http://localhost:8000/api/disposals/index.php?${requestParams}`
      );
      const requestsData = await requestsResponse.json();
      if (requestsData.success) {
        setDisposalRequests(requestsData.disposals);
      }

      // Fetch records (all approved and rejected)
      const recordParams = new URLSearchParams();
      recordParams.append("type", "records");
      if (user?.department && user?.role !== "admin" && user?.role !== "procurement_officer") {
        recordParams.append("department", user.department);
      }
      if(user) {
        recordParams.append("user_id", user.id);
      }

      const recordsResponse = await fetch(
        `http://localhost:8000/api/disposals/index.php?${recordParams}`
      );
      const recordsData = await recordsResponse.json();
      if (recordsData.success) {
        setDisposalRecords(recordsData.disposals);
      }

      setLoading(false);
    };

    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchDisposals = async () => {
    try {
      const params = new URLSearchParams();
      params.append("type", activeTab);

      if (user?.department && user?.role !== "admin" && user?.role !== "procurement_officer") {
        params.append("department", user.department);
      }
      if(user) {
        params.append("user_id", user.id);
      }

      // Add record status filter for records tab
      if (activeTab === "records" && recordFilter !== "all") {
        params.append("record_status", recordFilter);
      }

      const response = await fetch(
        `http://localhost:8000/api/disposals/index.php?${params}`
      );
      const data = await response.json();

      if (data.success) {
        if (activeTab === "requests") {
          setDisposalRequests(data.disposals);
        } else {
          setDisposalRecords(data.disposals);
        }
      } else {
        console.error("Failed to fetch disposals:", data.error);
      }
    } catch (error) {
      console.error("Error fetching disposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  const handleApproveDisposal = async (
    requestId: string,
    sourceType?: string
  ) => {
    try {
      // Find the request to get the correct asset_id
      const request = disposalRequests.find((r) => r.id === requestId);
      if (!request) {
        alert("Request not found");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/disposals/approve.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            asset_id: request.asset_id, // Use the actual asset_id, not request.id
            action: "approve",
            source_type: sourceType || "manual",
            disposal_request_id: sourceType === "manual" ? requestId : null,
            approved_by: user?.id,
            notes: null,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh both requests and records since approved/rejected items move between tabs
        const requestParams = new URLSearchParams();
        requestParams.append("type", "requests");
        if (user?.department && user?.role !== "admin" && user?.role !== "procurement_officer") {
          requestParams.append("department", user.department);
        }
        if(user) {
            requestParams.append("user_id", user.id);
        }

        const requestsResponse = await fetch(
          `http://localhost:8000/api/disposals/index.php?${requestParams}`
        );
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setDisposalRequests(requestsData.disposals);
        }

        const recordParams = new URLSearchParams();
        recordParams.append("type", "records");
        if (user?.department && user?.role !== "admin" && user?.role !== "procurement_officer") {
          recordParams.append("department", user.department);
        }
        if(user) {
            recordParams.append("user_id", user.id);
        }

        const recordsResponse = await fetch(
          `http://localhost:8000/api/disposals/index.php?${recordParams}`
        );
        const recordsData = await recordsResponse.json();
        if (recordsData.success) {
          setDisposalRecords(recordsData.disposals);
        }

        alert("Disposal approved successfully!");
      } else {
        alert("Failed to approve disposal: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error approving disposal:", error);
      alert("Failed to approve disposal. Please try again.");
    }
  };

  const handleViewDetails = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    setShowDetailsModal(true);
  };

  const generatePDF = async () => {
    try {
      // Dynamic import for client-side only
      const jsPDF = (await import("jspdf")).default;
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Add logo
      const logoResponse = await fetch("/logo.png");
      const logoData = await logoResponse.blob();
      const reader = new FileReader();
      reader.readAsDataURL(logoData);
      reader.onloadend = () => {
        const base64data = reader.result;
        doc.addImage(base64data, "PNG", 14, 15, 30, 30);

        // Add header
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(20);
        doc.text("TUM Procurement System", pageWidth / 2, 22, {
          align: "center",
        });
        doc.setFontSize(16);
        doc.text("Asset Disposals Report", pageWidth / 2, 32, {
          align: "center",
        });

        // Add generation date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 42, {
          align: "left",
        });
        doc.text(`Generated by: ${user?.name || "Unknown User"}`, 14, 48, {
          align: "left",
        });

        // Add filters info if any are applied
        let yPosition = 58;
        doc.setFontSize(12);
        doc.text(
          `Report Type: ${
            activeTab === "requests" ? "Disposal Requests" : "Disposal Records"
          }`,
          14,
          yPosition
        );
        yPosition += 8;

        if (activeTab === "records" && recordFilter !== "all") {
          doc.setFontSize(10);
          doc.text(`Filter: ${recordFilter} only`, 14, yPosition);
          yPosition += 6;
        }
        yPosition += 5;

        // Get current data based on active tab
        const currentData =
          activeTab === "requests" ? disposalRequests : disposalRecords;

        // Prepare table data
        const tableData = currentData.map((disposal) => [
          disposal.asset_name || "Unknown Asset",
          disposal.asset_tag || "N/A",
          disposal.department || "N/A",
          disposal.method || "N/A",
          disposal.status,
          new Date(disposal.request_date).toLocaleDateString(),
          disposal.source_type === "automatic"
            ? "System"
            : disposal.requested_by_name || "Unknown",
        ]);

        // Add table
        (doc as any).autoTable({
          head: [
            [
              "Asset Name",
              "Asset Tag",
              "Department",
              "Method",
              "Status",
              "Request Date",
              "Requested By",
            ],
          ],
          body: tableData,
          startY: yPosition,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [220, 53, 69],
            textColor: 255,
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Asset Name
            1: { cellWidth: 25 }, // Asset Tag
            2: { cellWidth: 25 }, // Department
            3: { cellWidth: 20 }, // Method
            4: { cellWidth: 20 }, // Status
            5: { cellWidth: 25 }, // Request Date
            6: { cellWidth: 30 }, // Requested By
          },
          margin: { top: yPosition, right: 14, bottom: 20, left: 14 },
          didDrawPage: function (data: any) {
            // Footer
            const str = `Page ${data.pageNumber}`;
            doc.setFontSize(10);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height
              ? pageSize.height
              : pageSize.getHeight();
            doc.text(str, data.settings.margin.left, pageHeight - 10);

            // Total count
            if (data.pageNumber === 1) {
              doc.text(
                `Total ${activeTab === "requests" ? "Requests" : "Records"}: ${
                  currentData.length
                }`,
                pageSize.width - 60,
                pageHeight - 10
              );
            }
          },
        });

        // Save the PDF
        const fileName = `TUM_Disposals_${activeTab}_Report_${
          new Date().toISOString().split("T")[0]
        }.pdf`;
        doc.save(fileName);
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleRejectDisposal = async (
    requestId: string,
    sourceType?: string
  ) => {
    try {
      // Find the request to get the correct asset_id
      const request = disposalRequests.find((r) => r.id === requestId);
      if (!request) {
        alert("Request not found");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/disposals/approve.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            asset_id: request.asset_id, // Use the actual asset_id, not request.id
            action: "reject",
            source_type: sourceType || "manual",
            disposal_request_id: sourceType === "manual" ? requestId : null,
            approved_by: user?.id,
            notes: null,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh both requests and records since rejected items move to records
        const requestParams = new URLSearchParams();
        requestParams.append("type", "requests");
        if (user?.department && user?.role !== "admin" && user?.role !== "procurement_officer") {
          requestParams.append("department", user.department);
        }
        if(user) {
            requestParams.append("user_id", user.id);
        }

        const requestsResponse = await fetch(
          `http://localhost:8000/api/disposals/index.php?${requestParams}`
        );
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setDisposalRequests(requestsData.disposals);
        }

        const recordParams = new URLSearchParams();
        recordParams.append("type", "records");
        if (user?.department && user?.role !== "admin" && user?.role !== "procurement_officer") {
          recordParams.append("department", user.department);
        }
        if(user) {
            recordParams.append("user_id", user.id);
        }

        const recordsResponse = await fetch(
          `http://localhost:8000/api/disposals/index.php?${recordParams}`
        );
        const recordsData = await recordsResponse.json();
        if (recordsData.success) {
          setDisposalRecords(recordsData.disposals);
        }

        alert("Disposal rejected successfully!");
      } else {
        alert("Failed to reject disposal: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error rejecting disposal:", error);
      alert("Failed to reject disposal. Please try again.");
    }
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Asset Disposals
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.role === "admin" || user?.role === "procurement_officer"
                  ? "Manage disposal requests and records for all departments"
                  : `Manage disposal requests and records for ${
                      user?.department
                        ? `${user.department} department`
                        : "your department"
                    }`}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={generatePDF}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-file-pdf-line"></i>
                </div>
                <span>Export PDF</span>
              </button>
              <Link
                href="/disposals/new"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-delete-bin-line"></i>
                </div>
                <span>New Disposal</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("requests")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                    activeTab === "requests"
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Disposal Requests ({disposalRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab("records")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                    activeTab === "records"
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Disposal Records ({disposalRecords.length})
                </button>
              </nav>
            </div>

            {activeTab === "records" && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setRecordFilter("all")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                      recordFilter === "all"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    All Records
                  </button>
                  <button
                    onClick={() => setRecordFilter("approved")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                      recordFilter === "approved"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    Approved Only
                  </button>
                  <button
                    onClick={() => setRecordFilter("rejected")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                      recordFilter === "rejected"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    Rejected Only
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              {activeTab === "requests" && (
                <div className="space-y-4">
                  {disposalRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                        <i className="ri-delete-bin-line text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Disposal Requests
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {user?.role === "admin" || user?.role === "procurement_officer"
                          ? "There are no pending disposal requests from any department at the moment."
                          : `There are no pending disposal requests for ${
                              user?.department
                                ? `${user.department} department`
                                : "your department"
                            } at the moment.`}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                              Asset Name
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                              Request Date
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                              Status
                            </th>
                            <th className="text-right py-3 px-2 font-medium text-gray-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {disposalRequests.map((request) => (
                            <tr
                              key={request.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-4 px-2">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {request.asset_name || "Unknown Asset"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {request.asset_tag || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {request.department || "N/A"}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <p className="text-sm text-gray-900">
                                  {new Date(
                                    request.request_date
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {request.source_type === "automatic"
                                    ? "System Generated"
                                    : `By: ${
                                        request.requested_by_name || "Unknown"
                                      }`}
                                </p>
                              </td>
                              <td className="py-4 px-2">
                                <div className="flex flex-col space-y-1">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full w-fit ${
                                      request.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : request.status === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {request.status}
                                  </span>
                                  {request.source_type === "automatic" && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 w-fit">
                                      Auto
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleViewDetails(request)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition duration-200 text-xs"
                                    title="View Details"
                                  >
                                    <i className="ri-eye-line"></i>
                                  </button>
                                  {request.status === "Pending" &&
                                    user?.role === "admin" || user?.role === "procurement_officer" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleApproveDisposal(
                                              request.id,
                                              request.source_type
                                            )
                                          }
                                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition duration-200 text-xs"
                                          title="Approve"
                                        >
                                          <i className="ri-check-line"></i>
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRejectDisposal(
                                              request.id,
                                              request.source_type
                                            )
                                          }
                                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-200 text-xs"
                                          title="Reject"
                                        >
                                          <i className="ri-close-line"></i>
                                        </button>
                                      </>
                                    )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "records" && (
                <div className="space-y-4">
                  {disposalRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                        <i className="ri-file-list-line text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Disposal Records
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {recordFilter === "all"
                          ? user?.role === "admin" || user?.role === "procurement_officer"
                            ? "No assets from any department have been processed yet."
                            : `No assets from ${
                                user?.department
                                  ? `${user.department} department`
                                  : "your department"
                              } have been processed yet.`
                          : recordFilter === "approved"
                          ? user?.role === "admin" || user?.role === "procurement_officer"
                            ? "No approved disposal requests from any department yet."
                            : `No approved disposal requests from ${
                                user?.department
                                  ? `${user.department} department`
                                  : "your department"
                              } yet.`
                          : user?.role === "admin" || user?.role === "procurement_officer"
                          ? "No rejected disposal requests from any department yet."
                          : `No rejected disposal requests from ${
                              user?.department
                                ? `${user.department} department`
                                : "your department"
                            } yet.`}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                              Asset Name
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                              Process Date
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                              Status
                            </th>
                            <th className="text-right py-3 px-2 font-medium text-gray-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {disposalRecords.map((record) => (
                            <tr
                              key={record.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-4 px-2">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {record.asset_name || "Unknown Asset"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {record.asset_tag || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {record.department || "N/A"}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <p className="text-sm text-gray-900">
                                  {new Date(
                                    record.approved_date || record.request_date
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {record.source_type === "automatic"
                                    ? "System Generated"
                                    : `By: ${
                                        record.requested_by_name || "Unknown"
                                      }`}
                                </p>
                              </td>
                              <td className="py-4 px-2">
                                <div className="flex flex-col space-y-1">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full w-fit ${
                                      record.status === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : record.status === "Rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {record.status === "Approved"
                                      ? "Disposed"
                                      : record.status}
                                  </span>
                                  {record.source_type === "automatic" && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 w-fit">
                                      Auto
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleViewDetails(record)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition duration-200 text-xs"
                                    title="View Details"
                                  >
                                    <i className="ri-eye-line"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Disposal Details Modal */}
      {showDetailsModal && selectedDisposal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                Disposal Details
              </h3>
              <button
                className="text-black close-button text-3xl leading-none font-semibold outline-none focus:outline-none"
                onClick={() => setShowDetailsModal(false)}
              >
                <span className="bg-transparent text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Tag
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedDisposal.asset_tag || "TUM/ENG/EQUIP/004-25"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Name
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedDisposal.asset_name || "Unknown Asset"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedDisposal.department || "Engineering"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        selectedDisposal.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedDisposal.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedDisposal.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Disposal Method
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedDisposal.method || "Recycling"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Request Date
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(
                        selectedDisposal.request_date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requested By
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedDisposal.source_type === "automatic"
                        ? "System Generated"
                        : selectedDisposal.requested_by_name || "Unknown"}
                    </p>
                  </div>

                  {selectedDisposal.approved_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Processed
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {new Date(
                          selectedDisposal.approved_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposal Reason
                </label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-900">
                    {selectedDisposal.reason ||
                      "Equipment beyond repair - multiple hardware failures"}
                  </p>
                </div>
              </div>

              {selectedDisposal.source_type === "automatic" && (
                <div className="mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <i className="ri-information-line text-blue-400 text-lg"></i>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Auto-Generated Request
                        </h3>
                        <p className="mt-1 text-sm text-blue-700">
                          This disposal request was automatically generated when
                          the asset condition was changed to obsolete.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
