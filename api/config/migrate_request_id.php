<?php
header('Content-Type: application/json');
require_once 'connect.php';

try {
    // Alter the request_id column to allow NULL values
    $sql = "ALTER TABLE purchase_orders ALTER COLUMN request_id DROP NOT NULL;";

    $result = pg_query($con, $sql);

    if (!$result) {
        throw new Exception("Migration failed: " . pg_last_error($con));
    }

    echo json_encode([
        'success' => true,
        'message' => 'Migration completed: request_id column is now nullable'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
