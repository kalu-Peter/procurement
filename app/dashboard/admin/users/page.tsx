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
  const [user, setUser] = useState<any>(null);
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
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const [filters, setFilters] = useState({
    role: "",
    department: "",
    is_active: "",
    search: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    is_active: true,
  });

  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 4000);
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!currentUser || currentUser.role !== "admin") {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [router]);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters((prev) => ({ ...prev, search: searchTerm }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Auto-apply filters when they change
  useEffect(() => {
    fetchUsers();
  }, [filters]);
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
    if (key === "search") {
      setSearchTerm(value);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({ role: "", department: "", is_active: "", search: "" });
    setSearchTerm("");
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "").length;
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    const action = isActive ? "deactivate" : "activate";
    const actionPast = isActive ? "deactivated" : "activated";

    // Find user name for better messaging
    const user = users.find((u) => u.id === userId);
    const userName = user ? user.name : "User";

    // Show confirmation for deactivation, but not for activation
    if (isActive) {
      const confirmDeactivate = confirm(
        `Are you sure you want to deactivate "${userName}"? They will no longer be able to log in, but this can be reversed later.`
      );
      if (!confirmDeactivate) {
        return;
      }
    }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText);
        throw new Error("Invalid JSON response from server");
      }

      if (data.success) {
        await fetchUsers();
        // Show success message with better feedback
        showNotification(
          `✅ "${userName}" has been ${actionPast} successfully!`
        );
      } else {
        showNotification(
          `Failed to ${action} user: ` + (data.error || "Unknown error"),
          "error"
        );
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      if (error instanceof Error && error.message.includes("JSON")) {
        showNotification(
          "Server error: Invalid response format. Please try again.",
          "error"
        );
      } else {
        showNotification(
          `Failed to ${action} user. Please try again.`,
          "error"
        );
      }
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText);
        throw new Error("Invalid JSON response from server");
      }

      if (data.success) {
        await fetchUsers();
        alert(
          `User "${userName}" has been permanently deleted from the system!`
        );
      } else {
        // Check for specific error types
        if (data.error && data.error.includes("referenced in")) {
          const confirmDeactivate = confirm(
            `Cannot delete "${userName}": ${data.error}\n\nWould you like to deactivate this user instead? This will prevent login while preserving data integrity.`
          );
          if (confirmDeactivate) {
            // Call the toggle active function to deactivate
            handleToggleActive(userId, true); // true because we want to deactivate (set to false)
            return;
          }
        } else {
          alert("Failed to delete user: " + (data.error || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof Error && error.message.includes("JSON")) {
        alert("Server error: Invalid response format. Please try again.");
      } else {
        alert("Failed to delete user. Please try again.");
      }
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
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md w-full shadow-lg rounded-lg pointer-events-auto ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === "success" ? (
                  <svg
                    className="h-6 w-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    notification.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() =>
                    setNotification({
                      show: false,
                      message: "",
                      type: "success",
                    })
                  }
                  className={`rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === "success"
                      ? "text-green-400 hover:text-green-500 focus:ring-green-500"
                      : "text-red-400 hover:text-red-500 focus:ring-red-500"
                  }`}
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="ri-filter-3-line mr-2"></i>
                Filters
              </h3>
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {getActiveFilterCount()} active
                </span>
              )}
            </div>
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <i
                className={`ri-arrow-${
                  isFilterExpanded ? "up" : "down"
                }-s-line text-xl`}
              ></i>
            </button>
          </div>
        </div>

        {isFilterExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="ri-user-settings-line mr-1"></i>
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Roles</option>
                  <option value="admin">👑 Administrator</option>
                  <option value="procurement_officer">
                    🛒 Procurement Officer
                  </option>
                  <option value="department_head">🏢 Department Head</option>
                  <option value="supplier">🏭 Supplier</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="ri-pulse-line mr-1"></i>
                  Status
                </label>
                <select
                  value={filters.is_active}
                  onChange={(e) =>
                    handleFilterChange("is_active", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="true">✅ Active</option>
                  <option value="false">❌ Inactive</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="ri-building-line mr-1"></i>
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange("department", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Departments</option>
                  <option value="HR">👥 HR</option>
                  <option value="Finance">💰 Finance</option>
                  <option value="IT">💻 IT</option>
                  <option value="Procurement">🛒 Procurement</option>
                  <option value="Operations">⚙️ Operations</option>
                  <option value="Marketing">📢 Marketing</option>
                  <option value="Sales">📊 Sales</option>
                  <option value="Legal">⚖️ Legal</option>
                  <option value="Admin">🏛️ Admin</option>
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="ri-search-line mr-1"></i>
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  {searchTerm && (
                    <button
                      onClick={() => handleFilterChange("search", "")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {getActiveFilterCount() > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">
                      Active filters:
                    </span>
                    {filters.role && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Role: {filters.role.replace("_", " ")}
                        <button
                          onClick={() => handleFilterChange("role", "")}
                          className="ml-1.5 hover:text-purple-900"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </span>
                    )}
                    {filters.is_active && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Status:{" "}
                        {filters.is_active === "true" ? "Active" : "Inactive"}
                        <button
                          onClick={() => handleFilterChange("is_active", "")}
                          className="ml-1.5 hover:text-green-900"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </span>
                    )}
                    {filters.department && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Department: {filters.department}
                        <button
                          onClick={() => handleFilterChange("department", "")}
                          className="ml-1.5 hover:text-blue-900"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </span>
                    )}
                    {filters.search && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Search: "{filters.search}"
                        <button
                          onClick={() => handleFilterChange("search", "")}
                          className="ml-1.5 hover:text-yellow-900"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <i className="ri-refresh-line mr-1"></i>
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userData.is_active
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mr-1.5 ${
                              userData.is_active ? "bg-green-400" : "bg-red-400"
                            }`}
                          ></span>
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
                            className={`text-xs px-3 py-1 rounded-full border-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                              userData.is_active
                                ? "text-red-700 border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400"
                                : "text-green-700 border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400"
                            }`}
                            title={
                              userData.is_active
                                ? `Deactivate ${userData.name} - They will not be able to log in`
                                : `Activate ${userData.name} - Restore login access`
                            }
                          >
                            {actionLoading === userData.id ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-1 h-3 w-3"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Loading...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                {userData.is_active ? (
                                  <>
                                    <i className="ri-pause-circle-line mr-1"></i>
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-play-circle-line mr-1"></i>
                                    Activate
                                  </>
                                )}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteUser(userData.id, userData.name)
                            }
                            disabled={actionLoading === userData.id}
                            className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Permanently delete user (irreversible). Note: Users with existing data (transfers, assets, etc.) cannot be deleted and will be offered deactivation instead."
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
