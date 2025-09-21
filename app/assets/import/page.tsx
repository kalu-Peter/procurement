
'use client';

import { useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function ImportAssetsPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 1) {
          const headers = jsonData[0] as string[];
          const rows = (jsonData.slice(1, 6) as any[][]).map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          setPreview(rows);
        }
      } catch (error) {
        setErrors(['Failed to read Excel file. Please ensure it\'s a valid Excel file.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setLoading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('excel_file', file);

      const response = await fetch('http://localhost:8000/api/assets/import.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/assets';
        }, 3000);
      } else {
        setErrors([data.error || 'Import failed. Please try again.']);
      }
    } catch (error) {
      console.error('Import error:', error);
      setErrors(['Import failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Asset Name', 'Category', 'Department', 'Brand', 'Model', 'Serial Number', 'Purchase Date', 'Purchase Price', 'Condition', 'Location', 'Description'],
      ['Dell OptiPlex 7090', 'Computers', 'IT', 'Dell', 'OptiPlex 7090', 'DL789456123', '2024-01-15', '85000', 'Excellent', 'IT Office - Room 201', 'Desktop computer for office work'],
      ['Executive Office Desk', 'Furniture', 'Finance', 'IKEA', 'Bekant', '', '2024-02-10', '45000', 'Good', 'Finance Office - Room 105', 'Wooden executive desk with drawers']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asset Template');
    XLSX.writeFile(wb, 'asset_import_template.xlsx');
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Successful!</h2>
            <p className="text-gray-600 mb-4">Assets have been imported successfully.</p>
            <p className="text-sm text-gray-500">Redirecting to asset list...</p>
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
            <Link href="/assets" className="text-gray-600 hover:text-blue-600 cursor-pointer">
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-arrow-left-line text-xl"></i>
              </div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import Assets from Excel</h1>
              <p className="text-gray-600 mt-2">Bulk import assets using Excel spreadsheet</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-information-line text-blue-600"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Import Instructions</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Download the template file and fill in your asset data</li>
                      <li>Ensure all required fields are completed</li>
                      <li>Use the exact column headers as shown in the template</li>
                      <li>Date format should be YYYY-MM-DD</li>
                      <li>Maximum file size: 10MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Download Template</h2>
                <button
                  onClick={downloadTemplate}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 inline-flex items-center space-x-2 cursor-pointer whitespace-nowrap"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-download-line"></i>
                  </div>
                  <span>Download Excel Template</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Upload Your File</h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-file-excel-line text-gray-400 text-2xl"></i>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 font-medium hover:text-blue-500">Choose a file</span>
                      <span className="text-gray-600"> or drag and drop</span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-500">Excel files only (.xlsx, .xls)</p>
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <i className="ri-file-excel-line text-green-600"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreview([]);
                          setErrors([]);
                        }}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <i className="ri-close-line"></i>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {errors.length > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="ri-error-warning-line text-red-600"></i>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Import Errors</h3>
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {preview.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview (First 5 rows)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(preview[0]).map((header) => (
                              <th key={header} className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {Object.values(row).map((cell: any, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                                  {cell?.toString() || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {file && preview.length > 0 && (
                  <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview([]);
                        setErrors([]);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 whitespace-nowrap"
                    >
                      {loading ? 'Importing Assets...' : 'Import Assets'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
