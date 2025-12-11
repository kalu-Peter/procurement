<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'error' => 'Tender ID is required']);
    exit;
}

$id = $_GET['id'];

$query = "SELECT * FROM tenders WHERE id = $1";
$result = pg_query_params($con, $query, [$id]);

if (!$result) {
    echo json_encode(['success' => false, 'error' => pg_last_error($con)]);
    exit;
}

$tender = pg_fetch_assoc($result);

if (!$tender) {
    echo json_encode(['success' => false, 'error' => 'Tender not found']);
    exit;
}

// Fetch tender documents
$docs_query = "SELECT * FROM tender_documents WHERE tender_id = $1";
$docs_result = pg_query_params($con, $docs_query, [$id]);
$documents = pg_fetch_all($docs_result) ?: [];
$tender['documents'] = $documents;

echo json_encode(['success' => true, 'tender' => $tender]);

pg_close($con);
?>
