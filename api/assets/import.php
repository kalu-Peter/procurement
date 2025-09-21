<?php
require_once '../config/connect.php';
require_once '../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!isset($_FILES['excel_file'])) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

try {
    $spreadsheet = IOFactory::load($_FILES['excel_file']['tmp_name']);
    $sheet = $spreadsheet->getActiveSheet();
    $rows = $sheet->toArray();

    $imported = 0;
    $failed = 0;
    $errors = [];

    // Skip header row (assuming first row contains headers)
    for ($i = 1; $i < count($rows); $i++) {
        $row = $rows[$i];
        
        // Skip empty rows
        if (empty(array_filter($row))) {
            continue;
        }

        // Generate UUID for asset ID
        $asset_id = bin2hex(random_bytes(16));
        $asset_id = substr($asset_id, 0, 8) . '-' . substr($asset_id, 8, 4) . '-' . substr($asset_id, 12, 4) . '-' . substr($asset_id, 16, 4) . '-' . substr($asset_id, 20);
        
        $created_at = date('Y-m-d H:i:s');
        
        // Map Excel columns to database fields
        $query = "INSERT INTO assets (
            id, asset_tag, name, category, department, description,
            purchase_date, purchase_price, current_value, condition,
            location, serial_number, model, brand, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)";

        $params = [
            $asset_id,
            $row[0] ?? '', // Asset Tag (auto-generated if empty)
            $row[1] ?? '', // Name
            $row[2] ?? '', // Category
            $row[3] ?? '', // Department
            $row[4] ?? null, // Description
            !empty($row[5]) ? $row[5] : null, // Purchase Date
            !empty($row[6]) ? floatval($row[6]) : null, // Purchase Price
            !empty($row[7]) ? floatval($row[7]) : (!empty($row[6]) ? floatval($row[6]) : null), // Current Value
            $row[8] ?? 'Good', // Condition
            $row[9] ?? null, // Location
            $row[10] ?? null, // Serial Number
            $row[11] ?? null, // Model
            $row[12] ?? null, // Brand
            $row[13] ?? 'Active', // Status
            $created_at,
            $created_at
        ];

        $result = pg_query_params($con, $query, $params);
        
        if ($result) {
            $imported++;
        } else {
            $failed++;
            $errors[] = "Row " . ($i + 1) . ": " . pg_last_error($con);
        }
    }

    echo json_encode([
        'success' => true,
        'imported' => $imported,
        'failed' => $failed,
        'errors' => $errors
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to process Excel file: ' . $e->getMessage()
    ]);
}

pg_close($con);
?>