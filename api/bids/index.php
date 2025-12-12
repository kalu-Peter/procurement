<?php
require_once '../../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$query = "
    SELECT
        b.id,
        t.title as tender_title,
        s.name as supplier_name,
        b.bid_amount,
        b.notes,
        b.created_at as submitted_at
    FROM
        bids b
    JOIN
        tenders t ON b.tender_id = t.id
    JOIN
        suppliers s ON b.supplier_id = s.id
    ORDER BY
        b.created_at DESC
";

$result = pg_query($con, $query);

if ($result) {
    $bids = pg_fetch_all($result);
    echo json_encode([
        'success' => true,
        'bids' => $bids ? $bids : []
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
}

pg_close($con);
?>
