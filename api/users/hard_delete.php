<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'error' => 'User ID is required']);
    exit;
}

// Check if user exists
$check_query = "SELECT id, role FROM users WHERE id = $1";
$check_result = pg_query_params($con, $check_query, [$data['id']]);

if (!$check_result) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . pg_last_error($con)]);
    exit;
}

if (pg_num_rows($check_result) === 0) {
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

$user_row = pg_fetch_assoc($check_result);

// Prevent deletion of the last admin
if ($user_row['role'] === 'admin') {
    $admin_count_query = "SELECT COUNT(*) as count FROM users WHERE role = 'admin'";
    $admin_count_result = pg_query($con, $admin_count_query);

    if (!$admin_count_result) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . pg_last_error($con)]);
        exit;
    }

    $admin_count = pg_fetch_assoc($admin_count_result);

    if ((int)$admin_count['count'] <= 1) {
        echo json_encode(['success' => false, 'error' => 'Cannot delete the last admin user']);
        exit;
    }
}

// Hard delete - permanently remove from database
$query = "DELETE FROM users WHERE id = $1";
$result = pg_query_params($con, $query, [$data['id']]);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'User permanently deleted'
    ]);
} else {
    $error = pg_last_error($con);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $error
    ]);
}

pg_close($con);
