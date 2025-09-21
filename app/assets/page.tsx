
'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import Link from 'next/link';

interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  department: string;
  description?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  condition?: string;
  location?: string;
  serial_number?: string;
  model?: string;
  brand?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AssetsPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [searchTerm, filterDepartment, filterCategory, filterStatus]);

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterDepartment) params.append('department', filterDepartment);
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`http://localhost:8000/api/assets/index.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAssets(data.assets);
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
              <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
              <p className="text-gray-600 mt-2">Manage and track all organizational assets</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/assets/import" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-file-excel-line"></i>
                </div>
                <span>Import Excel</span>
              </Link>
              <Link href="/assets/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-add-line"></i>
                </div>
                <span>Add Asset</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or tag..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-search-line text-gray-400"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="">All Categories</option>
                  <option value="Computers">Computers</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Software">Software</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Disposed">Disposed</option>
                  <option value="Pending Disposal">Pending Disposal</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">Loading assets...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Asset Tag</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Condition</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No assets found
                        </td>
                      </tr>
                    ) : (
                      assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.asset_tag}</td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                              <div className="text-sm text-gray-500">{asset.brand} {asset.model}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{asset.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{asset.department}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              asset.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                                asset.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                                  asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                    asset.condition === 'Poor' ? 'bg-orange-100 text-orange-800' :
                                      asset.condition === 'Obsolete' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                              {asset.condition || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              asset.status === 'Active' ? 'bg-green-100 text-green-800' :
                                asset.status === 'Disposed' ? 'bg-red-100 text-red-800' :
                                  asset.status === 'Transferred' ? 'bg-blue-100 text-blue-800' :
                                    asset.status === 'Pending Disposal' || asset.status === 'Disposal Pending' ? 'bg-orange-100 text-orange-800' :
                                      'bg-yellow-100 text-yellow-800'
                            }`}>
                              {asset.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Link href={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <i className="ri-eye-line"></i>
                                </div>
                              </Link>
                              <Link href={`/assets/${asset.id}/edit`} className="text-green-600 hover:text-green-800 cursor-pointer">
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <i className="ri-edit-line"></i>
                                </div>
                              </Link>
                              <Link href={`/transfers/new?asset=${asset.id}`} className="text-yellow-600 hover:text-yellow-800 cursor-pointer">
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <i className="ri-exchange-line"></i>
                                </div>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Showing {assets.length} assets
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                Previous
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer whitespace-nowrap">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
