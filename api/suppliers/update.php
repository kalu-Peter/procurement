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

if (!$data || !isset($data['id']) || !isset($data['status'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields: id and status']);
    exit;
}

// Validate status
$valid_statuses = ['pending', 'approved', 'rejected'];
if (!in_array($data['status'], $valid_statuses)) {
    echo json_encode(['success' => false, 'error' => 'Invalid status. Must be pending, approved, or rejected']);
    exit;
}

$query = "UPDATE suppliers SET status = $1 WHERE id = $2";
$params = [$data['status'], $data['id']];

$result = @pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Supplier status updated successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . pg_last_error($con)
    ]);
}

pg_close($con);
