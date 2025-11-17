"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total: number;
  active: number;
  admins: number;
  procurement_officers: number;
  department_heads: number;
  suppliers: number;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    admins: 0,
    procurement_officers: 0,
    department_heads: 0,
    suppliers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: "",
    department: "",
    is_active: "",
    search: "",
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    is_active: true,
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [router, user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append("role", filters.role);
      if (filters.department)
        queryParams.append("department", filters.department);
      if (filters.is_active !== "")
        queryParams.append("is_active", filters.is_active);
      if (filters.search) queryParams.append("search", filters.search);

      const response = await fetch(
        `http://localhost:8000/api/users/index.php?${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setStats(data.statistics);
        setError("");
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchUsers();
  };

  const clearFilters = () => {
    setFilters({ role: "", department: "", is_active: "", search: "" });
    setTimeout(() => fetchUsers(), 100);
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      const response = await fetch(
        "http://localhost:8000/api/users/update.php",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: userId,
            is_active: !isActive,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchUsers();
        // Show success message
        const action = !isActive ? "activated" : "deactivated";
        alert(`User ${action} successfully!`);
      } else {
        alert(
          "Failed to update user status: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to deactivate "${userName}"? This will prevent them from logging in, but can be reversed later.`
      )
    ) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch(
        "http://localhost:8000/api/users/delete.php",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchUsers();
        alert(`User "${userName}" has been deactivated!`);
      } else {
        alert("Failed to deactivate user: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
      alert("Failed to deactivate user. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE "${userName}"? This action CANNOT be undone and will remove all user data from the system.`
      )
    ) {
      return;
    }

    // Double confirmation for permanent deletion
    if (
      !confirm(
        `This is your final warning! Type 'DELETE' to confirm permanent deletion of "${userName}". This action is irreversible.`
      )
    ) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch(
        "http://localhost:8000/api/users/hard_delete.php",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchUsers();
        alert(
          `User "${userName}" has been permanently deleted from the system!`
        );
      } else {
        alert("Failed to delete user: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = (userData: User) => {
    setSelectedUser(userData);
    setEditFormData({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department || "",
      is_active: userData.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(selectedUser.id);
    try {
      const response = await fetch(
        "http://localhost:8000/api/users/update.php",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedUser.id,
            ...editFormData,
            department: editFormData.department || null,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchUsers();
        setIsEditModalOpen(false);
        setSelectedUser(null);
        alert("User updated successfully!");
      } else {
        alert("Failed to update user: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: string | boolean } }
  ) => {
    const { name, value, type } = e.target as
      | HTMLInputElement
      | HTMLSelectElement;
    setEditFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (role) {
      case "admin":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case "procurement_officer":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "department_head":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "supplier":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Link
          href="/dashboard/admin/users/register"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
        >
          <i className="ri-user-add-line"></i>
          <span>Add New User</span>
        </Link>
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-gray-600 text-sm">Total Users</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-gray-600 text-sm">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            <p className="text-gray-600 text-sm">Admins</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.procurement_officers}
            </p>
            <p className="text-gray-600 text-sm">Procurement</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.department_heads}
            </p>
            <p className="text-gray-600 text-sm">Dept. Heads</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {stats.suppliers}
            </p>
            <p className="text-gray-600 text-sm">Suppliers</p>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {selectedUser.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="department">Department</option>
                  <option value="procurement">Procurement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="department"
                  value={editFormData.department}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="IT">IT</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Legal">Legal</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={editFormData.is_active}
                  onChange={(e) =>
                    handleEditFormChange({
                      target: {
                        name: "is_active",
                        value: e.target.checked,
                      },
                    } as any)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={actionLoading === selectedUser.id}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedUser.id
                  ? "Updating..."
                  : "Update User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="procurement_officer">Procurement Officer</option>
              <option value="department_head">Department Head</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange("is_active", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              placeholder="Filter by department..."
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <i className="ri-error-warning-line text-red-500 mr-2"></i>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <i className="ri-user-line text-4xl mb-4 block"></i>
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <i className="ri-user-line text-gray-500"></i>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userData.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userData.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRoleBadge(userData.role)}>
                          {formatRole(userData.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userData.department || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {userData.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(userData.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(userData)}
                            disabled={actionLoading === userData.id}
                            className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit user"
                          >
                            {actionLoading === userData.id
                              ? "Loading..."
                              : "Edit"}
                          </button>
                          <button
                            onClick={() =>
                              handleToggleActive(
                                userData.id,
                                userData.is_active
                              )
                            }
                            disabled={actionLoading === userData.id}
                            className={`text-xs px-2 py-1 rounded border transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                              userData.is_active
                                ? "text-red-600 border-red-300 hover:bg-red-50"
                                : "text-green-600 border-green-300 hover:bg-green-50"
                            }`}
                            title={
                              userData.is_active
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            {actionLoading === userData.id
                              ? "Loading..."
                              : userData.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          {userData.is_active && (
                            <button
                              onClick={() =>
                                handleDeactivateUser(userData.id, userData.name)
                              }
                              disabled={actionLoading === userData.id}
                              className="text-orange-600 hover:text-orange-900 text-xs px-2 py-1 rounded border border-orange-300 hover:bg-orange-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Deactivate user (reversible)"
                            >
                              {actionLoading === userData.id
                                ? "Loading..."
                                : "Deactivate"}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteUser(userData.id, userData.name)
                            }
                            disabled={actionLoading === userData.id}
                            className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Permanently delete user (irreversible)"
                          >
                            {actionLoading === userData.id
                              ? "Loading..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
