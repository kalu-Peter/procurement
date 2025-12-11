<?php
require_once 'connect.php';

$query = "
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    user_email VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
";

$result = pg_query($con, $query);

if ($result) {
    echo "Table 'activity_logs' created successfully.\n";
} else {
    echo "Error creating table: " . pg_last_error($con) . "\n";
}

pg_close($con);
?>
