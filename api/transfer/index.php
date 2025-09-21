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
$status = isset($_GET['status']) ? $_GET['status'] : '';

// Build the query with filters
$query = "SELECT tr.*, a.name as asset_name, a.asset_tag 
          FROM transfer_requests tr 
          LEFT JOIN assets a ON tr.asset_id = a.id::text 
          WHERE 1=1";
$params = [];

if (!empty($status)) {
    $query .= " AND tr.status = $" . (count($params) + 1);
    $params[] = $status;
}

$query .= " ORDER BY tr.request_date DESC";

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

$transfers = [];
while ($row = pg_fetch_assoc($result)) {
    $transfers[] = $row;
}

echo json_encode([
    'success' => true,
    'transfers' => $transfers
]);

pg_close($con);
?>
