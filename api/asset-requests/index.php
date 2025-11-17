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
$department = isset($_GET['department']) ? $_GET['department'] : '';
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : '';
$user_role = isset($_GET['user_role']) ? $_GET['user_role'] : '';

// Build the query with filters
$query = "SELECT 
    id, requester_id, requester_name, requester_email, requester_department,
    asset_name, asset_category, asset_description, justification,
    estimated_cost, urgency, preferred_vendor, budget_code,
    expected_delivery_date, status, admin_notes,
    approved_by, approved_at, rejected_by, rejected_at,
    created_at, updated_at
FROM asset_requests WHERE 1=1";

$params = [];

// Apply role-based access control
if ($user_role !== 'admin' && $user_role !== 'procurement_officer') {
    // Non-admin users can only see their own requests
    if (!empty($user_id)) {
        $query .= " AND requester_id = $" . (count($params) + 1);
        $params[] = $user_id;
    } else {
        // If no user_id provided for non-admin, return empty result
        echo json_encode([
            'success' => true,
            'requests' => [],
            'total' => 0,
            'stats' => [
                'pending' => 0,
                'approved' => 0,
                'rejected' => 0,
                'fulfilled' => 0
            ]
        ]);
        exit;
    }
}

// Additional filters
if (!empty($status)) {
    $query .= " AND status = $" . (count($params) + 1);
    $params[] = $status;
}

if (!empty($department)) {
    $query .= " AND requester_department = $" . (count($params) + 1);
    $params[] = $department;
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

$requests = [];
$stats = [
    'pending' => 0,
    'approved' => 0,
    'rejected' => 0,
    'fulfilled' => 0
];

while ($row = pg_fetch_assoc($result)) {
    $requests[] = $row;

    // Count statistics
    if (isset($stats[$row['status']])) {
        $stats[$row['status']]++;
    }
}

echo json_encode([
    'success' => true,
    'requests' => $requests,
    'total' => count($requests),
    'stats' => $stats,
    'access_info' => [
        'user_role' => $user_role,
        'is_admin' => ($user_role === 'admin' || $user_role === 'procurement_officer')
    ]
]);

pg_close($con);
