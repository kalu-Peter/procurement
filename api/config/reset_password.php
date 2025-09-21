<?php
require_once 'connect.php';

if ($con) {
    // New password to set
    $new_password = "admin123"; // This will be the new password
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    $query = "UPDATE users 
              SET password_hash = $1, 
                  updated_at = CURRENT_TIMESTAMP 
              WHERE email = $2 
              RETURNING id, email, name, role";
    
    $result = pg_query_params($con, $query, [$password_hash, 'admin@tum.ac.ke']);
    
    if ($result) {
        $user = pg_fetch_assoc($result);
        if ($user) {
            echo "✅ Password updated successfully for:\n";
            echo "Email: " . $user['email'] . "\n";
            echo "Name: " . $user['name'] . "\n";
            echo "Role: " . $user['role'] . "\n";
            echo "\nNew password is: admin123\n";
        } else {
            echo "❌ User not found";
        }
    } else {
        echo "❌ Error updating password: " . pg_last_error($con);
    }
} else {
    echo "❌ Database connection failed: " . pg_last_error();
}

pg_close($con);
?>
