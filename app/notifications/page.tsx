"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  time_ago: string;
  created_at: string;
  related_id?: string;
  related_type?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isManualFetching, setIsManualFetching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    // Get user once on component mount
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  const fetchNotifications = useCallback(
    async (isManual = false) => {
      if (!user) return;

      if (isManual) {
        setIsManualFetching(true);
      } else {
        setIsPolling(true);
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/notifications/index.php?user_id=${user.id}&user_role=${user.role}&limit=50`
        );
        const data = await response.json();

        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count);
        } else {
          console.error("Failed to fetch notifications:", data.error);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        if (isManual) {
          setIsManualFetching(false);
        } else {
          setIsPolling(false);
        }
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    // Fetch notifications when user is available and then poll for updates
    if (user) {
      fetchNotifications();

      // Poll every 5 seconds
      const interval = setInterval(() => fetchNotifications(false), 5000);

      // Listen for updates from other components (like Header)
      const handleExternalUpdate = () => fetchNotifications(false);
      window.addEventListener("notificationUpdated", handleExternalUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("notificationUpdated", handleExternalUpdate);
      };
    }
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
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

          // Trigger a global event to notify other components (like the Header)
          window.dispatchEvent(new Event("notificationUpdated"));
        } else {
          console.error("Failed to mark notification as read:", data.error);
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [user?.id]
  );

  const markAllAsRead = useCallback(async () => {
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

        // Trigger a global event to notify other components (like the Header)
        window.dispatchEvent(new Event("notificationUpdated"));
      } else {
        console.error("Failed to mark all notifications as read:", data.error);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_created":
        return "ri-file-add-line text-blue-600";
      case "request_approved":
        return "ri-checkbox-circle-line text-green-600";
      case "request_rejected":
        return "ri-close-circle-line text-red-600";
      case "transfer_request":
        return "ri-exchange-line text-purple-600";
      case "disposal_request":
        return "ri-delete-bin-line text-orange-600";
      case "supplier_application":
        return "ri-user-add-line text-teal-600";
      default:
        return "ri-notification-line text-gray-600";
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case "request_created":
        return "bg-blue-100";
      case "request_approved":
        return "bg-green-100";
      case "request_rejected":
        return "bg-red-100";
      case "transfer_request":
        return "bg-purple-100";
      case "disposal_request":
        return "bg-orange-100";
      case "supplier_application":
        return "bg-teal-100";
      default:
        return "bg-gray-100";
    }
  };

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.is_read) {
        markAsRead(notification.id);
      }

      // Navigate to related item if available
      if (notification.related_id) {
        let path = "";
        switch (notification.related_type) {
          case "asset_request":
            path = `/requests/${notification.related_id}`;
            break;
          case "transfer_request":
            path = `/transfers/${notification.related_id}`;
            break;
          case "disposal_request":
            path = `/disposals/${notification.related_id}`;
            break;
          case "supplier_application":
            path = `/suppliers/${notification.related_id}`;
            break;
          default:
            // No navigation for this type or related_type is missing
            break;
        }
        if (path) {
          router.push(path);
        }
      }
    },
    [markAsRead, router]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1">
                You have {unreadCount} unread notifications
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={isManualFetching || isPolling}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <i
                className={`ri-refresh-line ${
                  isManualFetching || isPolling ? "animate-spin" : ""
                }`}
              ></i>
              <span>{isManualFetching ? "Refreshing..." : "Refresh"}</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Mark All as Read
              </button>
            )}
            <Link
              href="/dashboard"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {isManualFetching && !loading && (
          <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded flex items-center">
            <i className="ri-loader-4-line animate-spin mr-2"></i>
            Refreshing notifications...
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-notification-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600">
              When you receive notifications, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.is_read
                    ? "border-l-blue-500 bg-blue-50"
                    : "border-l-gray-200"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getNotificationBgColor(
                        notification.type
                      )}`}
                    >
                      <i
                        className={`${getNotificationIcon(
                          notification.type
                        )} text-xl`}
                      ></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-semibold ${
                              !notification.is_read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                            <span>{notification.time_ago}</span>
                            <span>•</span>
                            <span className="capitalize">
                              {notification.type.replace("_", " ")}
                            </span>
                            {notification.related_type && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 hover:text-blue-800">
                                  Click to view details
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                          {!notification.is_read && (
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {notification.is_read ? (
                              <i className="ri-mail-open-line text-lg"></i>
                            ) : (
                              <i className="ri-mail-line text-lg"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
