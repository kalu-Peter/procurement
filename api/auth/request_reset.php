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
$email = trim($input['email'] ?? '');

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

try {
    // Ensure password_resets table exists (simple migration)
    $createTable = "CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    pg_query($con, $createTable);

    // Generate token
    $token = bin2hex(random_bytes(16));
    $expires_at = date('Y-m-d H:i:s', time() + 60 * 60); // 1 hour

    $insert = "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)";
    $res = pg_query_params($con, $insert, [$email, $token, $expires_at]);

    if ($res) {
        // In production you'd email the token link; in dev return token for debugging
        echo json_encode(['success' => true, 'message' => 'Reset token generated', 'token' => $token]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create reset token']);
        exit;
    }

} catch (Exception $e) {
    error_log('request_reset error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
    exit;
}

?>
