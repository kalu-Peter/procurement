'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';

interface Asset {
  id: string;
  name: string;
  category: string;
  description: string;
  condition: string;
  location: string;
  serial_number: string;
  model: string;
  brand: string;
  current_value: string;
  status: string;
  department: string;
}

export default function EditAsset() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;

  const [user, setUser] = useState(getCurrentUser());
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    condition: '',
    location: '',
    serial_number: '',
    model: '',
    brand: '',
    current_value: '',
  });

  const conditionOptions = [
    'Excellent',
    'Good', 
    'Fair',
    'Poor',
    'Obsolete'
  ];

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  useEffect(() => {
    if (assetId) {
      fetchAsset();
    }
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/assets/edit.php?id=${assetId}`);
      const data = await response.json();
      
      if (data.success && data.asset) {
        const assetData = data.asset;
        setAsset(assetData);
        setFormData({
          name: assetData.name || '',
          category: assetData.category || '',
          description: assetData.description || '',
          condition: assetData.condition || '',
          location: assetData.location || '',
          serial_number: assetData.serial_number || '',
          model: assetData.model || '',
          brand: assetData.brand || '',
          current_value: assetData.current_value || '',
        });
      } else {
        setError('Asset not found');
      }
    } catch (err) {
      setError('Failed to load asset');
      console.error('Error fetching asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8000/api/assets/edit.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: assetId, ...formData }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Asset updated successfully!');
        
        // If condition was changed to Obsolete, show notification
        if (formData.condition === 'Obsolete' && asset?.condition !== 'Obsolete') {
          setSuccess('Asset updated successfully! Status has been changed to "Disposal Pending" as the condition is now Obsolete.');
        }
        
        setTimeout(() => {
          router.push('/assets');
        }, 2000);
      } else {
        setError(result.message || 'Failed to update asset');
      }
    } catch (err) {
      setError('Failed to update asset');
      console.error('Error updating asset:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>Please login to access this page.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading asset...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !asset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">❌</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => router.push('/assets')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Assets
            </button>
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
          <div className="mb-8">
            <button
              onClick={() => router.push('/assets')}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
            >
              ← Back to Assets
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Asset</h1>
            <p className="text-gray-600 mt-2">Update asset information and condition</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    id="serial_number"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Condition</option>
                    {conditionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {formData.condition === 'Obsolete' && (
                    <p className="text-amber-600 text-sm mt-1">
                      ⚠️ Setting condition to "Obsolete" will automatically change the asset status to "Disposal Pending"
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="current_value" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="current_value"
                    name="current_value"
                    value={formData.current_value}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {asset && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Asset Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Department:</span> <span className="font-medium">{asset.department}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Status:</span> <span className="font-medium">{asset.status}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/assets')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
