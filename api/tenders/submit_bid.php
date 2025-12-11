<?php
require_once '../../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

$query = "INSERT INTO bids (
    tender_id, supplier_id, bid_amount, notes
) VALUES ($1, $2, $3, $4)";

$params = [
    $data['tender_id'],
    $data['supplier_id'],
    $data['bid_amount'],
    $data['notes']
];

$result = pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Bid submitted successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
}

pg_close($con);
?>
