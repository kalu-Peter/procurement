<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Mock test data for department dashboard
$department = isset($_GET['department']) ? $_GET['department'] : 'IT';

$mockStats = [
    'success' => true,
    'department' => $department,
    'stats' => [
        'total_assets' => 15,
        'active_requests' => 3, // Asset requests (1) + Transfer requests (1) + Disposal requests (1)
        'pending_approvals' => 3, // Same as active for department head
        'breakdown' => [
            'asset_requests' => [
                'pending' => 1,
                'approved' => 2,
                'rejected' => 0
            ],
            'transfer_requests' => [
                'pending' => 1,
                'approved' => 1,
                'rejected' => 0
            ],
            'disposal_requests' => [
                'pending' => 1,
                'approved' => 1,
                'rejected' => 0
            ]
        ]
    ]
];

echo json_encode($mockStats);
