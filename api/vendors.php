<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load vendors data from JSON file
$vendorsJsonPath = __DIR__ . '/vendors.json';
if (!file_exists($vendorsJsonPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Vendors data not found']);
    exit;
}

$vendorsData = json_decode(file_get_contents($vendorsJsonPath), true);
if (!$vendorsData) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse vendors data']);
    exit;
}

// Get query parameters
$vendorCode = $_GET['code'] ?? '';
$serialNumber = $_GET['sn'] ?? '';
$debug = isset($_GET['debug']) && $_GET['debug'] === 'true';

// Debug information
$debugInfo = [
    'query_params' => [
        'code' => $vendorCode,
        'sn' => $serialNumber
    ],
    'total_vendors' => count($vendorsData),
    'timestamp' => date('Y-m-d H:i:s')
];

$response = [
    'success' => true,
    'data' => $vendorsData
];

// If specific vendor code requested
if ($vendorCode) {
    $vendor = null;
    foreach ($vendorsData as $v) {
        if ($v['code'] === $vendorCode) {
            $vendor = $v;
            break;
        }
    }
    
    if ($vendor) {
        $response['vendor'] = $vendor;
    } else {
        $response['vendor'] = null;
        $response['message'] = 'Vendor not found';
    }
}

// If serial number provided, try to detect vendor
if ($serialNumber) {
    $detectedVendor = null;
    
    // Detection logic based on serial number patterns
    foreach ($vendorsData as $vendor) {
        if (isset($vendor['serialPatterns'])) {
            foreach ($vendor['serialPatterns'] as $pattern) {
                if (preg_match($pattern, $serialNumber)) {
                    $detectedVendor = $vendor;
                    break 2;
                }
            }
        }
    }
    
    $response['detected_vendor'] = $detectedVendor;
}

// Add debug info if requested
if ($debug) {
    $response['debug'] = $debugInfo;
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>