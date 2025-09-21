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

// Generate UUID for disposal request ID
$request_id = bin2hex(random_bytes(16));
$request_id = substr($request_id, 0, 8) . '-' . substr($request_id, 8, 4) . '-' . substr($request_id, 12, 4) . '-' . substr($request_id, 16, 4) . '-' . substr($request_id, 20);

$query = "INSERT INTO disposal_requests (
    id, asset_id, reason, method, requested_by,
    requested_by_name, status, request_date, sale_amount, 
    recipient_details, notes
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)";

$params = [
    $request_id,
    $data['asset_id'],
    $data['reason'] ?? null,
    $data['method'] ?? null,
    $data['requested_by'],
    $data['requested_by_name'] ?? null,
    'Pending',
    date('Y-m-d H:i:s'),
    isset($data['sale_amount']) && $data['sale_amount'] !== '' ? floatval($data['sale_amount']) : null,
    $data['recipient_details'] ?? null,
    $data['notes'] ?? null
];

$result = pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Disposal request created successfully',
        'request_id' => $request_id
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
}

pg_close($con);
?>