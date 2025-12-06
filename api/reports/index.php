<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/connect.php';

$reportType = $_GET['reportType'] ?? '';
$period     = $_GET['period'] ?? '';

if (!$reportType || !$period) {
    http_response_code(400);
    echo json_encode(["message" => "Missing reportType or period parameters."]);
    exit();
}



/* ============================================================
   UNIVERSAL DATE FILTER: year:2024 / month:03 / quarter:1
   ============================================================ */
function buildDateFilter($column, $period)
{
    if (!str_contains($period, ":")) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid period format."]);
        exit();
    }

    list($type, $value) = explode(":", $period);

    switch ($type) {
        case "year":
            return "EXTRACT(YEAR FROM $column) = $value";

        case "month":
            return "EXTRACT(MONTH FROM $column) = $value
                    AND EXTRACT(YEAR FROM $column) = EXTRACT(YEAR FROM CURRENT_DATE)";

        case "quarter":
            return "EXTRACT(QUARTER FROM $column) = $value
                    AND EXTRACT(YEAR FROM $column) = EXTRACT(YEAR FROM CURRENT_DATE)";

        default:
            http_response_code(400);
            echo json_encode(["message" => "Invalid period type."]);
            exit();
    }
}


/* ============================================================
   EXECUTE QUERY WRAPPER
   ============================================================ */
function executeQuery($con, $sql)
{
    $result = pg_query($con, $sql);

    if ($result) {
        $data = pg_fetch_all($result);
        http_response_code(200);
        echo json_encode($data ?: []);
    } else {
        http_response_code(500);
        echo json_encode([
            "message" => "Failed to fetch report data.",
            "error" => pg_last_error($con)
        ]);
    }
}



/* ============================================================
   REPORT FUNCTIONS (ALL USING YEAR/MONTH/QUARTER)
   ============================================================ */

function getPurchaseOrderReport($con, $period)
{
    $filter = buildDateFilter("po_date", $period);

    $sql = "SELECT id, po_number, supplier_name, total_amount, status, po_date
            FROM purchase_orders
            WHERE $filter
            ORDER BY po_date DESC";

    executeQuery($con, $sql);
}

function getAssetsDisposalReport($con, $period)
{
    $filter = buildDateFilter("dr.request_date", $period);

    $sql = "SELECT 
                dr.id,
                dr.asset_id,
                dr.reason,
                dr.method,
                dr.status,
                dr.request_date,
                dr.requested_by,
                dr.requested_by_name,
                dr.sale_amount,
                dr.recipient_details,
                dr.notes
            FROM disposal_requests dr
            JOIN assets a ON dr.asset_id = a.id
            WHERE $filter
            ORDER BY dr.request_date DESC";

    executeQuery($con, $sql);
}

function getTransferReport($con, $period)
{
    $filter = buildDateFilter("request_date", $period);

    $sql = "SELECT id, asset_id, from_department, to_department, status, request_date
            FROM transfer_requests
            WHERE $filter
            ORDER BY request_date DESC";

    executeQuery($con, $sql);
}

function getSuppliersPerformanceReport($con, $period)
{
    $filter = buildDateFilter("po.po_date", $period);

    $sql = "SELECT 
                s.supplier_name,
                COUNT(po.id) AS total_orders,
                SUM(po.total_amount) AS total_amount
            FROM suppliers s
            JOIN purchase_orders po ON s.id = po.supplier_id
            WHERE $filter
            GROUP BY s.supplier_name
            ORDER BY total_amount DESC";

    executeQuery($con, $sql);
}

function getRequestsReport($con, $period, $status = '')
{
    $filter = buildDateFilter("created_at", $period);

    if ($status) {
        $filter .= " AND status = '" . pg_escape_string($status) . "'";
    }

    $sql = "
        SELECT 
            id,
            requester_name,
            requester_department,
            asset_name,
            asset_category,
            justification,
            estimated_cost,
            urgency,
            status,
            created_at
        FROM asset_requests
        WHERE $filter
        ORDER BY created_at DESC";

    executeQuery($con, $sql);
}



/* ============================================================
   SWITCH HANDLER
   ============================================================ */

switch ($reportType) {
    case 'purchase-order':
        getPurchaseOrderReport($con, $period);
        break;

    case 'assets-disposal':
        getAssetsDisposalReport($con, $period);
        break;

    case 'transfer':
        getTransferReport($con, $period);
        break;

    case 'suppliers-performance':
        getSuppliersPerformanceReport($con, $period);
        break;

    case 'requests':
        getRequestsReport($con, $period);
        break;

    case 'pending-requests':
        getRequestsReport($con, $period, 'pending');
        break;

    case 'approved-requests':
        getRequestsReport($con, $period, 'approved');
        break;

    case 'rejected-requests':
        getRequestsReport($con, $period, 'rejected');
        break;

    default:
        http_response_code(400);
        echo json_encode(["message" => "Invalid reportType specified."]);
        break;
}
