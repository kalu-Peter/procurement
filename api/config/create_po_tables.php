<?php
header('Content-Type: application/json');
require_once 'connect.php';

try {
    // Create purchase_orders table
    $sql_purchase_orders = "
    CREATE TABLE IF NOT EXISTS purchase_orders (
        id VARCHAR(36) PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE NOT NULL,
        request_id VARCHAR(36),
        supplier_id INT,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_email VARCHAR(255),
        created_by VARCHAR(36) NOT NULL,
        created_by_name VARCHAR(255),
        department VARCHAR(255),
        po_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expected_delivery_date DATE,
        total_amount DECIMAL(12, 2),
        currency VARCHAR(3) DEFAULT 'KES',
        status VARCHAR(50) DEFAULT 'draft',
        payment_terms VARCHAR(255),
        delivery_address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
    CREATE INDEX IF NOT EXISTS idx_status ON purchase_orders(status);
    CREATE INDEX IF NOT EXISTS idx_created_by ON purchase_orders(created_by);
    ";

    // Create po_items table
    $sql_po_items = "
    CREATE TABLE IF NOT EXISTS po_items (
        id VARCHAR(36) PRIMARY KEY,
        po_id VARCHAR(36) NOT NULL,
        asset_name VARCHAR(255) NOT NULL,
        asset_category VARCHAR(255),
        description TEXT,
        quantity INT NOT NULL,
        unit_price DECIMAL(12, 2) NOT NULL,
        line_total DECIMAL(12, 2),
        uom VARCHAR(50),
        delivery_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON po_items(po_id);
    ";

    // Create goods_receipts table for three-way match
    $sql_goods_receipts = "
    CREATE TABLE IF NOT EXISTS goods_receipts (
        id VARCHAR(36) PRIMARY KEY,
        gr_number VARCHAR(50) UNIQUE NOT NULL,
        po_id VARCHAR(36) NOT NULL,
        received_by VARCHAR(36) NOT NULL,
        received_by_name VARCHAR(255),
        receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_received_amount DECIMAL(12, 2),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_gr_number ON goods_receipts(gr_number);
    CREATE INDEX IF NOT EXISTS idx_gr_po_id ON goods_receipts(po_id);
    CREATE INDEX IF NOT EXISTS idx_gr_status ON goods_receipts(status);
    ";

    // Create gr_items table for detailed goods receipt line items
    $sql_gr_items = "
    CREATE TABLE IF NOT EXISTS gr_items (
        id VARCHAR(36) PRIMARY KEY,
        gr_id VARCHAR(36) NOT NULL,
        po_item_id VARCHAR(36),
        asset_name VARCHAR(255) NOT NULL,
        quantity_ordered INT NOT NULL,
        quantity_received INT NOT NULL,
        quantity_accepted INT NOT NULL,
        quantity_rejected INT NOT NULL DEFAULT 0,
        unit_price DECIMAL(12, 2),
        line_total DECIMAL(12, 2),
        condition_notes TEXT,
        inspection_status VARCHAR(50) DEFAULT 'pass',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gr_id) REFERENCES goods_receipts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_gr_items_gr_id ON gr_items(gr_id);
    ";

    // Create po_dispatch_log table for tracking PO sending
    $sql_po_dispatch = "
    CREATE TABLE IF NOT EXISTS po_dispatch_log (
        id VARCHAR(36) PRIMARY KEY,
        po_id VARCHAR(36) NOT NULL,
        dispatch_type VARCHAR(50) DEFAULT 'email',
        recipient_email VARCHAR(255),
        dispatch_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        response_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
    );
    CREATE INDEX IF NOT EXISTS idx_po_dispatch_po_id ON po_dispatch_log(po_id);
    CREATE INDEX IF NOT EXISTS idx_po_dispatch_status ON po_dispatch_log(status);
    ";

    // Execute all table creation queries
    $results = [];
    $errors = [];

    // Execute purchase_orders table
    if (pg_query($con, $sql_purchase_orders)) {
        $results[] = 'purchase_orders table created successfully';
    } else {
        $errors[] = 'purchase_orders: ' . pg_last_error($con);
    }

    // Execute po_items table
    if (pg_query($con, $sql_po_items)) {
        $results[] = 'po_items table created successfully';
    } else {
        $errors[] = 'po_items: ' . pg_last_error($con);
    }

    // Execute goods_receipts table
    if (pg_query($con, $sql_goods_receipts)) {
        $results[] = 'goods_receipts table created successfully';
    } else {
        $errors[] = 'goods_receipts: ' . pg_last_error($con);
    }

    // Execute gr_items table
    if (pg_query($con, $sql_gr_items)) {
        $results[] = 'gr_items table created successfully';
    } else {
        $errors[] = 'gr_items: ' . pg_last_error($con);
    }

    // Execute po_dispatch_log table
    if (pg_query($con, $sql_po_dispatch)) {
        $results[] = 'po_dispatch_log table created successfully';
    } else {
        $errors[] = 'po_dispatch_log: ' . pg_last_error($con);
    }

    if (count($errors) === 0) {
        echo json_encode([
            'success' => true,
            'message' => 'All Purchase Order tables created successfully',
            'tables' => [
                'purchase_orders',
                'po_items',
                'goods_receipts',
                'gr_items',
                'po_dispatch_log'
            ],
            'details' => $results
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error creating tables',
            'errors' => $errors,
            'created' => $results
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Exception occurred',
        'error' => $e->getMessage()
    ]);
}
