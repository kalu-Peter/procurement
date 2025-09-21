<?php
require_once __DIR__ . '/../config/connect.php';

$query = "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'";
$result = pg_query($con, $query);

if ($result) {
    echo "✅ Status column added successfully\n";
} else {
    echo "❌ Error: " . pg_last_error($con) . "\n";
}

// Update existing records to have approved status
$update_query = "UPDATE suppliers SET status = 'approved' WHERE status IS NULL";
$update_result = pg_query($con, $update_query);

if ($update_result) {
    echo "✅ Updated existing records with approved status\n";
} else {
    echo "❌ Error updating records: " . pg_last_error($con) . "\n";
}

pg_close($con);
?>
