<?php
require_once 'connect.php';

$queries = [
    // Create tenders table
    "CREATE TABLE IF NOT EXISTS tenders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tender_number VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'open',
        budget DECIMAL(15, 2),
        deadline TIMESTAMP,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    // Create tender_documents table
    "CREATE TABLE IF NOT EXISTS tender_documents (
        id SERIAL PRIMARY KEY,
        tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
        document_name VARCHAR(255) NOT NULL,
        document_path VARCHAR(255) NOT NULL
    )",

    // Create bids table
    "CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
        supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
        bid_amount DECIMAL(15, 2),
        technical_score INT,
        financial_score INT,
        final_score INT,
        status VARCHAR(50) DEFAULT 'submitted',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
    )"
];

foreach ($queries as $query) {
    if (pg_query($con, $query)) {
        echo "Query executed successfully.\n";
    } else {
        echo "Error executing query: " . pg_last_error($con) . "\n";
    }
}

pg_close($con);
?>
