<?php
require_once 'connect.php';

if ($con) {
    // Create users array with the new users' data
    $users = [
        [
            'email' => 'procurement@tum.ac.ke',
            'name' => 'Procurement Officer',
            'role' => 'procurement_officer',
            'department' => 'Procurement',
            'password' => 'procurement123'
        ],
        [
            'email' => 'department@tum.ac.ke',
            'name' => 'Department Head',
            'role' => 'department_head',
            'department' => 'Computer Science',
            'password' => 'department123'
        ]
    ];

    foreach ($users as $userData) {
        // Hash the password
        $password_hash = password_hash($userData['password'], PASSWORD_DEFAULT);
        
        // Insert user query
        $query = "INSERT INTO users (
                    id, 
                    email, 
                    name, 
                    role, 
                    department, 
                    is_active, 
                    password_hash, 
                    created_at, 
                    updated_at
                ) VALUES (
                    gen_random_uuid(), 
                    $1, $2, $3, $4, 
                    true, 
                    $5, 
                    CURRENT_TIMESTAMP, 
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (email) DO UPDATE 
                SET password_hash = $5,
                    name = $2,
                    role = $3,
                    department = $4,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, email, name, role, department;";
        
        $result = pg_query_params(
            $con, 
            $query, 
            [
                $userData['email'],
                $userData['name'],
                $userData['role'],
                $userData['department'],
                $password_hash
            ]
        );
        
        if ($result) {
            $user = pg_fetch_assoc($result);
            echo "✅ User created/updated successfully:\n";
            echo "Email: " . $user['email'] . "\n";
            echo "Name: " . $user['name'] . "\n";
            echo "Role: " . $user['role'] . "\n";
            echo "Department: " . $user['department'] . "\n";
            echo "Password: " . $userData['password'] . "\n";
            echo "------------------------\n";
        } else {
            echo "❌ Error creating user: " . $userData['email'] . "\n";
            echo "Error: " . pg_last_error($con) . "\n";
        }
    }
} else {
    echo "❌ Database connection failed: " . pg_last_error();
}

pg_close($con);
?>
