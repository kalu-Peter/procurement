"use client";
import React, { useState } from 'react';

const ReportsPage = () => {
    const [reportType, setReportType] = useState('');
    const [period, setPeriod] = useState('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateReport = async () => {
        if (!reportType || !period) {
            alert('Please select a report type and period.');
            return;
        }
        setLoading(true);
        setError(null);
        setReportData([]);

        try {
            const response = await fetch(`http://localhost:8000/api/reports/?reportType=${reportType}&period=${period}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch report data.');
            }
            const data = await response.json();
            setReportData(data);
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

        const headers = Object.keys(reportData[0]);

        return (
            <div id="report-content">
                <h2 className="text-xl font-bold mb-2 capitalize">{`${period} ${reportType.replace(/-/g, ' ')} Report`}</h2>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="py-2 px-4 border-b capitalize">{header.replace(/_/g, ' ')}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, index) => (
                            <tr key={index}>
                                {headers.map((header) => (
                                    <td key={header} className="py-2 px-4 border-b text-center">{row[header]}</td>
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
                        <option value="purchase-order">Purchase Order</option>
                        <option value="assets-disposal">Assets Disposal</option>
                        <option value="transfer">Transfer</option>
                        <option value="suppliers-performance">Suppliers Performance</option>
                        <option value="requests">Requests</option>
                        <option value="pending-requests">Pending Requests</option>
                        <option value="approved-requests">Approved Requests</option>
                        <option value="rejected-requests">Rejected Requests</option>
                    </select>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="">Select Period</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                    </select>
                    <button
                        onClick={handleGenerateReport}
                        className="bg-blue-500 text-white p-2 rounded"
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
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
