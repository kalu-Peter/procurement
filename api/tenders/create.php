<?php
require_once '../config/connect.php';

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

$tender_number = 'TUM/TDR/' . rand(100, 999) . '/' . date('Y');

$query = "INSERT INTO tenders (
    tender_number, title, description, category, status, budget, deadline
) VALUES ($1, $2, $3, $4, $5, $6, $7)";

$params = [
    $tender_number,
    $data['title'],
    $data['description'],
    $data['category'],
    'open',
    $data['budget'],
    $data['deadline']
];

$result = pg_query_params($con, $query, $params);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Tender created successfully',
        'tender_number' => $tender_number
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
}

pg_close($con);
?>
