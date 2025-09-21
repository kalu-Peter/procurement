<?php
require_once __DIR__ . '/../config/connect.php';
header("Content-Type: application/json");

$category = $_GET['category'] ?? '';
if ($category) {
    $query = "SELECT * FROM suppliers WHERE registration_category = $1";
    $result = pg_query_params($con, $query, [$category]);
} else {
    $query = "SELECT * FROM suppliers ORDER BY created_at DESC";
    $result = pg_query($con, $query);
}

$suppliers = [];
while ($row = pg_fetch_assoc($result)) {
    $suppliers[] = $row;
}

echo json_encode($suppliers);
?>
