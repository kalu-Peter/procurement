<?php
// File: /config/connect.php

$host = "localhost";
$port = "5054";
$dbname = "procurementdb";
$user = "postgres"; // change if you're using a different user
$password = "webwiz"; // replace with your actual password

// Connection string
$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";

// Establish connection
$con = pg_connect($conn_string);

if (!$con) {
    // If connection fails, return a JSON error response
    header("Access-Control-Allow-Origin: *"); // Allow all origins for the error message
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed: " . pg_last_error()
    ]);
    exit;
}
?>
