<?php
// File: api/auth/login.php
require_once __DIR__ . '/../config/connect.php';

// Set CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours cache

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 204 No Content');
    exit();
}

header("Content-Type: application/json");

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed"]);
    exit;
}

// Decode incoming JSON data
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Validate inputs
if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Email and password are required"]);
    exit;
}

// Query user by email
try {
    // Check if connection is valid
    if (!$con) {
        error_log("Database connection failed: " . pg_last_error());
        http_response_code(500);
        echo json_encode(["error" => "Database connection error"]);
        exit;
    }

    $query = "SELECT * FROM users WHERE email = $1 AND is_active = true";
    $result = pg_query_params($con, $query, [$email]);

    if (!$result) {
        http_response_code(500);
        echo json_encode(["error" => "Database error"]);
        exit;
    }

    $user = pg_fetch_assoc($result);
    if (!$user || !isset($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid email or password"]);
        exit;
    }

    // Remove sensitive fields before returning user
    unset($user['password_hash']);

    echo json_encode([
        "success" => true,
        "user" => $user
    ]);

} catch (Exception $e) {
    error_log("Login exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
    exit;
}

// Clean up
if (isset($result) && $result) {
    pg_free_result($result);
}
if (isset($con) && $con) {
    pg_close($con);
}
?>
