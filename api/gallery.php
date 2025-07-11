<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load gallery data from JSON file
$galleryJsonPath = __DIR__ . '/gallery.json';
if (!file_exists($galleryJsonPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Gallery data not found']);
    exit;
}

$galleryData = json_decode(file_get_contents($galleryJsonPath), true);
if (!$galleryData) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse gallery data']);
    exit;
}

// Get query parameters
$serialNumber = $_GET['sn'] ?? '';
$licenseType = $_GET['license'] ?? '';
$vendorCode = $_GET['vendor'] ?? '';
$category = $_GET['category'] ?? '';
$debug = isset($_GET['debug']) && $_GET['debug'] === 'true';

// Debug information
$debugInfo = [
    'query_params' => [
        'sn' => $serialNumber,
        'license' => $licenseType,
        'vendor' => $vendorCode,
        'category' => $category
    ],
    'original_count' => count($galleryData),
    'timestamp' => date('Y-m-d H:i:s')
];

$filteredData = $galleryData;

// Apply license-based filtering
if ($licenseType) {
    $filteredData = array_filter($filteredData, function($item) use ($licenseType) {
        $itemLicense = $item['licenseType'] ?? '01';
        
        // License hierarchy: 03 (Full) > 02 (Standard) > 01 (Basic)
        switch ($licenseType) {
            case '01': // Basic: only basic content
                return $itemLicense === '01';
            case '02': // Standard: basic + standard
                return in_array($itemLicense, ['01', '02']);
            case '03': // Full: all content
                return true;
            default:
                return true;
        }
    });
}

// Apply serial number filtering (show user's custom animations)
if ($serialNumber) {
    $userAnimations = array_filter($galleryData, function($item) use ($serialNumber) {
        return isset($item['serialNumber']) && $item['serialNumber'] === $serialNumber;
    });
    
    // Merge user animations with license-filtered data
    $filteredData = array_merge($filteredData, $userAnimations);
    // Remove duplicates based on ID
    $uniqueData = [];
    $seenIds = [];
    foreach ($filteredData as $item) {
        $id = $item['id'] ?? $item['name'];
        if (!in_array($id, $seenIds)) {
            $uniqueData[] = $item;
            $seenIds[] = $id;
        }
    }
    $filteredData = $uniqueData;
}

// Apply vendor filtering
if ($vendorCode) {
    $vendorAnimations = array_filter($galleryData, function($item) use ($vendorCode) {
        return isset($item['vendorCode']) && strtoupper($item['vendorCode']) === strtoupper($vendorCode);
    });
    
    // Merge vendor animations
    $filteredData = array_merge($filteredData, $vendorAnimations);
    // Remove duplicates
    $uniqueData = [];
    $seenIds = [];
    foreach ($filteredData as $item) {
        $id = $item['id'] ?? $item['name'];
        if (!in_array($id, $seenIds)) {
            $uniqueData[] = $item;
            $seenIds[] = $id;
        }
    }
    $filteredData = $uniqueData;
}

// Apply category filtering
if ($category && $category !== 'all') {
    $filteredData = array_filter($filteredData, function($item) use ($category) {
        return isset($item['category']) && strtolower($item['category']) === strtolower($category);
    });
}

// Extract unique categories from filtered data
$categories = array_unique(array_map(function($item) {
    return $item['category'] ?? 'Unknown';
}, $filteredData));
sort($categories);

// Add special categories based on context
$specialCategories = [];
if ($serialNumber) {
    $hasUserContent = !empty(array_filter($galleryData, function($item) use ($serialNumber) {
        return isset($item['serialNumber']) && $item['serialNumber'] === $serialNumber;
    }));
    if ($hasUserContent) {
        $specialCategories[] = 'Customer Request';
    }
}

$allCategories = array_merge($specialCategories, $categories);

$debugInfo['filtered_count'] = count($filteredData);
$debugInfo['categories'] = $allCategories;
$debugInfo['filters_applied'] = [
    'license' => !empty($licenseType),
    'serial' => !empty($serialNumber),
    'vendor' => !empty($vendorCode),
    'category' => !empty($category)
];

// Prepare response
$response = [
    'success' => true,
    'data' => array_values($filteredData), // Re-index array
    'categories' => $allCategories,
    'total_count' => count($galleryData),
    'filtered_count' => count($filteredData)
];

// Add debug info if requested
if ($debug) {
    $response['debug'] = $debugInfo;
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>