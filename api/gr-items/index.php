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
        // Get GR items
        $gr_id = $_GET['gr_id'] ?? null;
        $item_id = $_GET['id'] ?? null;

        if ($item_id) {
            // Get specific item
            $query = "SELECT * FROM gr_items WHERE id = \$1";
            $result = pg_query_params($con, $query, array($item_id));
        } elseif ($gr_id) {
            // Get all items for a GR
            $query = "SELECT * FROM gr_items WHERE gr_id = \$1 ORDER BY created_at";
            $result = pg_query_params($con, $query, array($gr_id));
        } else {
            // Get all items
            $query = "SELECT * FROM gr_items ORDER BY created_at DESC LIMIT 500";
            $result = pg_query($con, $query);
        }

        if (!$result) {
            throw new Exception("Query error: " . pg_last_error($con));
        }

        $items = [];
        while ($row = pg_fetch_assoc($result)) {
            $items[] = $row;
        }

        echo json_encode([
            'success' => true,
            'items' => $items,
            'count' => count($items)
        ]);

    } elseif ($method === 'PUT') {
        // Update GR item
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id'])) {
            throw new Exception("Missing required field: id");
        }

        $update_fields = [];
        $params = [];
        $counter = 1;

        if (isset($data['quantity_received'])) {
            $update_fields[] = "quantity_received = \$" . $counter;
            $params[] = $data['quantity_received'];
            $counter++;

            // Auto-calculate accepted/rejected
            $get_item = "SELECT quantity_ordered FROM gr_items WHERE id = \$1";
            $result = pg_query_params($con, $get_item, array($data['id']));
            $item = pg_fetch_assoc($result);
            
            $qty_received = $data['quantity_received'];
            $qty_ordered = $item['quantity_ordered'];
            
            $update_fields[] = "quantity_accepted = \$" . $counter;
            $params[] = $qty_received;
            $counter++;
            
            $update_fields[] = "quantity_rejected = \$" . $counter;
            $params[] = $qty_ordered - $qty_received;
            $counter++;
        }

        if (isset($data['inspection_status'])) {
            $update_fields[] = "inspection_status = \$" . $counter;
            $params[] = $data['inspection_status'];
            $counter++;
        }

        if (isset($data['condition_notes'])) {
            $update_fields[] = "condition_notes = \$" . $counter;
            $params[] = $data['condition_notes'];
            $counter++;
        }

        $update_fields[] = "updated_at = CURRENT_TIMESTAMP";

        $update_query = "UPDATE gr_items SET " . implode(", ", $update_fields) . " WHERE id = \$" . $counter;
        $params[] = $data['id'];

        $result = pg_query_params($con, $update_query, $params);

        if (!$result) {
            throw new Exception("Error updating GR item: " . pg_last_error($con));
        }

        // Get gr_id to update GR total
        $get_gr = "SELECT gr_id FROM gr_items WHERE id = \$1";
        $gr_result = pg_query_params($con, $get_gr, array($data['id']));
        $gr_item = pg_fetch_assoc($gr_result);

        // Auto-update GR total received amount and status
        if ($gr_item) {
            $update_gr = "
                UPDATE goods_receipts 
                SET total_received_amount = (SELECT SUM(line_total) FROM gr_items WHERE gr_id = \$1),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = \$1
            ";
            pg_query_params($con, $update_gr, array($gr_item['gr_id']));

            // Also update associated PO status if all items received
            $check_gr = "SELECT po_id FROM goods_receipts WHERE id = \$1";
            $check_result = pg_query_params($con, $check_gr, array($gr_item['gr_id']));
            $gr = pg_fetch_assoc($check_result);

            if ($gr) {
                $get_po = "SELECT total_amount FROM purchase_orders WHERE id = \$1";
                $po_result = pg_query_params($con, $get_po, array($gr['po_id']));
                $po = pg_fetch_assoc($po_result);

                $get_total_received = "SELECT COALESCE(SUM(line_total), 0) as total FROM gr_items WHERE gr_id = \$1";
                $total_result = pg_query_params($con, $get_total_received, array($gr_item['gr_id']));
                $total = pg_fetch_assoc($total_result);

                $received_percentage = ($total['total'] / $po['total_amount']) * 100;
                
                if ($received_percentage >= 100) {
                    $new_status = 'received';
                } elseif ($received_percentage > 0) {
                    $new_status = 'partial';
                } else {
                    $new_status = 'sent';
                }

                $update_po = "UPDATE purchase_orders SET status = \$1, updated_at = CURRENT_TIMESTAMP WHERE id = \$2";
                pg_query_params($con, $update_po, array($new_status, $gr['po_id']));
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'GR item updated successfully'
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
