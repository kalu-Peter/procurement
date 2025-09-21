<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get department filter for regular users
$department = isset($_GET['department']) ? $_GET['department'] : '';
$user_role = isset($_GET['user_role']) ? $_GET['user_role'] : '';

// Build query for assets that can be disposed manually
// These should be assets that are not already in disposal pending status
// and should exclude assets with Good condition
$query = "SELECT * FROM assets 
          WHERE (status IS NULL OR status NOT IN ('Deleted', 'Disposal Pending')) 
          AND condition IN ('Poor', 'Obsolete', 'Fair')";

$params = [];

// Add department filter for non-admin users
if (!empty($department) && $user_role !== 'admin') {
    $query .= " AND department = $" . (count($params) + 1);
    $params[] = $department;
}

$query .= " ORDER BY condition DESC, name ASC";

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
