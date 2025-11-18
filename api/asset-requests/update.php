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

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
if (!isset($data['id']) || empty($data['id'])) {
    echo json_encode(['success' => false, 'error' => 'Request ID is required']);
    exit;
}

if (!isset($data['action']) || !in_array($data['action'], ['approve', 'reject'])) {
    echo json_encode(['success' => false, 'error' => 'Valid action (approve/reject) is required']);
    exit;
}

// Validate admin access
$user_role = $data['user_role'] ?? '';
$admin_id = $data['admin_id'] ?? '';

if ($user_role !== 'admin' && $user_role !== 'procurement_officer') {
    echo json_encode([
        'success' => false,
        'error' => 'Access denied. Only admins can approve/reject requests.'
    ]);
    exit;
}

if (empty($admin_id)) {
    echo json_encode(['success' => false, 'error' => 'Admin ID is required']);
    exit;
}

// First, check if the request exists and is still pending
$check_query = "SELECT id, status, requester_id, requester_name, asset_name FROM asset_requests WHERE id = $1";
$check_result = pg_query_params($con, $check_query, [$data['id']]);

if (!$check_result || pg_num_rows($check_result) === 0) {
    echo json_encode(['success' => false, 'error' => 'Request not found']);
    exit;
}

$request = pg_fetch_assoc($check_result);

if ($request['status'] !== 'pending') {
    echo json_encode([
        'success' => false,
        'error' => 'Request has already been ' . $request['status']
    ]);
    exit;
}

// Build update query based on action
$action = $data['action'];
$admin_notes = $data['admin_notes'] ?? '';
$current_time = date('Y-m-d H:i:s');

if ($action === 'approve') {
    $new_status = 'approved';
    $query = "UPDATE asset_requests SET 
        status = $1, 
        admin_notes = $2, 
        approved_by = $3, 
        approved_at = $4, 
        updated_at = $5 
        WHERE id = $6";
    $params = [$new_status, $admin_notes, $admin_id, $current_time, $current_time, $data['id']];
} else {
    $new_status = 'rejected';
    $query = "UPDATE asset_requests SET 
        status = $1, 
        admin_notes = $2, 
        rejected_by = $3, 
        rejected_at = $4, 
        updated_at = $5 
        WHERE id = $6";
    $params = [$new_status, $admin_notes, $admin_id, $current_time, $current_time, $data['id']];
}

$result = @pg_query_params($con, $query, $params);

if ($result) {
    // Create notification for the requester
    $notification_title = $action === 'approve' ? 'Asset Request Approved' : 'Asset Request Rejected';
    $notification_message = $action === 'approve'
        ? "Your request for '{$request['asset_name']}' has been approved." . (!empty($admin_notes) ? " Admin notes: {$admin_notes}" : "")
        : "Your request for '{$request['asset_name']}' has been rejected." . (!empty($admin_notes) ? " Reason: {$admin_notes}" : "");

    $notification_type = $action === 'approve' ? 'request_approved' : 'request_rejected';

    // Insert notification
    $notif_query = "INSERT INTO notifications 
                   (user_id, title, message, type, related_id, related_type, created_at, updated_at) 
                   VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())";
    $notif_params = [$request['requester_id'], $notification_title, $notification_message, $notification_type, $data['id'], 'asset_request'];

    // Don't fail the main operation if notification fails
    @pg_query_params($con, $notif_query, $notif_params);

    echo json_encode([
        'success' => true,
        'message' => "Request has been {$new_status} successfully",
        'request_id' => $data['id'],
        'status' => $new_status,
        'requester_name' => $request['requester_name'],
        'asset_name' => $request['asset_name']
    ]);
} else {
    $error = pg_last_error($con);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $error
    ]);
}

pg_close($con);
