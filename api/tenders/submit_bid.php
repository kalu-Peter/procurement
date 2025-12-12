<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once __DIR__ . '/../config/connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Log received data
file_put_contents('submit_bid_log.txt', print_r($data, true), FILE_APPEND);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

try {
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
} catch (Exception $e) {
    // Log exception
    file_put_contents('submit_bid_log.txt', $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

pg_close($con);
?>
