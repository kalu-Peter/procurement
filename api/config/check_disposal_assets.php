<?php
require_once 'connect.php';

// Check for assets with Disposal Pending status
$query = "SELECT id, name, asset_tag, department, status, condition FROM assets WHERE status = 'Disposal Pending'";
$result = pg_query($con, $query);

if (!$result) {
    echo "Error: " . pg_last_error($con) . "\n";
    exit;
}

$assets = [];
while ($row = pg_fetch_assoc($result)) {
    $assets[] = $row;
}

echo "Assets with 'Disposal Pending' status:\n";
echo json_encode($assets, JSON_PRETTY_PRINT);

// Also check all assets with condition = 'Obsolete'
$query2 = "SELECT id, name, asset_tag, department, status, condition FROM assets WHERE condition = 'Obsolete'";
$result2 = pg_query($con, $query2);

if ($result2) {
    $obsoleteAssets = [];
    while ($row = pg_fetch_assoc($result2)) {
        $obsoleteAssets[] = $row;
    }
    
    echo "\n\nAssets with condition 'Obsolete':\n";
    echo json_encode($obsoleteAssets, JSON_PRETTY_PRINT);
}

pg_close($con);
?>
