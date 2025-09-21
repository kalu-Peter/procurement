<?php
require_once 'connect.php';

// Check the structure of disposal_requests table
$query = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'disposal_requests'";
$result = pg_query($con, $query);

if (!$result) {
    echo "Error: " . pg_last_error($con) . "\n";
    exit;
}

$columns = [];
while ($row = pg_fetch_assoc($result)) {
    $columns[] = $row;
}

echo "Disposal requests table structure:\n";
echo json_encode($columns, JSON_PRETTY_PRINT);

pg_close($con);
?>
