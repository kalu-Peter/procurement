<?php
require_once __DIR__ . '/../config/connect.php';

// Robust CORS handling: echo back Origin if present (dev), otherwise allow localhost
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// Allow only the dev origin or localhost; in production restrict further
if ($origin && in_array($origin, ['http://localhost:3000', 'http://127.0.0.1:3000'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // fallback to permissive during local development
    header('Access-Control-Allow-Origin: *');
}
header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // No body for OPTIONS
    http_response_code(204);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$providedPassword = $input['password'] ?? null;

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

try {
    // Check user exists
    $q = 'SELECT email FROM users WHERE email = $1 LIMIT 1';
    $r = pg_query_params($con, $q, [$email]);
    if (!$r || pg_num_rows($r) === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Use provided password if present, else generate a new random password
    if ($providedPassword && is_string($providedPassword) && strlen($providedPassword) >= 6) {
        $newPassword = $providedPassword;
    } else {
        $newPassword = bin2hex(random_bytes(6)); // 12 hex chars
    }
    $password_hash = password_hash($newPassword, PASSWORD_DEFAULT);

    $update = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2';
    $u = pg_query_params($con, $update, [$password_hash, $email]);
    if (!$u) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update password']);
        exit;
    }

    // Optionally clear password_resets for this email
    pg_query_params($con, 'DELETE FROM password_resets WHERE email = $1', [$email]);

    // Return the new password in response (dev-only)
    echo json_encode(['success' => true, 'message' => 'Password reset', 'new_password' => $newPassword]);
    exit;

} catch (Exception $e) {
    error_log('instant_reset error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
    exit;
}

?>
