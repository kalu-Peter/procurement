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

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
$required_fields = ['asset_id', 'from_department', 'to_department', 'reason'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        echo json_encode(['success' => false, 'error' => "Required field missing: $field"]);
        exit;
    }
}

// Generate UUID for transfer request ID
$request_id = bin2hex(random_bytes(16));
$request_id = substr($request_id, 0, 8) . '-' . substr($request_id, 8, 4) . '-' . substr($request_id, 12, 4) . '-' . substr($request_id, 16, 4) . '-' . substr($request_id, 20);

// For now, use a default UUID for requested_by
// In production, this should come from the authenticated user session
$default_user_id = '00000000-0000-0000-0000-000000000000';

$query = "INSERT INTO transfer_requests (
    id, asset_id, from_department, to_department, 
    requested_by, requested_by_name, reason, status, request_date
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";

$params = [
    $request_id,
    $data['asset_id'],
    $data['from_department'],
    $data['to_department'],
    $default_user_id,
    $data['requested_by_name'] ?? 'Unknown User',
    $data['reason'],
    'Pending',
    date('Y-m-d H:i:s')
];

$result = @pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Transfer request created successfully',
        'request_id' => $request_id
    ]);
} else {
    $error = pg_last_error($con);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $error
    ]);
}

pg_close($con);
