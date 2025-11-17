<?php
// Disable error output to HTML
ini_set('display_errors', 0);
error_reporting(0);

require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['id'])) {
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        exit;
    }

    // Check if user exists
    $check_query = "SELECT id, role FROM users WHERE id = $1";
    $check_result = pg_query_params($con, $check_query, [$data['id']]);

    if (!$check_result) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . pg_last_error($con)]);
        exit;
    }

    if (pg_num_rows($check_result) === 0) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    $user_row = pg_fetch_assoc($check_result);

    // Prevent deletion of the last admin
    if ($user_row['role'] === 'admin') {
        $admin_count_query = "SELECT COUNT(*) as count FROM users WHERE role = 'admin'";
        $admin_count_result = pg_query($con, $admin_count_query);

        if (!$admin_count_result) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . pg_last_error($con)]);
            exit;
        }

        $admin_count = pg_fetch_assoc($admin_count_result);

        if ((int)$admin_count['count'] <= 1) {
            echo json_encode(['success' => false, 'error' => 'Cannot delete the last admin user']);
            exit;
        }
    }

    // Check for foreign key dependencies before deletion
    $dependencies = [];

    // Check transfer_requests table
    $transfer_check = "SELECT COUNT(*) as count FROM transfer_requests WHERE requested_by = $1";
    $transfer_result = pg_query_params($con, $transfer_check, [$data['id']]);
    if ($transfer_result) {
        $transfer_count = pg_fetch_assoc($transfer_result);
        if ((int)$transfer_count['count'] > 0) {
            $dependencies[] = "transfer requests (" . $transfer_count['count'] . " records)";
        }
    }

    // Check assets table (if users can be assigned to assets)
    $asset_check = "SELECT COUNT(*) as count FROM assets WHERE assigned_to = $1";
    $asset_result = pg_query_params($con, $asset_check, [$data['id']]);
    if ($asset_result) {
        $asset_count = pg_fetch_assoc($asset_result);
        if ((int)$asset_count['count'] > 0) {
            $dependencies[] = "assigned assets (" . $asset_count['count'] . " records)";
        }
    }

    // Check disposal_approvals table (if it exists)
    $disposal_check = "SELECT COUNT(*) as count FROM disposal_approvals WHERE user_id = $1";
    $disposal_result = pg_query_params($con, $disposal_check, [$data['id']]);
    if ($disposal_result) {
        $disposal_count = pg_fetch_assoc($disposal_result);
        if ((int)$disposal_count['count'] > 0) {
            $dependencies[] = "disposal approvals (" . $disposal_count['count'] . " records)";
        }
    }

    // If there are dependencies, prevent deletion
    if (!empty($dependencies)) {
        $dependency_list = implode(', ', $dependencies);
        echo json_encode([
            'success' => false,
            'error' => "Cannot delete user: This user is referenced in $dependency_list. Please reassign or delete these records first, or use deactivation instead."
        ]);
        exit;
    }

    // Hard delete - permanently remove from database
    $query = "DELETE FROM users WHERE id = $1";
    $result = pg_query_params($con, $query, [$data['id']]);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'User permanently deleted'
        ]);
    } else {
        $error = pg_last_error($con);
        echo json_encode([
            'success' => false,
            'error' => 'Database error: ' . $error
        ]);
    }

    pg_close($con);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
