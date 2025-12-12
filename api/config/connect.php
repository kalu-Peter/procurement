<?php
// File: /config/connect.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = "localhost";
$port = "5054";
$dbname = "procurementdb";
$user = "postgres"; // change if you're using a different user
$password = "webwiz"; // replace with your actual password

// Connection string
$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";

try {
    // Establish connection
    $con = pg_connect($conn_string);

    if (!$con) {
        throw new Exception("Database connection failed: " . pg_last_error());
    }
    // Log success
    file_put_contents('db_connect_log.txt', "Database connection successful\n", FILE_APPEND);

} catch (Exception $e) {
    // Log failure
    file_put_contents('db_connect_log.txt', "Database connection failed: " . $e->getMessage() . "\n", FILE_APPEND);

    // If connection fails, return a JSON error response
    header("Access-Control-Allow-Origin: *"); // Allow all origins for the error message
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
    exit;
}
?>
