<?php
require_once '../config/connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Create notifications table if it doesn't exist
$createTableQuery = "
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    related_id UUID NULL,
    related_type VARCHAR(50) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

$createResult = pg_query($con, $createTableQuery);
if (!$createResult) {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create notifications table: ' . pg_last_error($con)
    ]);
    exit;
}

// Create index for better performance
$createIndexQuery = "
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
";
pg_query($con, $createIndexQuery);

echo json_encode([
    'success' => true,
    'message' => 'Notifications table created successfully'
]);

pg_close($con);
