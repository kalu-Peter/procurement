<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
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

if (!$data || !isset($data['asset_id']) || !isset($data['action']) || !isset($data['source_type'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$asset_id = $data['asset_id'];
$action = $data['action']; // 'approve' or 'reject'
$source_type = $data['source_type']; // 'automatic' or 'manual'
$disposal_request_id = $data['disposal_request_id'] ?? null;
$approved_by = $data['approved_by'] ?? null;
$notes = $data['notes'] ?? null;

// Start transaction
pg_query($con, "BEGIN");

try {
    if ($source_type === 'automatic') {
        // Handle automatic disposal (asset with Disposal Pending status)
        if ($action === 'approve') {
            // Update asset status to Disposed
            $asset_update = "UPDATE assets SET status = 'Disposed', updated_at = NOW() WHERE id = $1";
            $asset_result = pg_query_params($con, $asset_update, [$asset_id]);
            
            if (!$asset_result) {
                throw new Exception('Failed to update asset status');
            }
        } else if ($action === 'reject') {
            // Update asset status back to Active
            $asset_update = "UPDATE assets SET status = 'Active', updated_at = NOW() WHERE id = $1";
            $asset_result = pg_query_params($con, $asset_update, [$asset_id]);
            
            if (!$asset_result) {
                throw new Exception('Failed to update asset status');
            }
        }
    } else if ($source_type === 'manual') {
        // Handle manual disposal request
        if ($action === 'approve') {
            // Update disposal request status
            $request_update = "UPDATE disposal_requests SET status = 'Approved' WHERE id = $1";
            $request_result = pg_query_params($con, $request_update, [$disposal_request_id]);
            
            if (!$request_result) {
                throw new Exception('Failed to update disposal request');
            }
            
            // Update asset status to Disposed
            $asset_update = "UPDATE assets SET status = 'Disposed', updated_at = NOW() WHERE id = $1";
            $asset_result = pg_query_params($con, $asset_update, [$asset_id]);
            
            if (!$asset_result) {
                throw new Exception('Failed to update asset status');
            }
        } else if ($action === 'reject') {
            // Update disposal request status
            $request_update = "UPDATE disposal_requests SET status = 'Rejected' WHERE id = $1";
            $request_result = pg_query_params($con, $request_update, [$disposal_request_id]);
            
            if (!$request_result) {
                throw new Exception('Failed to update disposal request');
            }
        }
    }
    
    // Record the approval action in disposal_approvals table
    $approval_insert = "
        INSERT INTO disposal_approvals (asset_id, disposal_type, disposal_request_id, approved_by, approval_action, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
    ";
    $approval_params = [
        $asset_id,
        $source_type,
        $disposal_request_id,
        $approved_by,
        $action === 'approve' ? 'approved' : 'rejected',
        $notes
    ];
    
    $approval_result = pg_query_params($con, $approval_insert, $approval_params);
    
    if (!$approval_result) {
        throw new Exception('Failed to record approval action');
    }
    
    // Commit transaction
    pg_query($con, "COMMIT");
    
    echo json_encode([
        'success' => true,
        'message' => 'Disposal ' . ($action === 'approve' ? 'approved' : 'rejected') . ' successfully'
    ]);
    
} catch (Exception $e) {
    // Rollback transaction
    pg_query($con, "ROLLBACK");
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

pg_close($con);
?>
