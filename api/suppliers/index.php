<?php
// File: api/suppliers/index.php
require_once __DIR__ . '/../config/connect.php';

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

    // Get query parameters for filtering
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $county = isset($_GET['county']) ? $_GET['county'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    
    // Build query with optional filters
    $query = "SELECT * FROM suppliers WHERE 1=1";
    $params = [];
    $param_count = 0;

    if ($status) {
        $param_count++;
        $query .= " AND status = $" . $param_count;
        $params[] = $status;
    }

    if ($category) {
        $param_count++;
        $query .= " AND registration_category = $" . $param_count;
        $params[] = $category;
    }

    if ($county) {
        $param_count++;
        $query .= " AND county_of_operation = $" . $param_count;
        $params[] = $county;
    }

    if ($search) {
        $param_count++;
        $query .= " AND (supplier_name ILIKE $" . $param_count . " OR email_address ILIKE $" . $param_count . " OR supply_category ILIKE $" . $param_count . ")";
        $params[] = '%' . $search . '%';
    }

    $query .= " ORDER BY created_at DESC";

    // Execute query
    if (empty($params)) {
        $result = pg_query($con, $query);
    } else {
        $result = pg_query_params($con, $query, $params);
    }

    if (!$result) {
        error_log("Database query failed: " . pg_last_error($con));
        http_response_code(500);
        echo json_encode(["error" => "Database query error"]);
        exit;
    }

    $suppliers = [];
    while ($row = pg_fetch_assoc($result)) {
        $suppliers[] = [
            'id' => $row['id'],
            'name' => $row['supplier_name'],
            'registration_category' => $row['registration_category'],
            'business_registration_number' => $row['business_registration_number'],
            'tax_pin' => $row['tax_pin'],
            'director_name' => $row['director'],
            'director_contact' => $row['director_contact'],
            'county_of_operation' => $row['county_of_operation'],
            'email' => $row['email_address'],
            'supply_category' => $row['supply_category'],
            'status' => $row['status'] ?? 'pending',
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'] ?? $row['created_at']
        ];
    }

    // Get summary statistics
    $stats_query = "
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM suppliers
    ";
    
    $stats_result = pg_query($con, $stats_query);
    $stats = pg_fetch_assoc($stats_result);

    // Return success response
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "suppliers" => $suppliers,
        "statistics" => [
            "total" => (int)$stats['total'],
            "approved" => (int)$stats['approved'],
            "pending" => (int)$stats['pending'],
            "rejected" => (int)$stats['rejected']
        ],
        "count" => count($suppliers)
    ]);

} catch (Exception $e) {
    error_log("Suppliers list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "Internal server error: " . $e->getMessage()
    ]);
}

// Close database connection
if ($con) {
    pg_close($con);
}
?>
