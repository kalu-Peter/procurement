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
        // Get all POs or specific PO
        $po_id = $_GET['id'] ?? null;
        $status = $_GET['status'] ?? null;
        $user_id = $_GET['user_id'] ?? null;

        if ($po_id) {
            // Get specific PO with items
            $query = "
                SELECT po.*, 
                       array_agg(
                           json_build_object(
                               'id', poi.id,
                               'asset_name', poi.asset_name,
                               'description', poi.description,
                               'quantity', poi.quantity,
                               'unit_price', poi.unit_price,
                               'line_total', poi.line_total,
                               'uom', poi.uom
                           )
                       ) as items
                FROM purchase_orders po
                LEFT JOIN po_items poi ON po.id = poi.po_id
                WHERE po.id = \$1
                GROUP BY po.id
            ";
            $result = pg_query_params($con, $query, array($po_id));
        } else {
            // Get all POs with optional filters
            $params = array();
            $conditions = array();
            $counter = 1;

            $query = "
                SELECT po.id, po.po_number, po.status, po.supplier_name, 
                       po.total_amount, po.po_date, po.expected_delivery_date
                FROM purchase_orders po
                WHERE 1=1
            ";

            if ($status) {
                $conditions[] = "po.status = \$" . $counter;
                $params[] = $status;
                $counter++;
            }

            if ($user_id) {
                $conditions[] = "po.created_by = \$" . $counter;
                $params[] = $user_id;
                $counter++;
            }

            if (!empty($conditions)) {
                $query .= " AND " . implode(" AND ", $conditions);
            }

            $query .= " ORDER BY po.created_at DESC LIMIT 100";

            if (empty($params)) {
                $result = pg_query($con, $query);
            } else {
                $result = pg_query_params($con, $query, $params);
            }
        }

        if (!$result) {
            throw new Exception("Query error: " . pg_last_error($con));
        }

        $pos = [];
        while ($row = pg_fetch_assoc($result)) {
            if (isset($row['items']) && $row['items'] !== 'NULL') {
                $row['items'] = json_decode($row['items'], true) ?? array();
            } else {
                $row['items'] = array();
            }
            $pos[] = $row;
        }

        echo json_encode([
            'success' => true,
            'pos' => $pos,
            'count' => count($pos)
        ]);
    } elseif ($method === 'POST') {
        // Create new PO from approved request
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['request_id', 'supplier_name', 'created_by', 'created_by_name'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Generate PO number
        $po_number = 'PO-' . date('YmdHis') . '-' . rand(1000, 9999);

        // Get request details
        $request_query = "SELECT * FROM asset_requests WHERE id = \$1";
        $request_result = pg_query_params($con, $request_query, array($data['request_id']));
        $request = pg_fetch_assoc($request_result);

        if (!$request) {
            throw new Exception("Request not found");
        }

        // Insert PO
        $po_id = uniqid('PO_', true);
        $insert_po = "
            INSERT INTO purchase_orders (
                id, po_number, request_id, supplier_name, supplier_email,
                created_by, created_by_name, department, expected_delivery_date,
                total_amount, payment_terms, delivery_address, notes, status
            ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \$12, \$13, 'draft')
        ";

        $params = array(
            $po_id,
            $po_number,
            $data['request_id'],
            $data['supplier_name'],
            $data['supplier_email'] ?? null,
            $data['created_by'],
            $data['created_by_name'],
            $request['requester_department'] ?? null,
            $data['expected_delivery_date'] ?? null,
            $data['total_amount'] ?? null,
            $data['payment_terms'] ?? null,
            $data['delivery_address'] ?? null,
            $data['notes'] ?? null
        );

        $po_result = pg_query_params($con, $insert_po, $params);

        if (!$po_result) {
            throw new Exception("Error creating PO: " . pg_last_error($con));
        }

        // Insert PO line items
        if (isset($data['items']) && is_array($data['items'])) {
            $insert_item = "
                INSERT INTO po_items (
                    id, po_id, asset_name, asset_category, description,
                    quantity, unit_price, line_total, uom, delivery_date
                ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10)
            ";

            foreach ($data['items'] as $item) {
                $item_id = uniqid('POI_', true);
                $line_total = ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);

                $item_params = array(
                    $item_id,
                    $po_id,
                    $item['asset_name'],
                    $item['asset_category'] ?? null,
                    $item['description'] ?? null,
                    $item['quantity'],
                    $item['unit_price'],
                    $line_total,
                    $item['uom'] ?? 'Unit',
                    $item['delivery_date'] ?? null
                );

                $item_result = pg_query_params($con, $insert_item, $item_params);

                if (!$item_result) {
                    throw new Exception("Error creating PO item: " . pg_last_error($con));
                }
            }
        }

        // Update request status
        $update_request = "UPDATE asset_requests SET status = 'fulfilled' WHERE id = \$1";
        pg_query_params($con, $update_request, array($data['request_id']));

        echo json_encode([
            'success' => true,
            'message' => 'Purchase Order created successfully',
            'po_id' => $po_id,
            'po_number' => $po_number
        ]);
    } elseif ($method === 'PUT') {
        // Update PO status
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id']) || !isset($data['status'])) {
            throw new Exception("Missing required fields: id, status");
        }

        $valid_statuses = ['draft', 'generated', 'sent', 'acknowledged', 'partial', 'received', 'cancelled'];
        if (!in_array($data['status'], $valid_statuses)) {
            throw new Exception("Invalid status");
        }

        $update_query = "UPDATE purchase_orders SET status = \$1, updated_at = CURRENT_TIMESTAMP WHERE id = \$2";
        $result = pg_query_params($con, $update_query, array($data['status'], $data['id']));

        if (!$result) {
            throw new Exception("Error updating PO: " . pg_last_error($con));
        }

        echo json_encode([
            'success' => true,
            'message' => 'Purchase Order updated successfully'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
