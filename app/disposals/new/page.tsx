
'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  asset_tag: string;
  category: string;
  department: string;
  condition: string;
  status: string;
  current_value: number;
  location: string;
}

export default function NewDisposalPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('Recycling');
  const [saleAmount, setSaleAmount] = useState('');
  const [recipientDetails, setRecipientDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableAssets();
  }, [user]);

  const fetchAvailableAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (user?.department && user?.role !== 'admin') {
        params.append('department', user.department);
      }
      if (user?.role) {
        params.append('user_role', user.role);
      }

      const response = await fetch(`http://localhost:8000/api/assets/disposable.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableAssets(data.assets);
      } else {
        console.error('Failed to fetch assets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const selectedAsset = availableAssets.find(asset => asset.id === selectedAssetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssetId || !reason.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const disposalData = {
        asset_id: selectedAssetId,
        reason: reason.trim(),
        method,
        requested_by: user!.id,
        requested_by_name: user!.name,
        sale_amount: method === 'Sale' && saleAmount ? saleAmount : null,
        recipient_details: method === 'Donation' && recipientDetails ? recipientDetails.trim() : null,
        notes: notes.trim() || null
      };

      const response = await fetch('http://localhost:8000/api/disposals/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(disposalData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Disposal request submitted successfully!');
        // Reset form
        setSelectedAssetId('');
        setReason('');
        setMethod('Recycling');
        setSaleAmount('');
        setRecipientDetails('');
        setNotes('');
        // Redirect to disposals page
        window.location.href = '/disposals';
      } else {
        alert('Failed to submit disposal request: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting disposal request:', error);
      alert('Failed to submit disposal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <main className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading available assets...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Link href="/disposals" className="text-gray-500 hover:text-gray-700 cursor-pointer">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-arrow-left-line"></i>
                </div>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">New Disposal Request</h1>
            </div>
            <p className="text-gray-600">Submit a new asset disposal request for approval</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} id="disposal-form" className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Asset for Disposal <span className="text-red-500">*</span>
                </label>
                <select
                  name="assetId"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm pr-8"
                  required
                >
                  <option value="">Select an asset...</option>
                  {availableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag} - {asset.name} ({asset.condition})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {availableAssets.length === 0 
                    ? 'No assets available for disposal at the moment'
                    : `${availableAssets.length} assets available for disposal`
                  }
                </p>
              </div>

              {selectedAsset && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Asset Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedAsset.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2">{selectedAsset.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Department:</span>
                      <span className="ml-2">{selectedAsset.department}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Condition:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        selectedAsset.condition === 'Obsolete' ? 'bg-red-100 text-red-800' : 
                        selectedAsset.condition === 'Poor' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedAsset.condition}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Value:</span>
                      <span className="ml-2">KES {selectedAsset.current_value ? Number(selectedAsset.current_value).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2">{selectedAsset.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposal Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                  placeholder="Explain why this asset needs to be disposed..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">{reason.length}/500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposal Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm pr-8"
                  required
                >
                  <option value="Recycling">Recycling</option>
                  <option value="Sale">Sale</option>
                  <option value="Donation">Donation</option>
                  <option value="Destruction">Destruction</option>
                </select>
              </div>

              {method === 'Sale' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Sale Amount (KES)
                  </label>
                  <input
                    type="number"
                    name="saleAmount"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    placeholder="Enter expected sale amount..."
                  />
                </div>
              )}

              {method === 'Donation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Details
                  </label>
                  <textarea
                    name="recipientDetails"
                    value={recipientDetails}
                    onChange={(e) => setRecipientDetails(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                    placeholder="Enter recipient organization/person details..."
                  />
                  <p className="text-sm text-gray-500 mt-1">{recipientDetails.length}/500 characters</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                  placeholder="Any additional information or special instructions..."
                />
                <p className="text-sm text-gray-500 mt-1">{notes.length}/500 characters</p>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/disposals" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 cursor-pointer whitespace-nowrap">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 cursor-pointer whitespace-nowrap"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Disposal Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
