<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$notification_id = isset($input['notification_id']) ? $input['notification_id'] : '';
$user_id = isset($input['user_id']) ? $input['user_id'] : '';
$mark_all = isset($input['mark_all']) ? $input['mark_all'] : false;

if ($mark_all && !empty($user_id)) {
    // Mark all notifications as read for the user
    $query = "UPDATE notifications SET is_read = true, updated_at = NOW() WHERE user_id = $1 AND is_read = false";
    $params = [$user_id];
} elseif (!empty($notification_id)) {
    // Mark specific notification as read
    $query = "UPDATE notifications SET is_read = true, updated_at = NOW() WHERE id = $1";
    $params = [$notification_id];
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Notification ID or user ID with mark_all flag is required'
    ]);
    exit;
}

$result = pg_query_params($con, $query, $params);

if (!$result) {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
    exit;
}

$affected_rows = pg_affected_rows($result);

echo json_encode([
    'success' => true,
    'message' => $mark_all ? 'All notifications marked as read' : 'Notification marked as read',
    'affected_rows' => $affected_rows
]);

pg_close($con);
