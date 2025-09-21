<?php
require_once '../config/connect.php';

header('Content-Type: application/json');

// Check if assets table exists (PostgreSQL syntax)
$query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assets'";
$result = pg_query($con, $query);

if (pg_num_rows($result) > 0) {
    // Table exists, show structure
    $structure_query = "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'assets' ORDER BY ordinal_position";
    $structure_result = pg_query($con, $structure_query);
    
    $columns = [];
    while ($row = pg_fetch_assoc($structure_result)) {
        $columns[] = $row;
    }
    
    echo json_encode([
        "status" => "success",
        "table_exists" => true,
        "columns" => $columns
    ]);
} else {
    echo json_encode([
        "status" => "success",
        "table_exists" => false,
        "message" => "Assets table does not exist"
    ]);
}

pg_close($con);
?>
