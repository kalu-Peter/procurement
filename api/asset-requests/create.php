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
$required_fields = [
    'requester_id',
    'requester_name',
    'requester_email',
    'requester_department',
    'asset_name',
    'asset_category',
    'justification'
];

foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        echo json_encode(['success' => false, 'error' => "Required field missing: $field"]);
        exit;
    }
}

// Validate user role - only non-admin users should create requests
$user_role = $data['user_role'] ?? '';
if ($user_role === 'admin') {
    echo json_encode([
        'success' => false,
        'error' => 'Admin users should create assets directly. This form is for asset requests only.'
    ]);
    exit;
}

// Validate urgency level
$urgency = $data['urgency'] ?? 'Normal';
$valid_urgencies = ['Low', 'Normal', 'High', 'Critical'];
if (!in_array($urgency, $valid_urgencies)) {
    $urgency = 'Normal';
}

// Validate estimated cost
$estimated_cost = null;
if (isset($data['estimated_cost']) && is_numeric($data['estimated_cost']) && $data['estimated_cost'] > 0) {
    $estimated_cost = floatval($data['estimated_cost']);
}

// Validate expected delivery date
$expected_delivery_date = null;
if (!empty($data['expected_delivery_date'])) {
    $expected_delivery_date = $data['expected_delivery_date'];
}

$query = "INSERT INTO asset_requests (
    requester_id, requester_name, requester_email, requester_department,
    asset_name, asset_category, asset_description, justification,
    estimated_cost, urgency, preferred_vendor, budget_code,
    expected_delivery_date, status, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)";

$created_at = date('Y-m-d H:i:s');

$params = [
    $data['requester_id'],
    $data['requester_name'],
    $data['requester_email'],
    $data['requester_department'],
    $data['asset_name'],
    $data['asset_category'],
    $data['asset_description'] ?? null,
    $data['justification'],
    $estimated_cost,
    $urgency,
    $data['preferred_vendor'] ?? null,
    $data['budget_code'] ?? null,
    $expected_delivery_date,
    'pending',
    $created_at,
    $created_at
];

$result = @pg_query_params($con, $query, $params);

if ($result) {
    // Get the created request ID
    $id_query = "SELECT id FROM asset_requests WHERE requester_id = $1 AND created_at = $2 ORDER BY created_at DESC LIMIT 1";
    $id_result = pg_query_params($con, $id_query, [$data['requester_id'], $created_at]);
    $request_id = null;

    if ($id_result && $row = pg_fetch_assoc($id_result)) {
        $request_id = $row['id'];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Asset request submitted successfully',
        'request_id' => $request_id,
        'status' => 'pending'
    ]);
} else {
    $error = pg_last_error($con);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $error
    ]);
}

pg_close($con);
