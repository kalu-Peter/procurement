
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

$reportType = isset($_GET['reportType']) ? $_GET['reportType'] : '';
$period = isset($_GET['period']) ? $_GET['period'] : '';

if (empty($reportType) || empty($period)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing reportType or period parameters."]);
    exit();
}

function getPeriodInterval($period)
{
    $interval = '';
    if ($period === 'monthly') {
        $interval = '1 month';
    } elseif ($period === 'quarterly') {
        $interval = '3 months';
    } elseif ($period === 'annually') {
        $interval = '1 year';
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Invalid period specified."]);
        exit();
    }
    return $interval;
}

function executeQuery($con, $sql)
{
    $result = pg_query($con, $sql);

    if ($result) {
        $data = pg_fetch_all($result);
        http_response_code(200);
        echo json_encode($data ? $data : []);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to fetch report data.", "error" => pg_last_error($con)]);
    }
}

function getPurchaseOrderReport($con, $period)
{
    $interval = getPeriodInterval($period);
    $sql = "SELECT id, po_number, supplier_name, total_amount, status, po_date FROM purchase_orders WHERE po_date >= NOW() - INTERVAL '$interval'";
    executeQuery($con, $sql);
}

function getAssetsDisposalReport($con, $period)
{
    $interval = getPeriodInterval($period);

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
            WHERE dr.request_date >= NOW() - INTERVAL '$interval'
            ORDER BY dr.request_date DESC";

    executeQuery($con, $sql);
}


function getTransferReport($con, $period)
{
    $interval = getPeriodInterval($period);
    $sql = "SELECT id, asset_id, from_department, to_department, status, request_date FROM transfer_requests WHERE request_date >= NOW() - INTERVAL '$interval'";
    executeQuery($con, $sql);
}

function getSuppliersPerformanceReport($con, $period)
{
    $interval = getPeriodInterval($period);
    $sql = "SELECT 
                s.supplier_name,
                COUNT(po.id) AS total_orders,
                SUM(po.total_amount) AS total_amount
            FROM 
                suppliers s
            JOIN 
                purchase_orders po ON s.id = po.supplier_id
            WHERE 
                po.po_date >= NOW() - INTERVAL '$interval'
            GROUP BY 
                s.supplier_name
            ORDER BY 
                total_amount DESC";
    executeQuery($con, $sql);
}

function getRequestsReport($con, $period, $status = '')
{
    $interval = getPeriodInterval($period);

    $sql = "SELECT 
                id,
                requester_id,
                requester_name,
                requester_department,
                asset_name,
                asset_category,
                justification,
                estimated_cost,
                urgency,
                preferred_vendor,
                status,
                created_at
            FROM asset_requests
            WHERE created_at >= NOW() - INTERVAL '$interval'";

    if (!empty($status)) {
        $sql .= " AND status = '" . pg_escape_string($status) . "'";
    }

    $sql .= " ORDER BY created_at DESC";

    executeQuery($con, $sql);
}



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
