<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id']) || !isset($data['status'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$query = "UPDATE transfer_requests 
          SET status = $1 
          WHERE id = $2";

$params = [
    $data['status'],
    $data['id']
];

$result = @pg_query_params($con, $query, $params);

if ($result) {
    // If approved, we might want to update the asset's department as well
    if ($data['status'] === 'Approved') {
        // Get transfer details first
        $transfer_query = "SELECT asset_id, to_department FROM transfer_requests WHERE id = $1";
        $transfer_result = @pg_query_params($con, $transfer_query, [$data['id']]);

        if ($transfer_row = pg_fetch_assoc($transfer_result)) {
            // Update asset department
            $asset_update = "UPDATE assets SET department = $1 WHERE id = $2";
            @pg_query_params($con, $asset_update, [
                $transfer_row['to_department'],
                $transfer_row['asset_id']
            ]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Transfer request updated successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
}

pg_close($con);
