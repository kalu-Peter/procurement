<?php
// CORS Headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/connect.php';

$category = $_GET['category'] ?? '';
$status = $_GET['status'] ?? ''; // New status parameter

$conditions = [];
$params = [];
$param_index = 1;

if ($category) {
    $conditions[] = "registration_category = $" . $param_index++;
    $params[] = $category;
}

if ($status) {
    $conditions[] = "status = $" . $param_index++;
    $params[] = $status;
}

$query = "SELECT * FROM suppliers";
if (count($conditions) > 0) {
    $query .= " WHERE " . implode(" AND ", $conditions);
}
$query .= " ORDER BY created_at DESC";


$result = pg_query_params($con, $query, $params);


$suppliers = [];
if ($result) {
    while ($row = pg_fetch_assoc($result)) {
        // Map database fields to expected format
        $suppliers[] = [
            'id' => $row['id'],
            'name' => $row['supplier_name'],
            'email' => $row['email_address'] ?? $row['email'] ?? '',
            'status' => $row['status'] ?? 'pending',
            'category' => $row['registration_category'] ?? null,
        ];
    }
}

// Return proper response format
echo json_encode([
    'success' => true,
    'suppliers' => $suppliers,
    'count' => count($suppliers)
]);
