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

// Get user information for department-based access control
$user_role = $data['user_role'] ?? '';
$user_department = $data['user_department'] ?? '';

// Validate department access
if ($user_role !== 'admin' && $user_department !== 'Procurement' && !empty($user_department)) {
    // Non-admin, non-procurement users can only create assets for their department
    if (isset($data['department']) && $data['department'] !== $user_department) {
        echo json_encode([
            'success' => false,
            'error' => 'Access denied. You can only create assets for your department: ' . $user_department
        ]);
        exit;
    }
    // If department is not set, default to user's department
    if (!isset($data['department']) || empty($data['department'])) {
        $data['department'] = $user_department;
    }
}

// Generate UUID for asset ID
$asset_id = bin2hex(random_bytes(16));
$asset_id = substr($asset_id, 0, 8) . '-' . substr($asset_id, 8, 4) . '-' . substr($asset_id, 12, 4) . '-' . substr($asset_id, 16, 4) . '-' . substr($asset_id, 20);

// Validate required fields
$required_fields = ['asset_tag', 'name', 'category', 'department'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        echo json_encode(['success' => false, 'error' => "Required field missing: $field"]);
        exit;
    }
}

// Set default values
$status = $data['status'] ?? 'Active';
$purchase_price = $data['purchase_price'] ?? null;
$current_value = $data['current_value'] ?? $purchase_price;
$created_at = date('Y-m-d H:i:s');

$query = "INSERT INTO assets (
    id, asset_tag, name, category, department, description,
    purchase_date, purchase_price, current_value, condition,
    location, serial_number, model, brand, status, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)";

$params = [
    $asset_id,
    $data['asset_tag'],
    $data['name'],
    $data['category'],
    $data['department'],
    $data['description'] ?? null,
    $data['purchase_date'] ?? null,
    $purchase_price,
    $current_value,
    $data['condition'] ?? null,
    $data['location'] ?? null,
    $data['serial_number'] ?? null,
    $data['model'] ?? null,
    $data['brand'] ?? null,
    $status,
    $created_at,
    $created_at
];

$result = @pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Asset created successfully',
        'asset_id' => $asset_id
    ]);
} else {
    $error = pg_last_error($con);
    // Check for duplicate asset tag constraint violation
    if (strpos($error, 'assets_asset_tag_key') !== false) {
        echo json_encode([
            'success' => false,
            'error' => 'Asset tag already exists. Please use a unique asset tag.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Database error: ' . $error
        ]);
    }
}

pg_close($con);
