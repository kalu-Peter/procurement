<?php
header('Content-Type: application/json');

// Test asset requests API
echo "Testing Asset Requests API:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/asset-requests/index.php?status=approved&user_role=admin");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
echo "Count: " . count($data['requests'] ?? []) . "\n";
echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
if (count($data['requests'] ?? []) > 0) {
    echo "First request: " . $data['requests'][0]['asset_name'] . "\n";
}
echo "\n";

// Test suppliers API
echo "Testing Suppliers API:\n";
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/suppliers/list.php");
$response = curl_exec($ch);
$data = json_decode($response, true);
echo "Count: " . count($data['suppliers'] ?? []) . "\n";
echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
if (count($data['suppliers'] ?? []) > 0) {
    echo "First supplier: " . $data['suppliers'][0]['name'] . "\n";
    echo "First supplier ID type: " . gettype($data['suppliers'][0]['id']) . "\n";
}
curl_close($ch);
