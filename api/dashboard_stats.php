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

    // Get active transfers count (pending status)
    $transfers_query = "SELECT COUNT(*) as total FROM transfers WHERE status = 'pending'";
    $transfers_result = pg_query($con, $transfers_query);
    $active_transfers = 0;

    if ($transfers_result) {
        $transfers_row = pg_fetch_assoc($transfers_result);
        $active_transfers = (int)$transfers_row['total'];
    }

    // Get pending disposals count
    $disposals_query = "SELECT COUNT(*) as total FROM disposals WHERE status = 'pending'";
    $disposals_result = pg_query($con, $disposals_query);
    $pending_disposals = 0;

    if ($disposals_result) {
        $disposals_row = pg_fetch_assoc($disposals_result);
        $pending_disposals = (int)$disposals_row['total'];
    }

    // Return dashboard statistics
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "statistics" => [
            "total_assets" => $total_assets,
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
