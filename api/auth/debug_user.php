<?php
require_once __DIR__ . '/../config/connect.php';
header('Content-Type: application/json');
$email = $_GET['email'] ?? 'admin@tum.ac.ke';
$res = pg_query_params($con, 'SELECT id, email, name, role, is_active, password_hash FROM users WHERE email = $1', [$email]);
if (!$res) {
    echo json_encode(['error' => pg_last_error($con)]);
    exit;
}
$row = pg_fetch_assoc($res);
echo json_encode($row ?: ['error' => 'not found']);
?>
