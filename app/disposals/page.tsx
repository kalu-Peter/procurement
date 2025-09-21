
'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import Link from 'next/link';

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
  const [activeTab, setActiveTab] = useState('requests');
  const [disposalRequests, setDisposalRequests] = useState<Disposal[]>([]);
  const [disposalRecords, setDisposalRecords] = useState<Disposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordFilter, setRecordFilter] = useState('all'); // all, approved, rejected

  useEffect(() => {
    fetchDisposals();
  }, [activeTab, recordFilter]);

  // Fetch both requests and records on mount to get accurate counts
  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch requests (only pending)
      const requestParams = new URLSearchParams();
      requestParams.append('type', 'requests');
      if (user?.department && user?.role !== 'admin') {
        requestParams.append('department', user.department);
      }
      
      const requestsResponse = await fetch(`http://localhost:8000/api/disposals/index.php?${requestParams}`);
      const requestsData = await requestsResponse.json();
      if (requestsData.success) {
        setDisposalRequests(requestsData.disposals);
      }

      // Fetch records (all approved and rejected)
      const recordParams = new URLSearchParams();
      recordParams.append('type', 'records');
      if (user?.department && user?.role !== 'admin') {
        recordParams.append('department', user.department);
      }
      
      const recordsResponse = await fetch(`http://localhost:8000/api/disposals/index.php?${recordParams}`);
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
      params.append('type', activeTab);
      
      // Only add department filter for non-admin users
      if (user?.department && user?.role !== 'admin') {
        params.append('department', user.department);
      }

      // Add record status filter for records tab
      if (activeTab === 'records' && recordFilter !== 'all') {
        params.append('record_status', recordFilter);
      }

      const response = await fetch(`http://localhost:8000/api/disposals/index.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        if (activeTab === 'requests') {
          setDisposalRequests(data.disposals);
        } else {
          setDisposalRecords(data.disposals);
        }
      } else {
        console.error('Failed to fetch disposals:', data.error);
      }
    } catch (error) {
      console.error('Error fetching disposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const handleApproveDisposal = async (requestId: string, sourceType?: string) => {
    try {
      // Find the request to get the correct asset_id
      const request = disposalRequests.find(r => r.id === requestId);
      if (!request) {
        alert('Request not found');
        return;
      }

      const response = await fetch('http://localhost:8000/api/disposals/approve.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_id: request.asset_id, // Use the actual asset_id, not request.id
          action: 'approve',
          source_type: sourceType || 'manual',
          disposal_request_id: sourceType === 'manual' ? requestId : null,
          approved_by: user?.id,
          notes: null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh both requests and records since approved/rejected items move between tabs
        const requestParams = new URLSearchParams();
        requestParams.append('type', 'requests');
        if (user?.department && user?.role !== 'admin') {
          requestParams.append('department', user.department);
        }
        
        const requestsResponse = await fetch(`http://localhost:8000/api/disposals/index.php?${requestParams}`);
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setDisposalRequests(requestsData.disposals);
        }

        const recordParams = new URLSearchParams();
        recordParams.append('type', 'records');
        if (user?.department && user?.role !== 'admin') {
          recordParams.append('department', user.department);
        }
        
        const recordsResponse = await fetch(`http://localhost:8000/api/disposals/index.php?${recordParams}`);
        const recordsData = await recordsResponse.json();
        if (recordsData.success) {
          setDisposalRecords(recordsData.disposals);
        }
        
        alert('Disposal approved successfully!');
      } else {
        alert('Failed to approve disposal: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving disposal:', error);
      alert('Failed to approve disposal. Please try again.');
    }
  };

  const handleRejectDisposal = async (requestId: string, sourceType?: string) => {
    try {
      // Find the request to get the correct asset_id
      const request = disposalRequests.find(r => r.id === requestId);
      if (!request) {
        alert('Request not found');
        return;
      }

      const response = await fetch('http://localhost:8000/api/disposals/approve.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_id: request.asset_id, // Use the actual asset_id, not request.id
          action: 'reject',
          source_type: sourceType || 'manual',
          disposal_request_id: sourceType === 'manual' ? requestId : null,
          approved_by: user?.id,
          notes: null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh both requests and records since rejected items move to records
        const requestParams = new URLSearchParams();
        requestParams.append('type', 'requests');
        if (user?.department && user?.role !== 'admin') {
          requestParams.append('department', user.department);
        }
        
        const requestsResponse = await fetch(`http://localhost:8000/api/disposals/index.php?${requestParams}`);
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setDisposalRequests(requestsData.disposals);
        }

        const recordParams = new URLSearchParams();
        recordParams.append('type', 'records');
        if (user?.department && user?.role !== 'admin') {
          recordParams.append('department', user.department);
        }
        
        const recordsResponse = await fetch(`http://localhost:8000/api/disposals/index.php?${recordParams}`);
        const recordsData = await recordsResponse.json();
        if (recordsData.success) {
          setDisposalRecords(recordsData.disposals);
        }

        alert('Disposal rejected successfully!');
      } else {
        alert('Failed to reject disposal: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting disposal:', error);
      alert('Failed to reject disposal. Please try again.');
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
              <h1 className="text-3xl font-bold text-gray-900">Asset Disposals</h1>
              <p className="text-gray-600 mt-2">
                {user?.role === 'admin' 
                  ? 'Manage disposal requests and records for all departments'
                  : `Manage disposal requests and records for ${user?.department ? `${user.department} department` : 'your department'}`
                }
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/disposals/new" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer">
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
                  onClick={() => setActiveTab('requests')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                    activeTab === 'requests'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Disposal Requests ({disposalRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                    activeTab === 'records'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Disposal Records ({disposalRecords.length})
                </button>
              </nav>
            </div>

            {activeTab === 'records' && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setRecordFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                      recordFilter === 'all'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    All Records
                  </button>
                  <button
                    onClick={() => setRecordFilter('approved')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                      recordFilter === 'approved'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Approved Only
                  </button>
                  <button
                    onClick={() => setRecordFilter('rejected')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                      recordFilter === 'rejected'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Rejected Only
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  {disposalRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                        <i className="ri-delete-bin-line text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Disposal Requests</h3>
                      <p className="text-gray-500 mb-4">
                        {user?.role === 'admin' 
                          ? 'There are no pending disposal requests from any department at the moment.'
                          : `There are no pending disposal requests for ${user?.department ? `${user.department} department` : 'your department'} at the moment.`
                        }
                      </p>
                    </div>
                  ) : (
                    disposalRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{request.asset_name || 'Unknown Asset'}</h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </span>
                              {request.source_type === 'automatic' && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Auto-Generated
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Asset Tag: {request.asset_tag || 'N/A'}</p>
                            <p className="text-sm text-gray-600 mb-1">Department: {request.department || 'N/A'}</p>
                            <p className="text-sm text-gray-600 mb-1">Method: {request.method || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {request.source_type === 'automatic' 
                                ? 'System Generated' 
                                : `Requested by: ${request.requested_by_name || 'Unknown'}`
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.request_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {request.source_type === 'automatic' ? 'Reason for Disposal:' : 'Disposal Reason:'}
                          </p>
                          <p className="text-sm text-gray-600">{request.reason || 'No reason provided'}</p>
                        </div>

                        {request.source_type !== 'automatic' && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">Disposal Method:</p>
                            <p className="text-sm text-gray-600">{request.method || 'Not specified'}</p>
                          </div>
                        )}

                        {request.status === 'Pending' && user?.role === 'admin' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleApproveDisposal(request.id, request.source_type)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2 text-sm whitespace-nowrap cursor-pointer"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <i className="ri-check-line"></i>
                              </div>
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectDisposal(request.id, request.source_type)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center space-x-2 text-sm whitespace-nowrap cursor-pointer"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <i className="ri-close-line"></i>
                              </div>
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {request.status !== 'Pending' && (
                          <div className="text-sm text-gray-500">
                            {request.status} on {request.approved_date && new Date(request.approved_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'records' && (
                <div className="space-y-4">
                  {disposalRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                        <i className="ri-file-list-line text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Disposal Records</h3>
                      <p className="text-gray-500 mb-4">
                        {recordFilter === 'all' 
                          ? (user?.role === 'admin' 
                              ? 'No assets from any department have been processed yet.'
                              : `No assets from ${user?.department ? `${user.department} department` : 'your department'} have been processed yet.`
                            )
                          : recordFilter === 'approved'
                            ? (user?.role === 'admin'
                                ? 'No approved disposal requests from any department yet.'
                                : `No approved disposal requests from ${user?.department ? `${user.department} department` : 'your department'} yet.`
                              )
                            : (user?.role === 'admin'
                                ? 'No rejected disposal requests from any department yet.'
                                : `No rejected disposal requests from ${user?.department ? `${user.department} department` : 'your department'} yet.`
                              )
                        }
                      </p>
                    </div>
                  ) : (
                    disposalRecords.map((record) => (
                      <div key={record.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{record.asset_name || 'Unknown Asset'}</h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                record.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                record.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {record.status === 'Approved' ? 'Disposed' : record.status}
                              </span>
                              {record.source_type === 'automatic' && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Auto-Generated
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Asset Tag: {record.asset_tag || 'N/A'}</p>
                            <p className="text-sm text-gray-600 mb-1">Department: {record.department || 'N/A'}</p>
                            {record.method && (
                              <p className="text-sm text-gray-600">Method: {record.method}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {record.source_type === 'automatic' 
                                ? 'System Generated' 
                                : `Requested by: ${record.requested_by_name || 'Unknown'}`
                              }
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(record.approved_date || record.request_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {record.source_type === 'automatic' ? 'Disposal Reason:' : 'Reason:'}
                          </p>
                          <p className="text-sm text-gray-600">{record.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
