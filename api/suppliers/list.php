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
if ($category) {
    $query = "SELECT * FROM suppliers WHERE registration_category = $1";
    $result = pg_query_params($con, $query, [$category]);
} else {
    $query = "SELECT * FROM suppliers ORDER BY created_at DESC";
    $result = pg_query($con, $query);
}

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
