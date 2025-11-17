<?php
require_once 'connect.php';

// Create asset_requests table
$create_table_query = "
CREATE TABLE IF NOT EXISTS asset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_department VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_category VARCHAR(100) NOT NULL,
    asset_description TEXT,
    justification TEXT NOT NULL,
    estimated_cost DECIMAL(15,2),
    urgency VARCHAR(20) DEFAULT 'Normal' CHECK (urgency IN ('Low', 'Normal', 'High', 'Critical')),
    preferred_vendor VARCHAR(255),
    budget_code VARCHAR(100),
    expected_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
    admin_notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_requests_requester_id ON asset_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_asset_requests_status ON asset_requests(status);
CREATE INDEX IF NOT EXISTS idx_asset_requests_department ON asset_requests(requester_department);
CREATE INDEX IF NOT EXISTS idx_asset_requests_created_at ON asset_requests(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_asset_requests_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_asset_requests_updated_at ON asset_requests;
CREATE TRIGGER update_asset_requests_updated_at
    BEFORE UPDATE ON asset_requests
    FOR EACH ROW EXECUTE FUNCTION update_asset_requests_updated_at();
";

try {
    $result = pg_query($con, $create_table_query);

    if ($result) {
        echo "Asset requests table created successfully!\n";
        echo "Table includes:\n";
        echo "- Request details (name, category, description, justification)\n";
        echo "- Requester information (linked to users table)\n";
        echo "- Financial details (estimated cost, budget code)\n";
        echo "- Approval workflow (status, admin notes, approval tracking)\n";
        echo "- Automatic timestamps and indexing for performance\n";
    } else {
        echo "Error creating table: " . pg_last_error($con) . "\n";
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

pg_close($con);
