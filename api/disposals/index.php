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
$type = isset($_GET['type']) ? $_GET['type'] : 'requests'; // requests or records
$department = isset($_GET['department']) ? $_GET['department'] : '';
$record_status = isset($_GET['record_status']) ? $_GET['record_status'] : ''; // For filtering records by approved/rejected

// Get user ID and details
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$user_role = '';
$user_department = '';

if ($user_id) {
    $user_query = "SELECT role, department FROM users WHERE id = $1";
    $user_result = pg_query_params($con, $user_query, [$user_id]);
    
    if ($user_result && pg_num_rows($user_result) > 0) {
        $user_details = pg_fetch_assoc($user_result);
        $user_role = $user_details['role'];
        $user_department = $user_details['department'];
    }
}

$is_privileged_user = ($user_role === 'admin' || $user_role === 'procurement_officer');

// If a non-privileged user is trying to access all departments, restrict to their own
if (!$is_privileged_user && empty($department)) {
    $department = $user_department;
}
// If a non-privileged user is trying to access a department that is not their own, block it.
else if (!$is_privileged_user && !empty($department) && $department !== $user_department) {
    echo json_encode(['success' => false, 'error' => 'You are not authorized to view disposals for this department']);
    exit;
}


if ($type === 'requests') {
    // For disposal requests, show only PENDING requests
    // First, build the manual disposal requests query
    $manualQuery = "
        SELECT 
            dr.id::text,
            dr.asset_id::text,
            a.name as asset_name,
            a.asset_tag,
            a.department,
            dr.reason,
            dr.method,
            dr.requested_by::text,
            dr.requested_by_name,
            dr.status,
            dr.request_date,
            NULL as approved_by,
            NULL as approved_date,
            'manual' as source_type
        FROM disposal_requests dr 
        LEFT JOIN assets a ON dr.asset_id = a.id 
        WHERE dr.status = 'Pending'";
    
    $params = [];
    $paramCount = 0;

    if (!empty($department)) {
        $paramCount++;
        $manualQuery .= " AND a.department = $" . $paramCount;
        $params[] = $department;
    }

    // Second, build the automatic disposal query for assets with "Disposal Pending" status
    $automaticQuery = "
        SELECT 
            a.id::text as id,
            a.id::text as asset_id,
            a.name as asset_name,
            a.asset_tag,
            a.department,
            'Asset condition changed to Obsolete' as reason,
            NULL as method,
            NULL as requested_by,
            NULL as requested_by_name,
            'Pending' as status,
            COALESCE(a.updated_at, a.created_at) as request_date,
            NULL as approved_by,
            NULL as approved_date,
            'automatic' as source_type
        FROM assets a 
        WHERE a.status = 'Disposal Pending'";

    if (!empty($department)) {
        $paramCount++;
        $automaticQuery .= " AND a.department = $" . $paramCount;
        $params[] = $department;
    }

    // Combine both queries with UNION ALL
    $query = "(" . $manualQuery . ") UNION ALL (" . $automaticQuery . ") ORDER BY request_date DESC";
} else {
    // For disposal records, show both APPROVED and REJECTED disposal requests plus disposed assets
    $approvedRequestsQuery = "
        SELECT 
            dr.id::text,
            dr.asset_id::text,
            a.name as asset_name,
            a.asset_tag,
            a.department,
            dr.reason,
            dr.method,
            dr.requested_by::text,
            dr.requested_by_name,
            dr.status,
            dr.request_date,
            NULL as approved_by,
            NULL as approved_date,
            'manual' as source_type
        FROM disposal_requests dr 
        LEFT JOIN assets a ON dr.asset_id = a.id 
        WHERE dr.status IN ('Approved', 'Rejected')";
    
    $disposedAssetsQuery = "
        SELECT 
            a.id::text as id,
            a.id::text as asset_id,
            a.name as asset_name,
            a.asset_tag,
            a.department,
            'Asset was disposed after condition became obsolete' as reason,
            NULL as method,
            NULL as requested_by,
            NULL as requested_by_name,
            'Approved' as status,
            COALESCE(a.updated_at, a.created_at) as request_date,
            NULL as approved_by,
            NULL as approved_date,
            'automatic' as source_type
        FROM assets a 
        WHERE a.status = 'Disposed'";
    
    $params = [];
    $paramCount = 0;

    // Add record status filter if specified
    if (!empty($record_status)) {
        if ($record_status === 'approved') {
            $approvedRequestsQuery .= " AND dr.status = 'Approved'";
            // Keep disposed assets query as is (they are considered approved)
        } elseif ($record_status === 'rejected') {
            $approvedRequestsQuery .= " AND dr.status = 'Rejected'";
            // Exclude disposed assets for rejected filter - create empty query with same structure
            $disposedAssetsQuery = "
                SELECT 
                    NULL::text as id,
                    NULL::text as asset_id,
                    NULL as asset_name,
                    NULL as asset_tag,
                    NULL as department,
                    NULL as reason,
                    NULL as method,
                    NULL as requested_by,
                    NULL as requested_by_name,
                    NULL as status,
                    NULL::timestamp as request_date,
                    NULL as approved_by,
                    NULL as approved_date,
                    NULL as source_type
                WHERE FALSE";
        }
    }

    if (!empty($department)) {
        $paramCount++;
        $approvedRequestsQuery .= " AND a.department = $" . $paramCount;
        $disposedAssetsQuery .= " AND a.department = $" . $paramCount;
        $params[] = $department;
    }
    
    // Combine both queries with UNION ALL
    $query = "(" . $approvedRequestsQuery . ") UNION ALL (" . $disposedAssetsQuery . ") ORDER BY request_date DESC";
}

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

$disposals = [];
while ($row = pg_fetch_assoc($result)) {
    $disposals[] = $row;
}

echo json_encode([
    'success' => true,
    'disposals' => $disposals,
    'type' => $type
]);

pg_close($con);
?>
