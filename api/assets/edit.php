<?php
require_once dirname(__DIR__) . '/config/connect.php';

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get single asset for editing
    if (isset($_GET['id'])) {
        $asset_id = $_GET['id'];
        
        $query = "SELECT * FROM assets WHERE id = $1";
        $result = pg_query_params($con, $query, [$asset_id]);
        
        if ($result && pg_num_rows($result) > 0) {
            $asset = pg_fetch_assoc($result);
            echo json_encode([
                'success' => true,
                'asset' => $asset
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Asset not found'
            ]);
        }
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Asset ID is required'
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update asset
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Asset ID is required'
        ]);
        exit;
    }
    
    $asset_id = $input['id'];
    $updates = [];
    $params = [];
    $param_count = 1;
    
    // Build dynamic update query
    $allowed_fields = [
        'name', 'category', 'description', 'condition', 'location', 
        'serial_number', 'model', 'brand', 'current_value', 'status'
    ];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = \$$param_count";
            $params[] = $input[$field];
            $param_count++;
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No valid fields to update'
        ]);
        exit;
    }
    
    // Add updated_at timestamp
    $updates[] = "updated_at = NOW()";
    
    // Add asset_id parameter
    $params[] = $asset_id;
    
    $query = "UPDATE assets SET " . implode(', ', $updates) . " WHERE id = \$$param_count";
    $result = pg_query_params($con, $query, $params);
    
    if ($result) {
        // Check if condition was changed to Obsolete
        if (isset($input['condition']) && $input['condition'] === 'Obsolete') {
            $status_query = "UPDATE assets SET status = 'Disposal Pending', updated_at = NOW() WHERE id = $1";
            pg_query_params($con, $status_query, [$asset_id]);
        }
        
        // Get updated asset
        $select_query = "SELECT * FROM assets WHERE id = $1";
        $select_result = pg_query_params($con, $select_query, [$asset_id]);
        $updated_asset = pg_fetch_assoc($select_result);
        
        echo json_encode([
            'success' => true,
            'message' => 'Asset updated successfully',
            'asset' => $updated_asset
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update asset: ' . pg_last_error($con)
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

pg_close($con);
?>
