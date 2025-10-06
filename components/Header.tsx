"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, getCurrentUser, logoutUser } from "@/lib/auth";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const notifications = [
    {
      id: "1",
      title: "New Transfer Request",
      message: "Dell OptiPlex transfer pending approval",
      time: "5 min ago",
    },
    {
      id: "2",
      title: "Asset Disposal",
      message: "Old printer disposal completed",
      time: "1 hour ago",
    },
  ];

  return (
    <header className="bg-header-yellow border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-gray-800 font-pacifico"
            ></Link>

            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <Link
                  href="/assets"
                  className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                >
                  Assets
                </Link>
                <Link
                  href="/transfers"
                  className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                >
                  Transfers
                </Link>
                <Link
                  href="/disposals"
                  className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                >
                  Disposals
                </Link>
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowSupplierDropdown(!showSupplierDropdown)
                    }
                    className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap flex items-center space-x-1"
                  >
                    <span>Supplier Registration</span>
                    <i
                      className={`ri-arrow-down-s-line transition-transform ${
                        showSupplierDropdown ? "rotate-180" : ""
                      }`}
                    ></i>
                  </button>

                  {showSupplierDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        href="/suppliers"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => setShowSupplierDropdown(false)}
                      >
                        <div className="flex items-center space-x-3">
                          <i className="ri-user-add-line text-green-600"></i>
                          <div>
                            <div className="font-medium">
                              Register as Supplier
                            </div>
                            <div className="text-sm text-gray-500">
                              Join our supplier network
                            </div>
                          </div>
                        </div>
                      </Link>
                      <Link
                        href="/suppliers-list"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => setShowSupplierDropdown(false)}
                      >
                        <div className="flex items-center space-x-3">
                          <i className="ri-store-line text-blue-600"></i>
                          <div>
                            <div className="font-medium">Browse Suppliers</div>
                            <div className="text-sm text-gray-500">
                              View supplier directory
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {(user.role === "admin" ||
                  user.role === "procurement_officer") && (
                  <Link
                    href="/reports"
                    className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                  >
                    Reports
                  </Link>
                )}
              </nav>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-notification-line text-xl"></i>
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    2
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Notifications
                        </h3>
                        <Link
                          href="/notifications"
                          className="text-bs-green text-sm font-medium cursor-pointer"
                        >
                          View All
                        </Link>
                      </div>
                    </div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {notification.message}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-bs-green font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-arrow-down-s-line"></i>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {user.role.replace("_", " ")}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Notifications
                    </Link>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
