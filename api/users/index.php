<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get filter parameters
$role = isset($_GET['role']) ? $_GET['role'] : '';
$department = isset($_GET['department']) ? $_GET['department'] : '';
$search = isset($_GET['search']) ? $_GET['search'] : '';
$is_active = isset($_GET['is_active']) ? $_GET['is_active'] : '';

// Build query with filters
$query = "SELECT id, email, name, role, department, is_active, created_at, updated_at FROM users WHERE 1=1";
$params = [];
$param_count = 0;

if ($role) {
    $param_count++;
    $query .= " AND role = $" . $param_count;
    $params[] = $role;
}

if ($department) {
    $param_count++;
    $query .= " AND department = $" . $param_count;
    $params[] = $department;
}

if ($search) {
    $param_count++;
    $query .= " AND (name ILIKE $" . $param_count . " OR email ILIKE $" . $param_count . ")";
    $params[] = '%' . $search . '%';
}

if ($is_active !== '') {
    $param_count++;
    $query .= " AND is_active = $" . $param_count;
    $params[] = $is_active === 'true' ? 't' : 'f';
}

$query .= " ORDER BY created_at DESC";

// Execute query
if (empty($params)) {
    $result = @pg_query($con, $query);
} else {
    $result = @pg_query_params($con, $query, $params);
}

if (!$result) {
    echo json_encode(['success' => false, 'error' => pg_last_error($con)]);
    exit;
}

$users = [];
while ($row = pg_fetch_assoc($result)) {
    $users[] = [
        'id' => $row['id'],
        'email' => $row['email'],
        'name' => $row['name'],
        'role' => $row['role'],
        'department' => $row['department'],
        'is_active' => $row['is_active'] === 't',
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}

// Get statistics
$stats_query = "
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'procurement_officer' THEN 1 END) as procurement_officers,
        COUNT(CASE WHEN role = 'department_head' THEN 1 END) as department_heads,
        COUNT(CASE WHEN role = 'supplier' THEN 1 END) as suppliers
    FROM users
";

$stats_result = @pg_query($con, $stats_query);
$stats = pg_fetch_assoc($stats_result);

echo json_encode([
    'success' => true,
    'users' => $users,
    'statistics' => [
        'total' => (int)$stats['total'],
        'active' => (int)$stats['active'],
        'admins' => (int)$stats['admins'],
        'procurement_officers' => (int)$stats['procurement_officers'],
        'department_heads' => (int)$stats['department_heads'],
        'suppliers' => (int)$stats['suppliers']
    ]
]);

pg_close($con);
