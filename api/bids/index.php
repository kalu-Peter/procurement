<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once __DIR__ . '/../config/connect.php';

try {
    $query = "
        SELECT
            b.id,
            t.title as tender_title,
            s.supplier_name as supplier_name,
            b.bid_amount,
            b.notes,
                    b.submitted_at as submitted_at
                FROM
                    bids b
                JOIN
                    tenders t ON b.tender_id = t.id
                JOIN
                    suppliers s ON b.supplier_id = s.id
                ORDER BY
                    b.submitted_at DESC    ";

    $result = pg_query($con, $query);

    if ($result) {
        $bids = pg_fetch_all($result);
        echo json_encode([
            'success' => true,
            'bids' => $bids ? $bids : []
        ]);
    } else {
        throw new Exception(pg_last_error($con));
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

pg_close($con);
?>
