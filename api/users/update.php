<?php
// Disable error output to HTML
ini_set('display_errors', 0);
error_reporting(0);

require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['id'])) {
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        exit;
    }

    // Check if user exists
    $check_query = "SELECT id FROM users WHERE id = $1";
    $check_result = @pg_query_params($con, $check_query, [$data['id']]);
    if (pg_num_rows($check_result) === 0) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    // Build update query dynamically
    $update_fields = [];
    $params = [];
    $param_count = 0;

    // Handle updateable fields
    $allowed_fields = ['email', 'name', 'role', 'department', 'is_active'];
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $param_count++;
            if ($field === 'email' && !filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['success' => false, 'error' => 'Invalid email format']);
                exit;
            }
            if ($field === 'role') {
                $valid_roles = ['admin', 'procurement_officer', 'department_head', 'supplier'];
                if (!in_array($data[$field], $valid_roles)) {
                    echo json_encode(['success' => false, 'error' => 'Invalid role specified']);
                    exit;
                }
            }

            // Special handling for boolean fields
            if ($field === 'is_active') {
                // Validate and convert boolean values
                if (!is_bool($data[$field]) && !in_array($data[$field], [0, 1, '0', '1', 'true', 'false'], true)) {
                    echo json_encode(['success' => false, 'error' => 'Invalid boolean value for is_active']);
                    exit;
                }
                $update_fields[] = "$field = $" . $param_count;
                // Convert to PostgreSQL boolean format
                $boolValue = $data[$field];
                if (is_string($boolValue)) {
                    $boolValue = ($boolValue === 'true' || $boolValue === '1');
                }
                $params[] = $boolValue ? 'true' : 'false';
            } else {
                $update_fields[] = "$field = $" . $param_count;
                $params[] = $data[$field];
            }
        }
    }

    // Handle password update if provided
    if (isset($data['password']) && !empty($data['password'])) {
        $param_count++;
        $update_fields[] = "password_hash = $" . $param_count;
        $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    if (empty($update_fields)) {
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }

    // Add updated_at timestamp
    $param_count++;
    $update_fields[] = "updated_at = $" . $param_count;
    $params[] = date('Y-m-d H:i:s');

    // Add user ID for WHERE clause
    $param_count++;
    $params[] = $data['id'];

    $query = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = $" . $param_count;

    $result = @pg_query_params($con, $query, $params);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
    } else {
        $error = pg_last_error($con);
        echo json_encode([
            'success' => false,
            'error' => 'Database error: ' . $error
        ]);
    }

    pg_close($con);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
