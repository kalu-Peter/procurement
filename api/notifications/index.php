<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get user parameters
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : '';
$user_role = isset($_GET['user_role']) ? $_GET['user_role'] : '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$unread_only = isset($_GET['unread_only']) ? $_GET['unread_only'] === 'true' : false;

if (empty($user_id)) {
    echo json_encode([
        'success' => false,
        'error' => 'User ID is required'
    ]);
    exit;
}

// Build query based on user role
$query = "SELECT 
    id, user_id, title, message, type, related_id, related_type, 
    is_read, created_at, updated_at
FROM notifications 
WHERE 1=1";

$params = [];

// Role-based filtering
if ($user_role === 'admin' || $user_role === 'procurement_officer') {
    // Admin and procurement officers see all notifications plus their own
    $query .= " AND (user_id = $" . (count($params) + 1) . " OR type IN ('request_created', 'transfer_request', 'disposal_request'))";
    $params[] = $user_id;
} else {
    // Regular users only see their own notifications
    $query .= " AND user_id = $" . (count($params) + 1);
    $params[] = $user_id;
}

// Filter for unread only if requested
if ($unread_only) {
    $query .= " AND is_read = false";
}

$query .= " ORDER BY created_at DESC LIMIT $" . (count($params) + 1);
$params[] = $limit;

// Execute query
$result = pg_query_params($con, $query, $params);

if (!$result) {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
    exit;
}

$notifications = [];
while ($row = pg_fetch_assoc($result)) {
    // Format the timestamp
    $row['created_at'] = date('c', strtotime($row['created_at']));
    $row['time_ago'] = timeAgo($row['created_at']);
    $notifications[] = $row;
}

// Get unread count
$unreadQuery = "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false";
if ($user_role === 'admin' || $user_role === 'procurement_officer') {
    $unreadQuery = "SELECT COUNT(*) as unread_count FROM notifications 
                   WHERE (user_id = $1 OR type IN ('request_created', 'transfer_request', 'disposal_request')) 
                   AND is_read = false";
}
$unreadResult = pg_query_params($con, $unreadQuery, [$user_id]);
$unreadCount = 0;
if ($unreadResult) {
    $unreadRow = pg_fetch_assoc($unreadResult);
    $unreadCount = (int)$unreadRow['unread_count'];
}

echo json_encode([
    'success' => true,
    'notifications' => $notifications,
    'unread_count' => $unreadCount,
    'total' => count($notifications)
]);

pg_close($con);

// Helper function to calculate time ago
function timeAgo($datetime)
{
    $time = time() - strtotime($datetime);

    if ($time < 60) return 'Just now';
    if ($time < 3600) return floor($time / 60) . ' min ago';
    if ($time < 86400) return floor($time / 3600) . ' hour' . (floor($time / 3600) == 1 ? '' : 's') . ' ago';
    if ($time < 2592000) return floor($time / 86400) . ' day' . (floor($time / 86400) == 1 ? '' : 's') . ' ago';
    if ($time < 31536000) return floor($time / 2592000) . ' month' . (floor($time / 2592000) == 1 ? '' : 's') . ' ago';
    return floor($time / 31536000) . ' year' . (floor($time / 31536000) == 1 ? '' : 's') . ' ago';
}
