<?php
// --- Robust Error Handling & Logging ---
ini_set('display_errors', 0);
error_reporting(E_ALL);

$logFile = __DIR__ . '/import_log.txt';
// Clear log file at the start of a new request.
file_put_contents($logFile, "Script start at " . date('Y-m-d H:i:s') . "\n");

// This function will handle FATAL errors
register_shutdown_function(function () use ($logFile) {
    $error = error_get_last();
    file_put_contents($logFile, "Shutdown function executed.\n", FILE_APPEND);

    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $errorMsg = "Fatal Error: [{$error['type']}] {$error['message']} in {$error['file']} on line {$error['line']}\n";
        file_put_contents($logFile, $errorMsg, FILE_APPEND);

        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
        }
        // Attempt to send JSON response, though it may fail if output has already started.
        echo json_encode([
            'success' => false,
            'error' => 'A fatal server error occurred during import. Check server logs.',
            'details' => $errorMsg
        ]);
    } else {
        file_put_contents($logFile, "Script finished without fatal errors.\n", FILE_APPEND);
    }
});

// This function will handle non-fatal errors (warnings, notices)
set_error_handler(function($severity, $message, $file, $line) use ($logFile) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    $errorMsg = "Warning/Notice: [$severity] $message in $file on line $line\n";
    file_put_contents($logFile, $errorMsg, FILE_APPEND);
    
    // Don't exit on warnings, just log them. The script might be able to continue.
    return true; // Suppress default PHP handler
});

require_once '../config/connect.php';
require_once '../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date; // Crucial for converting Excel dates

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

// Get user information for department-based access control
$user_role = $_POST['user_role'] ?? '';
$user_department = $_POST['user_department'] ?? '';
$is_restricted_user = ($user_role !== 'admin' && $user_department !== 'Procurement' && !empty($user_department));

/**
 * Helper function to safely format Excel dates for PostgreSQL
 */
function formatExcelDate($value)
{
    if (empty($value)) return null;

    // Case 1: Value is an Excel Serial Number (e.g., 45321)
    if (is_numeric($value)) {
        try {
            // Convert Excel serial to DateTime object
            $dateObj = Date::excelToDateTimeObject($value);
            return $dateObj->format('Y-m-d');
        } catch (Exception $e) {
            return null; // Fallback if conversion fails
        }
    }

    // Case 2: Value is likely a string (e.g., "2024-01-15" or "01/15/2024")
    // Attempt to parse string to Y-m-d
    try {
        $timestamp = strtotime($value);
        if ($timestamp) {
            return date('Y-m-d', $timestamp);
        }
    } catch (Exception $e) {
        return null;
    }

    return null;
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

        // Skip completely empty rows
        if (empty(array_filter($row, function ($v) {
            return $v !== null && trim($v) !== '';
        }))) {
            continue;
        }

        // Extract department from the row - from template, this is at index 2
        $asset_department = isset($row[2]) ? trim($row[2]) : '';

        // Validate department access for restricted users
        if ($is_restricted_user) {
            // For restricted users, force assets to be in their department
            $asset_department = $user_department;
        }

        // Validate required fields
        if (empty($row[0])) { // Name is required
            $failed++;
            $errors[] = "Row " . ($i + 1) . ": Asset name is required";
            continue;
        }

        if (empty($asset_department)) {
            $failed++;
            $errors[] = "Row " . ($i + 1) . ": Department is required";
            continue;
        }

        // Process Data Fields
        $name = trim($row[0]);
        $category = isset($row[1]) ? trim($row[1]) : '';
        // Department is already handled above
        $brand = !empty($row[3]) ? trim($row[3]) : null;
        $model = !empty($row[4]) ? trim($row[4]) : null;
        $serial = !empty($row[5]) ? trim($row[5]) : null;

        // Handle Date conversion safely
        $purchase_date = formatExcelDate($row[6] ?? null);

        // Handle Numeric fields (Price) - ensure empty strings become NULL
        $purchase_price = (!empty($row[7]) && is_numeric($row[7])) ? floatval($row[7]) : null;

        $condition = !empty($row[8]) ? trim($row[8]) : 'Good';
        $location = !empty($row[9]) ? trim($row[9]) : null;
        $description = !empty($row[10]) ? trim($row[10]) : null;
        $current_value = $purchase_price; // Default to purchase price

        $created_at = date('Y-m-d H:i:s');

        // Map Excel columns to database fields
        $query = "INSERT INTO assets (
            name, category, department, brand, model, serial_number, 
            purchase_date, purchase_price, condition, location, description, 
            current_value, status, asset_tag, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)";

        $params = [
            $name,              // 1. name
            $category,          // 2. category
            $asset_department,  // 3. department
            $brand,             // 4. brand
            $model,             // 5. model
            $serial,            // 6. serial_number
            $purchase_date,     // 7. purchase_date (Cleaned)
            $purchase_price,    // 8. purchase_price (Float or Null)
            $condition,         // 9. condition
            $location,          // 10. location
            $description,       // 11. description
            $current_value,     // 12. current_value
            'Active',           // 13. status
            '',                 // 14. asset_tag (Default empty, assuming not unique/required)
            $created_at,        // 15. created_at
            $created_at         // 16. updated_at
        ];

        // Execute Query
        $result = pg_query_params($con, $query, $params);

        if ($result) {
            $imported++;
        } else {
            $failed++;
            // Capture the specific PostgreSQL error for debugging
            $pgError = pg_last_error($con);
            // Clean up error message for frontend display if it's too technical, or leave as is
            $errors[] = "Row " . ($i + 1) . ": Database Error - " . $pgError;
        }
    }

    echo json_encode([
        'success' => true,
        'imported' => $imported,
        'failed' => $failed,
        'errors' => $errors
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to process Excel file: ' . $e->getMessage()
    ]);
}

pg_close($con);
