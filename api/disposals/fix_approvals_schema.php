<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');

echo "Fixing disposal_approvals table schema...\n";

// Change approved_by column from UUID to VARCHAR
$alter_query = "ALTER TABLE disposal_approvals ALTER COLUMN approved_by TYPE VARCHAR(255)";
$result = pg_query($con, $alter_query);

if ($result) {
    echo "Successfully changed approved_by column to VARCHAR\n";
} else {
    echo "Failed to change approved_by column: " . pg_last_error($con) . "\n";
}

echo "Schema fix completed!\n";

pg_close($con);
?>
