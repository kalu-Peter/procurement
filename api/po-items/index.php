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
        // Get PO items
        $po_id = $_GET['po_id'] ?? null;
        $item_id = $_GET['id'] ?? null;

        if ($item_id) {
            // Get specific item
            $query = "SELECT * FROM po_items WHERE id = \$1";
            $result = pg_query_params($con, $query, array($item_id));
        } elseif ($po_id) {
            // Get all items for a PO
            $query = "SELECT * FROM po_items WHERE po_id = \$1 ORDER BY created_at";
            $result = pg_query_params($con, $query, array($po_id));
        } else {
            // Get all items
            $query = "SELECT * FROM po_items ORDER BY created_at DESC LIMIT 500";
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
    } elseif ($method === 'POST') {
        // Create PO item
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['po_id', 'asset_name', 'quantity', 'unit_price'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        $item_id = uniqid('POI_', true);
        $line_total = $data['quantity'] * $data['unit_price'];

        $insert_query = "
            INSERT INTO po_items (
                id, po_id, asset_name, asset_category, description,
                quantity, unit_price, line_total, uom, delivery_date
            ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10)
        ";

        $params = array(
            $item_id,
            $data['po_id'],
            $data['asset_name'],
            $data['asset_category'] ?? null,
            $data['description'] ?? null,
            $data['quantity'],
            $data['unit_price'],
            $line_total,
            $data['uom'] ?? 'Unit',
            $data['delivery_date'] ?? null
        );

        $result = pg_query_params($con, $insert_query, $params);

        if (!$result) {
            throw new Exception("Error creating PO item: " . pg_last_error($con));
        }

        // Auto-update PO total amount
        $update_po = "
            UPDATE purchase_orders 
            SET total_amount = (SELECT SUM(line_total) FROM po_items WHERE po_id = \$1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = \$1
        ";
        pg_query_params($con, $update_po, array($data['po_id']));

        echo json_encode([
            'success' => true,
            'message' => 'PO item created successfully',
            'item_id' => $item_id,
            'line_total' => $line_total
        ]);
    } elseif ($method === 'PUT') {
        // Update PO item
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id'])) {
            throw new Exception("Missing required field: id");
        }

        $update_fields = [];
        $params = [];
        $counter = 1;

        if (isset($data['quantity']) || isset($data['unit_price'])) {
            $get_item = "SELECT po_id FROM po_items WHERE id = \$1";
            $result = pg_query_params($con, $get_item, array($data['id']));
            $item = pg_fetch_assoc($result);

            $quantity = $data['quantity'] ?? 0;
            $unit_price = $data['unit_price'] ?? 0;
            $line_total = $quantity * $unit_price;

            $update_fields[] = "quantity = \$" . $counter;
            $params[] = $quantity;
            $counter++;

            $update_fields[] = "unit_price = \$" . $counter;
            $params[] = $unit_price;
            $counter++;

            $update_fields[] = "line_total = \$" . $counter;
            $params[] = $line_total;
            $counter++;
        }

        if (isset($data['asset_name'])) {
            $update_fields[] = "asset_name = \$" . $counter;
            $params[] = $data['asset_name'];
            $counter++;
        }

        if (isset($data['description'])) {
            $update_fields[] = "description = \$" . $counter;
            $params[] = $data['description'];
            $counter++;
        }

        $update_fields[] = "updated_at = CURRENT_TIMESTAMP";

        $update_query = "UPDATE po_items SET " . implode(", ", $update_fields) . " WHERE id = \$" . $counter;
        $params[] = $data['id'];

        $result = pg_query_params($con, $update_query, $params);

        if (!$result) {
            throw new Exception("Error updating PO item: " . pg_last_error($con));
        }

        // Get po_id to update PO total
        $get_po = "SELECT po_id FROM po_items WHERE id = \$1";
        $po_result = pg_query_params($con, $get_po, array($data['id']));
        $po_item = pg_fetch_assoc($po_result);

        // Auto-update PO total amount
        $update_po = "
            UPDATE purchase_orders 
            SET total_amount = (SELECT SUM(line_total) FROM po_items WHERE po_id = \$1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = \$1
        ";
        pg_query_params($con, $update_po, array($po_item['po_id']));

        echo json_encode([
            'success' => true,
            'message' => 'PO item updated successfully'
        ]);
    } elseif ($method === 'DELETE') {
        // Delete PO item
        $item_id = $_GET['id'] ?? null;

        if (!$item_id) {
            throw new Exception("Missing required parameter: id");
        }

        // Get po_id first
        $get_po = "SELECT po_id FROM po_items WHERE id = \$1";
        $po_result = pg_query_params($con, $get_po, array($item_id));
        $po_item = pg_fetch_assoc($po_result);

        // Delete item
        $delete_query = "DELETE FROM po_items WHERE id = \$1";
        $result = pg_query_params($con, $delete_query, array($item_id));

        if (!$result) {
            throw new Exception("Error deleting PO item: " . pg_last_error($con));
        }

        // Auto-update PO total amount
        if ($po_item) {
            $update_po = "
                UPDATE purchase_orders 
                SET total_amount = COALESCE((SELECT SUM(line_total) FROM po_items WHERE po_id = \$1), 0),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = \$1
            ";
            pg_query_params($con, $update_po, array($po_item['po_id']));
        }

        echo json_encode([
            'success' => true,
            'message' => 'PO item deleted successfully'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

pg_close($con);
