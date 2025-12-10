"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, getCurrentUser, logoutUser } from "@/lib/auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  time_ago: string;
  related_id?: string;
  related_type?: string;
}

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/notifications/index.php?user_id=${user.id}&user_role=${user.role}&limit=10`
      );
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/notifications/mark-read.php`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notification_id: notificationId,
            user_id: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state and sync unread count from the API response
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(data.unread_count);

        // Trigger a global event to notify other components (like the Notifications Page)
        window.dispatchEvent(new Event("notificationUpdated"));
      } else {
        console.error("Failed to mark notification as read:", data.error);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/notifications/mark-read.php`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            mark_all: true,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state and sync unread count from the API response
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(data.unread_count);

        // Trigger a global event to notify other components
        window.dispatchEvent(new Event("notificationUpdated"));
      } else {
        console.error("Failed to mark all notifications as read:", data.error);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchNotifications();

      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);

      // Listen for updates from other components (like the Notifications Page)
      const handleExternalUpdate = () => {
        fetchNotifications();
      };

      window.addEventListener("notificationUpdated", handleExternalUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("notificationUpdated", handleExternalUpdate);
      };
    }
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_created":
        return "ri-file-add-line";
      case "request_approved":
        return "ri-checkbox-circle-line text-green-600";
      case "request_rejected":
        return "ri-close-circle-line text-red-600";
      case "transfer_request":
        return "ri-exchange-line";
      case "disposal_request":
        return "ri-delete-bin-line";
      default:
        return "ri-notification-line";
    }
  };

  return (
    <header className="bg-header-yellow border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <span className="text-2xl font-bold text-gray-800 font-pacifico">
                TUM Procurement
              </span>
            </Link>

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
                <Link
                  href="/suppliers-list"
                  className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                >
                  Suppliers
                </Link>
                <Link
                  href="/reports"
                  className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                >
                  Reports
                </Link>

                {(user.role === "admin" ||
                  user.role === "procurement_officer") && (
                  <>
                    <Link
                      href="/purchase-orders"
                      className="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap"
                    >
                      Purchase Orders
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchNotifications(); // Refresh notifications when opening
                    }
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-notification-line text-xl"></i>
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Notifications{" "}
                          {unreadCount > 0 && `(${unreadCount} unread)`}
                        </h3>
                        <div className="flex space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-blue-600 text-xs font-medium hover:text-blue-800"
                            >
                              Mark All Read
                            </button>
                          )}
                          <Link
                            href="/notifications"
                            className="text-bs-green text-xs font-medium cursor-pointer hover:text-green-700"
                          >
                            View All
                          </Link>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                            !notification.is_read
                              ? "bg-blue-50 border-l-blue-500"
                              : "border-l-transparent"
                          }`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id);
                            }
                            // Navigate to related item if available
                            if (
                              notification.related_type === "asset_request" &&
                              notification.related_id
                            ) {
                              window.location.href = `/requests/${notification.related_id}`;
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <i
                                className={`${getNotificationIcon(
                                  notification.type
                                )} text-lg`}
                              ></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p
                                    className={`font-medium text-sm ${
                                      !notification.is_read
                                        ? "text-gray-900"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                  <span className="text-xs text-gray-500">
                                    {notification.time_ago}
                                  </span>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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
