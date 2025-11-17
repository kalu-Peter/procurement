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
$check_query = "SELECT id, status, requester_name, asset_name FROM asset_requests WHERE id = $1";
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
