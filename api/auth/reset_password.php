<?php
require_once __DIR__ . '/../config/connect.php';

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? '';
$new_password = $input['password'] ?? '';

if (!$token || !$new_password) {
    http_response_code(400);
    echo json_encode(['error' => 'Token and new password are required']);
    exit;
}

try {
    // Find token
    $query = "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() LIMIT 1";
    $res = pg_query_params($con, $query, [$token]);
    if (!$res || pg_num_rows($res) === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    $row = pg_fetch_assoc($res);
    $email = $row['email'];

    // Update user's password
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    $update = "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id, email, name, role";
    $u = pg_query_params($con, $update, [$password_hash, $email]);
    if (!$u) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update password']);
        exit;
    }

    // Optionally delete used tokens
    $del = "DELETE FROM password_resets WHERE email = $1";
    pg_query_params($con, $del, [$email]);

    echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
    exit;

} catch (Exception $e) {
    error_log('reset_password error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
    exit;
}

?>
