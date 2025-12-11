<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$status = isset($_GET['status']) ? $_GET['status'] : '';

$query = "SELECT * FROM tenders";
$params = [];

if (!empty($status)) {
    $query .= " WHERE status = $1";
    $params[] = $status;
}

$query .= " ORDER BY published_at DESC";

if (empty($params)) {
    $result = pg_query($con, $query);
} else {
    $result = pg_query_params($con, $query, $params);
}

if (!$result) {
    echo json_encode(['success' => false, 'error' => pg_last_error($con)]);
    exit;
}

$tenders = pg_fetch_all($result);

echo json_encode(['success' => true, 'tenders' => $tenders ?: []]);

pg_close($con);
?>
