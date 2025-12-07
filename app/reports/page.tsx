"use client";
import React, { useState } from "react";

const ReportsPage = () => {
  const [reportType, setReportType] = useState("");
  const [period, setPeriod] = useState("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!reportType || !period) {
      alert("Please select a report type and period.");
      return;
    }
    setLoading(true);
    setError(null);
    setReportData([]);

    try {
      const response = await fetch(
        `http://localhost:8000/api/reports/?reportType=${reportType}&period=${period}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch report data.");
      }
      const data = await response.json();

      if (!Array.isArray(data.data)) {
        throw new Error("Invalid response format from server.");
      }

      setReportData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTable = () => {
    if (reportData.length === 0) {
      return <p>No data to display.</p>;
    }

    if (
      !Array.isArray(reportData) ||
      reportData.length === 0 ||
      !reportData[0]
    ) {
      return <p>No data to display.</p>;
    }

    const headers = Object.keys(reportData[0] || {});

    return (
      <div id="report-content">
        <h2 className="text-xl font-bold mb-2 capitalize">{`${period} ${reportType.replace(
          /-/g,
          " "
        )} Report`}</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className="py-2 px-4 border-b capitalize">
                  {header.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td key={header} className="py-2 px-4 border-b text-center">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold mb-4">Reports</h1>
        <div className="flex space-x-4 mb-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Select Report Type</option>

            {/* Existing */}
            <option value="purchase-order">Purchase Order</option>
            <option value="assets-disposal">Assets Disposal</option>
            <option value="transfer">Transfer</option>
            <option value="suppliers-performance">Suppliers Performance</option>

            {/* Requests */}
            <option value="requests">All Requests</option>
            <option value="pending-requests">Pending Requests</option>
            <option value="approved-requests">Approved Requests</option>
            <option value="rejected-requests">Rejected Requests</option>
            <option value="fulfilled-requests">Fulfilled Requests</option>
          </select>

          {reportType && (
            <>
              {/* YEAR SELECTOR */}
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="">Select Period</option>

                {/* Yearly */}
                <optgroup label="Yearly">
                  <option value="year:2023">2023</option>
                  <option value="year:2024">2024</option>
                  <option value="year:2025">2025</option>
                </optgroup>

                {/* Monthly */}
                <optgroup label="Monthly">
                  <option value="month:01">January</option>
                  <option value="month:02">February</option>
                  <option value="month:03">March</option>
                  <option value="month:04">April</option>
                  <option value="month:05">May</option>
                  <option value="month:06">June</option>
                  <option value="month:07">July</option>
                  <option value="month:08">August</option>
                  <option value="month:09">September</option>
                  <option value="month:10">October</option>
                  <option value="month:11">November</option>
                  <option value="month:12">December</option>
                </optgroup>

                {/* Quarterly */}
                <optgroup label="Quarterly">
                  <option value="quarter:1">Q1 (Jan–Mar)</option>
                  <option value="quarter:2">Q2 (Apr–Jun)</option>
                  <option value="quarter:3">Q3 (Jul–Sep)</option>
                  <option value="quarter:4">Q4 (Oct–Dec)</option>
                </optgroup>
              </select>
            </>
          )}

          <button
            onClick={handleGenerateReport}
            className="bg-blue-500 text-white p-2 rounded"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
          <button
            onClick={handlePrint}
            className="bg-gray-500 text-white p-2 rounded"
            disabled={reportData.length === 0}
          >
            Print Report
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && reportData && renderTable()}
    </div>
  );
};

export default ReportsPage;
