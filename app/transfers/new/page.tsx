
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { mockAssets, mockDepartments } from '@/lib/mockData';
import Header from '@/components/Header';
import Link from 'next/link';

function NewTransferForm() {
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get('asset');
  
  const [user, setUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    assetId: preselectedAssetId || '',
    fromDepartment: '',
    toDepartment: '',
    reason: '',
    notes: ''
  });

  const selectedAsset = mockAssets.find(asset => asset.id === formData.assetId);

  useEffect(() => {
    if (selectedAsset) {
      setFormData(prev => ({
        ...prev,
        fromDepartment: selectedAsset.department
      }));
    }
  }, [selectedAsset]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/transfers';
      }, 2000);
    } catch (error) {
      console.error('Error creating transfer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'assetId') {
      const asset = mockAssets.find(a => a.id === value);
      if (asset) {
        setFormData(prev => ({
          ...prev,
          fromDepartment: asset.department
        }));
      }
    }
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-check-line text-green-600 text-2xl"></i>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Transfer Request Submitted!</h2>
            <p className="text-gray-600 mb-4">Your transfer request has been submitted for approval.</p>
            <p className="text-sm text-gray-500">Redirecting to transfers list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/transfers" className="text-gray-600 hover:text-blue-600 cursor-pointer">
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-arrow-left-line text-xl"></i>
              </div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Asset Transfer</h1>
              <p className="text-gray-600 mt-2">Create a new asset transfer request</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form id="transfer-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Asset *
                </label>
                <select
                  name="assetId"
                  value={formData.assetId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  required
                >
                  <option value="">Select an asset to transfer</option>
                  {mockAssets.filter(asset => asset.status === 'Active').map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetTag} - {asset.name} ({asset.department})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAsset && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Asset Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedAsset.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedAsset.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Value:</span>
                      <span className="ml-2 font-medium text-gray-900">KES {selectedAsset.currentValue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedAsset.location}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Department
                  </label>
                  <input
                    type="text"
                    name="fromDepartment"
                    value={formData.fromDepartment}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    disabled
                    placeholder="Will be set based on selected asset"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Department *
                  </label>
                  <select
                    name="toDepartment"
                    value={formData.toDepartment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    required
                  >
                    <option value="">Select destination department</option>
                    {mockDepartments
                      .filter(dept => dept.name !== formData.fromDepartment)
                      .map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Transfer *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why this asset needs to be transferred..."
                  maxLength={500}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.reason.length}/500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional information..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/500 characters</p>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link href="/transfers" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 cursor-pointer whitespace-nowrap">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 whitespace-nowrap"
                >
                  {loading ? 'Submitting Request...' : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NewTransferPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewTransferForm />
    </Suspense>
  );
}
