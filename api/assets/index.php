<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get filter parameters
$search = isset($_GET['search']) ? $_GET['search'] : '';
$category = isset($_GET['category']) ? $_GET['category'] : '';
$department = isset($_GET['department']) ? $_GET['department'] : '';
$status = isset($_GET['status']) ? $_GET['status'] : '';

// Build the query with filters
$query = "SELECT * FROM assets WHERE (status IS NULL OR status != 'Deleted')";
$params = [];
$param_types = [];

if (!empty($search)) {
    $query .= " AND (name ILIKE $" . (count($params) + 1) . " OR asset_tag ILIKE $" . (count($params) + 2) . ")";
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}

if (!empty($category)) {
    $query .= " AND category = $" . (count($params) + 1);
    $params[] = $category;
}

if (!empty($department)) {
    $query .= " AND department = $" . (count($params) + 1);
    $params[] = $department;
}

if (!empty($status)) {
    $query .= " AND status = $" . (count($params) + 1);
    $params[] = $status;
}

$query .= " ORDER BY created_at DESC";

// Execute query
if (empty($params)) {
    $result = pg_query($con, $query);
} else {
    $result = pg_query_params($con, $query, $params);
}

if (!$result) {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
    exit;
}

$assets = [];
while ($row = pg_fetch_assoc($result)) {
    $assets[] = $row;
}

echo json_encode([
    'success' => true,
    'assets' => $assets
]);

pg_close($con);
?>