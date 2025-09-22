<?php
require_once __DIR__ . '/../config/connect.php';
header('Content-Type: application/json');
$email = $_GET['email'] ?? 'admin@tum.ac.ke';
$plain = $_GET['p'] ?? '';
$res = pg_query_params($con, 'SELECT password_hash FROM users WHERE email = $1', [$email]);
$row = pg_fetch_assoc($res);
if (!$row) { echo json_encode(['error'=>'user not found']); exit; }
$hash = $row['password_hash'];
$ok = password_verify($plain, $hash);
echo json_encode(['email'=>$email,'password'=>$plain,'matches'=>$ok,'hash'=>$hash]);
?>
