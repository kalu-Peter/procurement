
'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import Link from 'next/link';

interface Transfer {
  id: string;
  asset_id: string;
  asset_name?: string;
  asset_tag?: string;
  from_department: string;
  to_department: string;
  requested_by: string;
  requested_by_name?: string;
  reason?: string;
  status: string;
  request_date: string;
  approved_by?: string;
  approved_date?: string;
}

export default function TransfersPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, [filterStatus]);

  const fetchTransfers = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`http://localhost:8000/api/transfer/index.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTransfers(data.transfers);
      } else {
        console.error('Failed to fetch transfers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const handleApprove = async (transferId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/transfer/update.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: transferId,
          status: 'Approved',
          approved_by: user?.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTransfers(); // Refresh the list
        setShowApprovalModal(false);
        setSelectedTransfer(null);
      } else {
        alert('Failed to approve transfer: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving transfer:', error);
      alert('Failed to approve transfer. Please try again.');
    }
  };

  const handleReject = async (transferId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/transfer/update.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: transferId,
          status: 'Rejected',
          approved_by: user?.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTransfers(); // Refresh the list
        setShowApprovalModal(false);
        setSelectedTransfer(null);
      } else {
        alert('Failed to reject transfer: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      alert('Failed to reject transfer. Please try again.');
    }
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  const filteredTransfers = transfers.filter(transfer => 
    filterStatus === '' || transfer.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Asset Transfers</h1>
              <p className="text-gray-600 mt-2">Manage asset transfer requests and approvals</p>
            </div>
            <Link href="/transfers/new" className="bg-bs-green text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-add-line"></i>
              </div>
              <span>New Transfer</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {transfers.filter(t => t.status === 'Pending').length}
                  </p>
                  <p className="text-gray-600 text-sm">Pending</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="ri-time-line text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {transfers.filter(t => t.status === 'Approved').length}
                  </p>
                  <p className="text-gray-600 text-sm">Approved</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">8</p>
                  <p className="text-gray-600 text-sm">Completed</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-check-double-line text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-gray-600 text-sm">Rejected</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="ri-close-line text-red-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Filter Transfers</h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTransfers.map((transfer) => (
              <div key={transfer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-exchange-line text-blue-600 text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {transfer.asset_name || 'Unknown Asset'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Asset Tag: {transfer.asset_tag || 'N/A'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <div className="w-4 h-4 flex items-center justify-center mr-1">
                              <i className="ri-building-line"></i>
                            </div>
                            From: {transfer.from_department}
                          </span>
                          <span className="flex items-center">
                            <div className="w-4 h-4 flex items-center justify-center mr-1">
                              <i className="ri-arrow-right-line"></i>
                            </div>
                            To: {transfer.to_department}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        transfer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        transfer.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        transfer.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {transfer.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Requested by: {transfer.requested_by_name || 'Unknown'}</p>
                      <p>Date: {new Date(transfer.request_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium text-left cursor-pointer whitespace-nowrap">
                      View Details
                    </button>
                    {transfer.status === 'Pending' && (user?.role === 'admin' || user?.role === 'procurement_officer') && (
                      <>
                        <button
                          onClick={() => handleApprove(transfer.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium text-left cursor-pointer whitespace-nowrap"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(transfer.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium text-left cursor-pointer whitespace-nowrap"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Reason:</span> {transfer.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredTransfers.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-exchange-line text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transfers found</h3>
              <p className="text-gray-600 mb-6">No transfer requests match your current filters.</p>
              <Link href="/transfers/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 inline-flex items-center space-x-2 cursor-pointer whitespace-nowrap">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-add-line"></i>
                </div>
                <span>Create New Transfer</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
