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
$page       = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit      = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
$offset     = ($page - 1) * $limit;

if (!$reportType || !$period) {
    http_response_code(400);
    echo json_encode(["message" => "Missing reportType or period parameters."]);
    exit();
}



/* =======================================
   UNIVERSAL YEAR/MONTH/QUARTER FILTER
   ======================================= */
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



/* =======================================
   PAGINATED QUERY WRAPPER
   ======================================= */
function executePaginatedQuery($con, $sql, $countSql, $page, $limit)
{
    $result = pg_query($con, $sql);
    $countResult = pg_query($con, $countSql);

    if (!$result || !$countResult) {
        http_response_code(500);
        echo json_encode([
            "message" => "Failed to fetch data.",
            "error" => pg_last_error($con)
        ]);
        exit();
    }

    $data = pg_fetch_all($result) ?: [];
    $totalRow = pg_fetch_assoc($countResult);
    $total = intval($totalRow['count']);
    $totalPages = ceil($total / $limit);

    echo json_encode([
        "page" => $page,
        "limit" => $limit,
        "total" => $total,
        "totalPages" => $totalPages,
        "data" => $data
    ]);
}



/* =======================================
   REPORT FUNCTIONS
   ======================================= */

function getPurchaseOrderReport($con, $period, $page, $limit, $offset)
{
    $filter = buildDateFilter("po_date", $period);

    $sql = "SELECT 
                po_number,
                supplier_name,
                total_amount,
                status,
                po_date
            FROM purchase_orders
            WHERE $filter
            ORDER BY po_date DESC
            LIMIT $limit OFFSET $offset";

    $countSql = "SELECT COUNT(*) FROM purchase_orders WHERE $filter";

    executePaginatedQuery($con, $sql, $countSql, $page, $limit);
}

function getAssetsDisposalReport($con, $period, $page, $limit, $offset)
{
    $filter = buildDateFilter("dr.request_date", $period);

    $sql = "SELECT 
                a.serial_number,
                dr.reason,
                dr.method,
                dr.status,
                dr.request_date,
                dr.requested_by_name,
                dr.sale_amount,
                dr.recipient_details
            FROM disposal_requests dr
            JOIN assets a ON dr.asset_id = a.id
            WHERE $filter
            ORDER BY dr.request_date DESC
            LIMIT $limit OFFSET $offset";

    $countSql = "SELECT COUNT(*) 
                 FROM disposal_requests dr
                 JOIN assets a ON dr.asset_id = a.id
                 WHERE $filter";

    executePaginatedQuery($con, $sql, $countSql, $page, $limit);
}

function getTransferReport($con, $period, $page, $limit, $offset)
{
    $filter = buildDateFilter("tr.request_date", $period);

    $sql = "SELECT 
                a.serial_number,
                tr.from_department,
                tr.to_department,
                tr.status,
                tr.request_date
            FROM transfer_requests tr
            JOIN assets a ON tr.asset_id = a.id
            WHERE $filter
            ORDER BY tr.request_date DESC
            LIMIT $limit OFFSET $offset";

    $countSql = "SELECT COUNT(*)
                 FROM transfer_requests tr
                 JOIN assets a ON tr.asset_id = a.id
                 WHERE $filter";

    executePaginatedQuery($con, $sql, $countSql, $page, $limit);
}

function getSuppliersPerformanceReport($con, $period, $page, $limit, $offset)
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
            ORDER BY total_amount DESC
            LIMIT $limit OFFSET $offset";

    $countSql = "SELECT COUNT(*) 
                 FROM (
                    SELECT s.supplier_name
                    FROM suppliers s
                    JOIN purchase_orders po ON s.id = po.supplier_id
                    WHERE $filter
                    GROUP BY s.supplier_name
                 ) AS t";

    executePaginatedQuery($con, $sql, $countSql, $page, $limit);
}

function getRequestsReport($con, $period, $page, $limit, $offset, $status = '')
{
    // Build date filter
    $filter = buildDateFilter("created_at", $period);

    // Allowed statuses
    $allowedStatuses = ['pending', 'approved', 'rejected', 'fulfilled'];

    // Apply case-insensitive status filter
    if (!empty($status)) {

        $status = strtolower($status);

        if (in_array($status, $allowedStatuses)) {
            $filter .= " AND LOWER(status) = '" . pg_escape_string($con, $status) . "'";
        }
    }

    $sql = "SELECT 
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
            ORDER BY created_at DESC
            LIMIT $limit OFFSET $offset";

    $countSql = "SELECT COUNT(*) FROM asset_requests WHERE $filter";

    executePaginatedQuery($con, $sql, $countSql, $page, $limit);
}

function getActivityLogsReport($con, $period, $page, $limit, $offset)
{
    $filter = buildDateFilter("timestamp", $period);

    $sql = "SELECT 
                id,
                user_id,
                user_email,
                action,
                resource_type,
                details,
                ip_address,
                user_agent,
                timestamp
            FROM activity_logs
            WHERE $filter
            ORDER BY timestamp DESC
            LIMIT $limit OFFSET $offset";

    $countSql = "SELECT COUNT(*) FROM activity_logs WHERE $filter";

    executePaginatedQuery($con, $sql, $countSql, $page, $limit);
}

/* =======================================
   SWITCH HANDLER
   ======================================= */

switch ($reportType) {
    case 'purchase-order':
        getPurchaseOrderReport($con, $period, $page, $limit, $offset);
        break;

    case 'assets-disposal':
        getAssetsDisposalReport($con, $period, $page, $limit, $offset);
        break;

    case 'transfer':
        getTransferReport($con, $period, $page, $limit, $offset);
        break;

    case 'suppliers-performance':
        getSuppliersPerformanceReport($con, $period, $page, $limit, $offset);
        break;

    case 'requests':
        getRequestsReport($con, $period, $page, $limit, $offset);
        break;

    case 'pending-requests':
        getRequestsReport($con, $period, $page, $limit, $offset, 'pending');
        break;

    case 'approved-requests':
        getRequestsReport($con, $period, $page, $limit, $offset, 'approved');
        break;

    case 'rejected-requests':
        getRequestsReport($con, $period, $page, $limit, $offset, 'rejected');
        break;

    case 'fulfilled-requests':
        getRequestsReport($con, $period, $page, $limit, $offset, 'fulfilled');
        break;

    case 'activity-logs':
        getActivityLogsReport($con, $period, $page, $limit, $offset);
        break;

    default:
        http_response_code(400);
        echo json_encode(["message" => "Invalid reportType specified."]);
        break;
}
