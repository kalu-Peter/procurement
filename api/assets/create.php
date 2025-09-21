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

// Generate UUID for asset ID
$asset_id = bin2hex(random_bytes(16));
$asset_id = substr($asset_id, 0, 8) . '-' . substr($asset_id, 8, 4) . '-' . substr($asset_id, 12, 4) . '-' . substr($asset_id, 16, 4) . '-' . substr($asset_id, 20);

// Set default values
$status = $data['status'] ?? 'Active';
$current_value = $data['current_value'] ?? $data['purchase_price'];
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
    $data['purchase_price'] ?? null,
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

$result = pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Asset created successfully',
        'asset_id' => $asset_id
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
}

pg_close($con);
?>