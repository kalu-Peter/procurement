<?php
// File: api/suppliers/create.php
require_once __DIR__ . '/../config/connect.php';

// Set CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours cache

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 204 No Content');
    exit();
}

header("Content-Type: application/json");

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

    // Decode incoming JSON data
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON data"]);
        exit;
    }

    // Validate required fields
    $required_fields = [
        'name', 'registration_category', 'business_registration_number', 
        'tax_pin', 'tax_compliance_number', 'tax_compliance_date',
        'director_name', 'director_contact', 'county_of_operation',
        'postal_address', 'physical_address', 'email', 'supply_category'
    ];

    $missing_fields = [];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing_fields[] = $field;
        }
    }

    if (!empty($missing_fields)) {
        http_response_code(400);
        echo json_encode([
            "error" => "Missing required fields: " . implode(', ', $missing_fields)
        ]);
        exit;
    }

    // Create suppliers table if it doesn't exist
    $create_table_query = "
        CREATE TABLE IF NOT EXISTS suppliers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            registration_category VARCHAR(50) NOT NULL,
            business_registration_number VARCHAR(100) NOT NULL UNIQUE,
            tax_pin VARCHAR(20) NOT NULL UNIQUE,
            tax_compliance_number VARCHAR(100) NOT NULL,
            tax_compliance_date DATE NOT NULL,
            director_name VARCHAR(255) NOT NULL,
            director_contact VARCHAR(20) NOT NULL,
            county_of_operation VARCHAR(100) NOT NULL,
            business_permit_number VARCHAR(100),
            agpo_certificate_number VARCHAR(100),
            postal_address TEXT NOT NULL,
            physical_address TEXT NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            supply_category TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ";
    
    $result = pg_query($con, $create_table_query);
    if (!$result) {
        error_log("Failed to create suppliers table: " . pg_last_error($con));
        http_response_code(500);
        echo json_encode(["error" => "Database setup error"]);
        exit;
    }

    // Check for existing supplier with same email, tax_pin, or business_registration_number
    $check_query = "
        SELECT id FROM suppliers 
        WHERE email_address = $1 OR tax_pin = $2 OR business_registration_number = $3
    ";
    
    $check_result = pg_query_params($con, $check_query, [
        $data['email'],
        $data['tax_pin'],
        $data['business_registration_number']
    ]);

    if (!$check_result) {
        error_log("Database check query failed: " . pg_last_error($con));
        http_response_code(500);
        echo json_encode(["error" => "Database query error"]);
        exit;
    }

    if (pg_num_rows($check_result) > 0) {
        http_response_code(409);
        echo json_encode([
            "error" => "Supplier already exists with this email, tax PIN, or business registration number"
        ]);
        exit;
    }

    // Insert new supplier
    $insert_query = "
        INSERT INTO suppliers (
            supplier_name, registration_category, business_registration_number, tax_pin,
            tax_compliance_number, tax_compliance_date, director, director_contact,
            county_of_operation, business_permit_number, agpo_certificate_number,
            postal_address, physical_address, email_address, supply_category, status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING id
    ";

    $insert_result = pg_query_params($con, $insert_query, [
        $data['name'],
        $data['registration_category'],
        $data['business_registration_number'],
        $data['tax_pin'],
        $data['tax_compliance_number'],
        $data['tax_compliance_date'],
        $data['director_name'],
        $data['director_contact'],
        $data['county_of_operation'],
        !empty($data['business_permit_number']) ? $data['business_permit_number'] : null,
        !empty($data['agpo_certificate_number']) ? $data['agpo_certificate_number'] : null,
        $data['postal_address'],
        $data['physical_address'],
        $data['email'],
        $data['supply_category'],
        'pending' // default status
    ]);

    if (!$insert_result) {
        error_log("Failed to insert supplier: " . pg_last_error($con));
        http_response_code(500);
        echo json_encode(["error" => "Failed to register supplier"]);
        exit;
    }

    $row = pg_fetch_assoc($insert_result);
    $supplier_id = $row['id'];

    // Return success response
    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Supplier registered successfully",
        "supplier_id" => $supplier_id
    ]);

} catch (Exception $e) {
    error_log("Supplier registration error: " . $e->getMessage());
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
