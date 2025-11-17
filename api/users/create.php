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

// Validate required fields
$required_fields = ['email', 'name', 'role', 'password'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        echo json_encode(['success' => false, 'error' => "Required field missing: $field"]);
        exit;
    }
}

// Validate role
$valid_roles = ['admin', 'procurement_officer', 'department_head', 'supplier'];
if (!in_array($data['role'], $valid_roles)) {
    echo json_encode(['success' => false, 'error' => 'Invalid role specified']);
    exit;
}

// Validate email format
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email format']);
    exit;
}

// Check if email already exists
$check_query = "SELECT id FROM users WHERE email = $1";
$check_result = @pg_query_params($con, $check_query, [$data['email']]);
if (pg_num_rows($check_result) > 0) {
    echo json_encode(['success' => false, 'error' => 'Email already exists']);
    exit;
}

// Generate UUID for user ID
$user_id = bin2hex(random_bytes(16));
$user_id = substr($user_id, 0, 8) . '-' . substr($user_id, 8, 4) . '-' . substr($user_id, 12, 4) . '-' . substr($user_id, 16, 4) . '-' . substr($user_id, 20);

// Hash password
$password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

$query = "INSERT INTO users (
    id, email, name, role, department, is_active, password_hash, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())";

$params = [
    $user_id,
    trim($data['email']),
    trim($data['name']),
    $data['role'],
    isset($data['department']) ? trim($data['department']) : null,
    isset($data['is_active']) ? $data['is_active'] : true,
    $password_hash
];

$result = @pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'user_id' => $user_id
    ]);
} else {
    $error = pg_last_error($con);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $error
    ]);
}

pg_close($con);
