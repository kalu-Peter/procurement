<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');

echo "Adding new columns to disposal_requests table...\n";

// Add columns if they don't exist
$columns_to_add = [
    'sale_amount' => 'DECIMAL(12,2)',
    'recipient_details' => 'TEXT',
    'notes' => 'TEXT'
];

foreach ($columns_to_add as $column => $type) {
    // Check if column exists
    $check_query = "SELECT column_name FROM information_schema.columns WHERE table_name = 'disposal_requests' AND column_name = '$column'";
    $check_result = pg_query($con, $check_query);
    
    if (pg_num_rows($check_result) == 0) {
        // Column doesn't exist, add it
        $alter_query = "ALTER TABLE disposal_requests ADD COLUMN $column $type";
        $result = pg_query($con, $alter_query);
        
        if ($result) {
            echo "Added column: $column\n";
        } else {
            echo "Failed to add column $column: " . pg_last_error($con) . "\n";
        }
    } else {
        echo "Column $column already exists\n";
    }
}

echo "Migration completed!\n";

pg_close($con);
?>
