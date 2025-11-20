<?php
require_once 'connect.php';

echo "Tables in database:\n";
$result = pg_query($con, "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
while ($row = pg_fetch_assoc($result)) {
    echo "- " . $row['table_name'] . "\n";
}

echo "\nAsset Requests Data:\n";
$requests = pg_query($con, "SELECT COUNT(*) as count FROM asset_requests");
$count = pg_fetch_assoc($requests);
echo "Total requests: " . $count['count'] . "\n";

// Show first 5 requests if any exist
if ($count['count'] > 0) {
    $reqs = pg_query($con, "SELECT id, asset_name, status FROM asset_requests LIMIT 5");
    while ($req = pg_fetch_assoc($reqs)) {
        echo "  - " . $req['id'] . " | " . $req['asset_name'] . " | " . $req['status'] . "\n";
    }
}
