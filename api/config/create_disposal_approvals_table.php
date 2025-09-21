<?php
require_once 'connect.php';

// Create disposal_approvals table to track approval history
$create_table_query = "
CREATE TABLE IF NOT EXISTS disposal_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    disposal_type VARCHAR(20) NOT NULL CHECK (disposal_type IN ('automatic', 'manual')),
    disposal_request_id UUID NULL REFERENCES disposal_requests(id),
    approved_by UUID NULL,
    approval_action VARCHAR(20) NOT NULL CHECK (approval_action IN ('approved', 'rejected')),
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disposal_approvals_asset_id ON disposal_approvals(asset_id);
CREATE INDEX IF NOT EXISTS idx_disposal_approvals_approval_date ON disposal_approvals(approval_date);
";

$result = pg_query($con, $create_table_query);

if ($result) {
    echo "Disposal approvals table created successfully.\n";
} else {
    echo "Error creating disposal approvals table: " . pg_last_error($con) . "\n";
}

pg_close($con);
?>
