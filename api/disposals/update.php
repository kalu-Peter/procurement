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

$query = "UPDATE disposal_requests 
          SET status = $1 
          WHERE id = $2";

$params = [
    $data['status'],
    $data['id']
];

$result = pg_query_params($con, $query, $params);

if ($result) {
    // If approved, update the asset status to 'Disposed'
    if ($data['status'] === 'Approved') {
        // Get disposal details first
        $disposal_query = "SELECT asset_id FROM disposal_requests WHERE id = $1";
        $disposal_result = pg_query_params($con, $disposal_query, [$data['id']]);
        
        if ($disposal_row = pg_fetch_assoc($disposal_result)) {
            // Update asset status
            $asset_update = "UPDATE assets SET status = 'Disposed' WHERE id = $1";
            pg_query_params($con, $asset_update, [$disposal_row['asset_id']]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Disposal request updated successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => pg_last_error($con)
    ]);
}

pg_close($con);
?>
