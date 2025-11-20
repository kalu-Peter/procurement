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
        // Get goods receipts with three-way match details
        $po_id = $_GET['po_id'] ?? null;
        $gr_id = $_GET['id'] ?? null;

        if ($gr_id) {
            // Get specific GR with line items and PO details
            $query = "
                SELECT gr.*, po.po_number, po.supplier_name, po.total_amount,
                       array_agg(
                           json_build_object(
                               'id', gri.id,
                               'po_item_id', gri.po_item_id,
                               'asset_name', gri.asset_name,
                               'quantity_ordered', gri.quantity_ordered,
                               'quantity_received', gri.quantity_received,
                               'quantity_accepted', gri.quantity_accepted,
                               'quantity_rejected', gri.quantity_rejected,
                               'unit_price', gri.unit_price,
                               'line_total', gri.line_total,
                               'inspection_status', gri.inspection_status,
                               'condition_notes', gri.condition_notes
                           )
                       ) as items
                FROM goods_receipts gr
                LEFT JOIN purchase_orders po ON gr.po_id = po.id
                LEFT JOIN gr_items gri ON gr.id = gri.gr_id
                WHERE gr.id = \$1
                GROUP BY gr.id, po.po_number, po.supplier_name, po.total_amount
            ";
            $result = pg_query_params($con, $query, array($gr_id));
        } elseif ($po_id) {
            // Get all GRs for a specific PO
            $query = "
                SELECT gr.id, gr.gr_number, gr.status, gr.receipt_date,
                       gr.total_received_amount, COUNT(gri.id) as line_items
                FROM goods_receipts gr
                LEFT JOIN gr_items gri ON gr.id = gri.gr_id
                WHERE gr.po_id = \$1
                GROUP BY gr.id
                ORDER BY gr.receipt_date DESC
            ";
            $result = pg_query_params($con, $query, array($po_id));
        } else {
            // Get all recent GRs
            $query = "
                SELECT gr.*, po.po_number, po.supplier_name
                FROM goods_receipts gr
                LEFT JOIN purchase_orders po ON gr.po_id = po.id
                ORDER BY gr.created_at DESC
                LIMIT 100
            ";
            $result = pg_query($con, $query);
        }

        if (!$result) {
            throw new Exception("Query error: " . pg_last_error($con));
        }

        $grs = [];

        while ($row = pg_fetch_assoc($result)) {
            if (isset($row['items']) && $row['items'] !== 'NULL') {
                $row['items'] = json_decode($row['items'], true) ?? array();
            } else {
                $row['items'] = array();
            }
            $grs[] = $row;
        }

        echo json_encode([
            'success' => true,
            'goods_receipts' => $grs,
            'count' => count($grs)
        ]);
    } elseif ($method === 'POST') {
        // Create goods receipt (three-way match validation)
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['po_id', 'received_by', 'received_by_name'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Generate GR number
        $gr_number = 'GR-' . date('YmdHis') . '-' . rand(1000, 9999);

        // Get PO details
        $po_query = "SELECT * FROM purchase_orders WHERE id = \$1";
        $po_result = pg_query_params($con, $po_query, array($data['po_id']));
        $po = pg_fetch_assoc($po_result);

        if (!$po) {
            throw new Exception("Purchase Order not found");
        }

        // Create Goods Receipt
        $gr_id = uniqid('GR_', true);
        $total_received = 0;

        $insert_gr = "
            INSERT INTO goods_receipts (
                id, gr_number, po_id, received_by, received_by_name, status, notes
            ) VALUES (\$1, \$2, \$3, \$4, \$5, 'pending', \$6)
        ";

        $gr_params = array(
            $gr_id,
            $gr_number,
            $data['po_id'],
            $data['received_by'],
            $data['received_by_name'],
            $data['notes'] ?? null
        );

        $gr_result = pg_query_params($con, $insert_gr, $gr_params);

        if (!$gr_result) {
            throw new Exception("Error creating GR: " . pg_last_error($con));
        }

        // Add GR line items with three-way match validation
        if (isset($data['items']) && is_array($data['items'])) {
            $insert_gr_item = "
                INSERT INTO gr_items (
                    id, gr_id, po_item_id, asset_name,
                    quantity_ordered, quantity_received, quantity_accepted,
                    quantity_rejected, unit_price, line_total,
                    inspection_status, condition_notes
                ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \$12)
            ";

            foreach ($data['items'] as $item) {
                $gr_item_id = uniqid('GRI_', true);
                $qty_accepted = $item['quantity_received'] ?? 0;
                $qty_rejected = ($item['quantity_ordered'] ?? 0) - $qty_accepted;
                $line_total = $qty_accepted * ($item['unit_price'] ?? 0);
                $total_received += $line_total;

                $item_params = array(
                    $gr_item_id,
                    $gr_id,
                    $item['po_item_id'],
                    $item['asset_name'],
                    $item['quantity_ordered'],
                    $item['quantity_received'],
                    $qty_accepted,
                    $qty_rejected,
                    $item['unit_price'],
                    $line_total,
                    $item['inspection_status'] ?? 'pass',
                    $item['condition_notes'] ?? null
                );

                $item_result = pg_query_params($con, $insert_gr_item, $item_params);

                if (!$item_result) {
                    throw new Exception("Error creating GR item: " . pg_last_error($con));
                }
            }

            // Update GR with total received amount
            $update_gr = "UPDATE goods_receipts SET total_received_amount = \$1 WHERE id = \$2";
            pg_query_params($con, $update_gr, array($total_received, $gr_id));

            // Update PO status based on received amount
            $received_percentage = ($total_received / $po['total_amount']) * 100;
            if ($received_percentage >= 100) {
                $new_status = 'received';
            } elseif ($received_percentage > 0) {
                $new_status = 'partial';
            } else {
                $new_status = $po['status'];
            }

            $update_po = "UPDATE purchase_orders SET status = \$1 WHERE id = \$2";
            pg_query_params($con, $update_po, array($new_status, $data['po_id']));
        }

        echo json_encode([
            'success' => true,
            'message' => 'Goods Receipt created successfully',
            'gr_id' => $gr_id,
            'gr_number' => $gr_number,
            'three_way_match' => [
                'po_amount' => $po['total_amount'],
                'received_amount' => $total_received,
                'match_percentage' => round(($total_received / $po['total_amount']) * 100, 2),
                'status' => $new_status ?? 'partial'
            ]
        ]);
    } elseif ($method === 'PUT') {
        // Update GR status
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id']) || !isset($data['status'])) {
            throw new Exception("Missing required fields: id, status");
        }

        $valid_statuses = ['pending', 'partial', 'complete', 'accepted', 'rejected'];
        if (!in_array($data['status'], $valid_statuses)) {
            throw new Exception("Invalid status");
        }

        $update_query = "UPDATE goods_receipts SET status = \$1, updated_at = CURRENT_TIMESTAMP WHERE id = \$2";
        $result = pg_query_params($con, $update_query, array($data['status'], $data['id']));

        if (!$result) {
            throw new Exception("Error updating GR: " . pg_last_error($con));
        }

        echo json_encode([
            'success' => true,
            'message' => 'Goods Receipt updated successfully'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
