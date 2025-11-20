<?php
// Test script to verify PO creation

require_once '../config/connect.php';

// Test data
$po_data = [
    'request_id' => '123',
    'supplier_name' => 'Test Supplier',
    'supplier_email' => 'test@supplier.com',
    'created_by' => 'user1',
    'created_by_name' => 'Test User',
    'expected_delivery_date' => '2025-12-25',
    'payment_terms' => '30 days Net',
    'delivery_address' => '123 Test St',
    'notes' => 'Test notes',
    'total_amount' => 50000,
    'items' => [
        [
            'asset_name' => 'Test Asset',
            'asset_category' => 'Laptop',
            'quantity' => 1,
            'unit_price' => 50000,
            'uom' => 'Unit'
        ]
    ]
];

// Check if request exists first
$check_query = "SELECT * FROM asset_requests LIMIT 1";
$check_result = pg_query($con, $check_query);
$sample_request = pg_fetch_assoc($check_result);

if ($sample_request) {
    echo "Found sample request: " . json_encode($sample_request) . "\n\n";
    $po_data['request_id'] = $sample_request['id'];
}

echo "Test data:\n";
echo json_encode($po_data, JSON_PRETTY_PRINT) . "\n\n";

// Try creating a PO
$po_number = 'PO-' . date('YmdHis') . '-' . rand(1000, 9999);
$po_id = uniqid('PO_', true);

echo "Generated PO ID: $po_id\n";
echo "Generated PO Number: $po_number\n\n";

// Insert PO
$insert_po = "
    INSERT INTO purchase_orders (
        id, po_number, request_id, supplier_name, supplier_email,
        created_by, created_by_name, department, expected_delivery_date,
        total_amount, payment_terms, delivery_address, notes, status
    ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \$12, \$13, 'draft')
";

$params = [
    $po_id,
    $po_number,
    $po_data['request_id'],
    $po_data['supplier_name'],
    $po_data['supplier_email'] ?? null,
    $po_data['created_by'],
    $po_data['created_by_name'],
    null,
    $po_data['expected_delivery_date'] ?? null,
    $po_data['total_amount'] ?? null,
    $po_data['payment_terms'] ?? null,
    $po_data['delivery_address'] ?? null,
    $po_data['notes'] ?? null
];

echo "Executing insert query...\n";
$po_result = pg_query_params($con, $insert_po, $params);

if (!$po_result) {
    echo "ERROR: " . pg_last_error($con) . "\n";
} else {
    echo "SUCCESS: PO created\n";
    echo "PO ID: $po_id\n";
    echo "PO Number: $po_number\n";

    // Try to fetch it back
    $fetch_query = "SELECT * FROM purchase_orders WHERE id = \$1";
    $fetch_result = pg_query_params($con, $fetch_query, [$po_id]);
    $created_po = pg_fetch_assoc($fetch_result);

    if ($created_po) {
        echo "\nFetched PO:\n";
        echo json_encode($created_po, JSON_PRETTY_PRINT) . "\n";
    }
}

pg_close($con);
