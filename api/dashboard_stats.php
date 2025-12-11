<?php
require_once __DIR__ . '/config/connect.php';

// Set CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours cache

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 204 No Content');
    exit();
}

header("Content-Type: application/json");

// Allow only GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed"]);
    exit;
}

try {
    // Check database connection
    if (!$con) {
        error_log("Database connection failed: " . pg_last_error());
        http_response_code(500);
        echo json_encode(["error" => "Database connection error"]);
        exit;
    }

    // Get total assets count (excluding deleted)
    $assets_query = "SELECT COUNT(*) as total FROM assets WHERE (status IS NULL OR status != 'Deleted')";
    $assets_result = pg_query($con, $assets_query);
    $total_assets = 0;

    if ($assets_result) {
        $assets_row = pg_fetch_assoc($assets_result);
        $total_assets = (int)$assets_row['total'];
    }

    // Get total asset value
    $asset_value_query = "SELECT SUM(current_value) as total_value FROM assets WHERE (status IS NULL OR status != 'Deleted')";
    $asset_value_result = pg_query($con, $asset_value_query);
    $total_asset_value = 0;

    if ($asset_value_result) {
        $asset_value_row = pg_fetch_assoc($asset_value_result);
        $total_asset_value = (float)$asset_value_row['total_value'];
    }

    // Get active transfers count (pending status)
    // table used in transfer endpoints: transfer_requests, status uses 'Pending'
    $transfers_query = "SELECT COUNT(*) as total FROM transfer_requests WHERE status = 'Pending'";
    // suppress warnings from pg_query if table does not exist and handle result explicitly
    $transfers_result = @pg_query($con, $transfers_query);
    $active_transfers = 0;

    if ($transfers_result) {
        $transfers_row = pg_fetch_assoc($transfers_result);
        $active_transfers = (int)$transfers_row['total'];
    } else {
        error_log('dashboard_stats: transfers query failed: ' . pg_last_error($con));
        $active_transfers = 0;
    }

    // Get pending disposals count
    // disposal requests are stored in disposal_requests, status uses 'Pending'
    $disposals_query = "SELECT COUNT(*) as total FROM disposal_requests WHERE status = 'Pending'";
    $disposals_result = @pg_query($con, $disposals_query);
    $pending_disposals = 0;

    if ($disposals_result) {
        $disposals_row = pg_fetch_assoc($disposals_result);
        $pending_disposals = (int)$disposals_row['total'];
    } else {
        error_log('dashboard_stats: disposals query failed: ' . pg_last_error($con));
        $pending_disposals = 0;
    }

    // Return dashboard statistics
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "statistics" => [
            "total_assets" => $total_assets,
            "total_asset_value" => $total_asset_value,
            "active_transfers" => $active_transfers,
            "pending_disposals" => $pending_disposals
        ]
    ]);
} catch (Exception $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "Internal server error: " . $e->getMessage()
    ]);
}

// Close database connection
if ($con) {
    pg_close($con);
}
