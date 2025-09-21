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
    die("Connection to PostgreSQL failed: " . pg_last_error());
}
?>
