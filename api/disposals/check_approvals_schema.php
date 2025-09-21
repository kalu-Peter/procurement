<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');

// Check the structure of disposal_approvals table
$query = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'disposal_approvals' ORDER BY ordinal_position";
$result = pg_query($con, $query);

if (!$result) {
    echo json_encode(['error' => pg_last_error($con)]);
    exit;
}

$columns = [];
while ($row = pg_fetch_assoc($result)) {
    $columns[] = $row;
}

echo json_encode(['columns' => $columns], JSON_PRETTY_PRINT);

pg_close($con);
?>
