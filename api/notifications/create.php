<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['user_id']) ? $input['user_id'] : '';
$title = isset($input['title']) ? $input['title'] : '';
$message = isset($input['message']) ? $input['message'] : '';
$type = isset($input['type']) ? $input['type'] : 'info';
$related_id = isset($input['related_id']) ? $input['related_id'] : null;
$related_type = isset($input['related_type']) ? $input['related_type'] : null;

if (empty($user_id) || empty($title) || empty($message)) {
    echo json_encode([
        'success' => false,
        'error' => 'User ID, title, and message are required'
    ]);
    exit;
}

// Insert notification
$query = "INSERT INTO notifications 
          (user_id, title, message, type, related_id, related_type, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
          RETURNING id";

$params = [$user_id, $title, $message, $type, $related_id, $related_type];

$result = pg_query_params($con, $query, $params);

if (!$result) {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
    exit;
}

$row = pg_fetch_assoc($result);
$notification_id = $row['id'];

echo json_encode([
    'success' => true,
    'message' => 'Notification created successfully',
    'notification_id' => $notification_id
]);

pg_close($con);
