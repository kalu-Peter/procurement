<?php
require_once __DIR__ . '/../config/connect.php';
header('Content-Type: application/json');
$res = pg_query($con, 'SELECT id, email, token, expires_at, created_at FROM password_resets ORDER BY created_at DESC LIMIT 50');
$rows = [];
if ($res) {
    while ($r = pg_fetch_assoc($res)) {
        $rows[] = $r;
    }
}
echo json_encode($rows);
?>
