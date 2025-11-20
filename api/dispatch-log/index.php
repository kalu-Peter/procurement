<?php
// CORS Headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/connect.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Get dispatch logs
        $po_id = $_GET['po_id'] ?? null;
        $status = $_GET['status'] ?? null;

        $params = array();
        $conditions = array();
        $counter = 1;

        $query = "
            SELECT pdl.*, po.po_number, po.supplier_name
            FROM po_dispatch_log pdl
            LEFT JOIN purchase_orders po ON pdl.po_id = po.id
            WHERE 1=1
        ";

        if ($po_id) {
            $conditions[] = "pdl.po_id = \$" . $counter;
            $params[] = $po_id;
            $counter++;
        }

        if ($status) {
            $conditions[] = "pdl.status = \$" . $counter;
            $params[] = $status;
            $counter++;
        }

        if (!empty($conditions)) {
            $query .= " AND " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY pdl.dispatch_date DESC LIMIT 500";

        if (empty($params)) {
            $result = pg_query($con, $query);
        } else {
            $result = pg_query_params($con, $query, $params);
        }

        if (!$result) {
            throw new Exception("Query error: " . pg_last_error($con));
        }

        $dispatch_logs = [];
        while ($row = pg_fetch_assoc($result)) {
            $dispatch_logs[] = $row;
        }

        echo json_encode([
            'success' => true,
            'dispatch_logs' => $dispatch_logs,
            'count' => count($dispatch_logs)
        ]);

    } elseif ($method === 'POST') {
        // Create dispatch log entry
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['po_id', 'recipient_email'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        $dispatch_id = uniqid('DISPATCH_', true);
        $dispatch_type = $data['dispatch_type'] ?? 'email';

        $insert_query = "
            INSERT INTO po_dispatch_log (
                id, po_id, dispatch_type, recipient_email, status, response_notes, error_message
            ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7)
        ";

        $params = array(
            $dispatch_id,
            $data['po_id'],
            $dispatch_type,
            $data['recipient_email'],
            $data['status'] ?? 'pending',
            $data['response_notes'] ?? null,
            $data['error_message'] ?? null
        );

        $result = pg_query_params($con, $insert_query, $params);

        if (!$result) {
            throw new Exception("Error creating dispatch log: " . pg_last_error($con));
        }

        echo json_encode([
            'success' => true,
            'message' => 'Dispatch log created successfully',
            'dispatch_id' => $dispatch_id
        ]);

    } elseif ($method === 'PUT') {
        // Update dispatch log status
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id']) || !isset($data['status'])) {
            throw new Exception("Missing required fields: id, status");
        }

        $valid_statuses = ['pending', 'sent', 'failed', 'bounced'];
        if (!in_array($data['status'], $valid_statuses)) {
            throw new Exception("Invalid status");
        }

        $update_query = "
            UPDATE po_dispatch_log 
            SET status = \$1, 
                response_notes = \$2, 
                error_message = \$3 
            WHERE id = \$4
        ";

        $result = pg_query_params($con, $update_query, array(
            $data['status'],
            $data['response_notes'] ?? null,
            $data['error_message'] ?? null,
            $data['id']
        ));

        if (!$result) {
            throw new Exception("Error updating dispatch log: " . pg_last_error($con));
        }

        echo json_encode([
            'success' => true,
            'message' => 'Dispatch log updated successfully'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

pg_close($con);
?>
