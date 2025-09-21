<?php
require_once 'connect.php';

// Test the disposal API query directly
$type = 'requests';
$department = '';
$status = '';

if ($type === 'requests') {
    // First, build the manual disposal requests query
    $manualQuery = "
        SELECT 
            dr.id,
            dr.asset_id,
            a.name as asset_name,
            a.asset_tag,
            a.department,
            dr.reason,
            dr.method,
            dr.requested_by,
            u.name as requested_by_name,
            dr.status,
            dr.request_date,
            dr.approved_by,
            dr.approved_date,
            'manual' as source_type
        FROM disposal_requests dr 
        LEFT JOIN assets a ON dr.asset_id = a.id 
        LEFT JOIN users u ON dr.requested_by = u.id
        WHERE 1=1";
    
    $params = [];
    $paramCount = 0;

    if (!empty($status)) {
        $paramCount++;
        $manualQuery .= " AND dr.status = $" . $paramCount;
        $params[] = $status;
    }

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
}

echo "Query: " . $query . "\n";
echo "Params: " . json_encode($params) . "\n\n";

// Execute query
if (empty($params)) {
    $result = pg_query($con, $query);
} else {
    $result = pg_query_params($con, $query, $params);
}

if (!$result) {
    echo "Error: " . pg_last_error($con) . "\n";
    exit;
}

$disposals = [];
while ($row = pg_fetch_assoc($result)) {
    $disposals[] = $row;
}

echo "Results:\n";
echo json_encode($disposals, JSON_PRETTY_PRINT);

pg_close($con);
?>
