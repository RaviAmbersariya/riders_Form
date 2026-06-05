<?php
/**
 * Rider Insurance Registration API
 * Handles CRUD operations for rider registration and insurance data
 * Uses centralized database connection from db_conn.php
 */

require_once __DIR__ . '/db_conn.php';

// Get the shared database connection
$conn = get_db_conn();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? sanitizeInput($_GET['action']) : '';

// Route requests to appropriate handlers
switch ($method) {
    case 'GET':
        handleGetRequest($action, $conn);
        break;
    case 'POST':
        handlePostRequest($action, $conn);
        break;
    case 'PUT':
        handlePutRequest($action, $conn);
        break;
    case 'DELETE':
        handleDeleteRequest($action, $conn);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// ========================================
// REQUEST HANDLERS
// ========================================

function handleGetRequest($action, $conn) {
    switch ($action) {
        case 'stats':
            getStats($conn);
            break;
        case 'riders':
            getAllRiders($conn);
            break;
        case 'rider':
            getRiderById($conn);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePostRequest($action, $conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'riders':
            createRider($data, $conn);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePutRequest($action, $conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'rider':
            updateRider($data, $conn);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handleDeleteRequest($action, $conn) {
    switch ($action) {
        case 'rider':
            deleteRider($conn);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

// ========================================
// DATABASE OPERATIONS
// ========================================

function getStats($conn) {
    $stats = [
        'total_riders' => 0,
        'active_riders' => 0,
        'pending_insurance' => 0,
        'completed_insurance' => 0,
        'expiring_policies' => 0,
        'recently_activated' => 0
    ];
    
    // Check if table exists first
    $result = $conn->query("SELECT COUNT(*) as count FROM riders");
    if ($result) {
        $row = $result->fetch_assoc();
        $stats['total_riders'] = (int)$row['count'];
    }
    
    echo json_encode($stats);
}

function getAllRiders($conn) {
    $result = $conn->query("SELECT * FROM riders ORDER BY created_at DESC LIMIT 100");
    
    $riders = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $riders[] = $row;
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $riders,
        'count' => count($riders)
    ]);
}

function getRiderById($conn) {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing rider ID']);
        return;
    }
    
    $stmt = $conn->prepare("SELECT * FROM riders WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $conn->error]);
        return;
    }
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Rider not found']);
        return;
    }
    
    $rider = $result->fetch_assoc();
    echo json_encode(['success' => true, 'data' => $rider]);
}

function createRider($data, $conn) {
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request body']);
        return;
    }
    
    // Prepare insert statement
    $stmt = $conn->prepare("
        INSERT INTO riders (
            brand_name, store_name, employee_no, employee_name, employee_email, 
            employee_phone, employee_gender, employee_dob, pan_number, 
            employee_address, employee_city, employee_state, employee_pincode,
            nominee_name, nominee_gender, nominee_dob, nominee_relationship,
            insurance_status, insurance_policy_number, insurance_provider,
            insurance_start_date, insurance_end_date, coverage_amount,
            insurance_eligibility_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    
    $stmt->bind_param(
        "ssssssssssssssssssssssss",
        $data['brandName'] ?? '',
        $data['storeName'] ?? '',
        $data['employeeNo'] ?? '',
        $data['employeeName'] ?? '',
        $data['employeeEmail'] ?? '',
        $data['employeePhone'] ?? '',
        $data['employeeGender'] ?? '',
        $data['employeeDOB'] ?? '',
        $data['panNumber'] ?? '',
        $data['employeeAddress'] ?? '',
        $data['employeeCity'] ?? '',
        $data['employeeState'] ?? '',
        $data['employeePinCode'] ?? '',
        $data['nomineeName'] ?? '',
        $data['nomineeGender'] ?? '',
        $data['nomineeDOB'] ?? '',
        $data['nomineeRelationship'] ?? '',
        $data['insuranceStatus'] ?? '',
        $data['insurancePolicyNumber'] ?? '',
        $data['insuranceProvider'] ?? '',
        $data['insuranceStartDate'] ?? '',
        $data['insuranceEndDate'] ?? '',
        $data['coverageAmount'] ?? '',
        $data['insuranceEligibilityStatus'] ?? ''
    );
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Rider created successfully',
            'id' => $conn->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create rider: ' . $stmt->error]);
    }
    
    $stmt->close();
}

function updateRider($data, $conn) {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing rider ID']);
        return;
    }
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request body']);
        return;
    }
    
    $stmt = $conn->prepare("
        UPDATE riders SET
            brand_name = ?, store_name = ?, employee_no = ?, employee_name = ?,
            employee_email = ?, employee_phone = ?, employee_gender = ?, employee_dob = ?,
            pan_number = ?, employee_address = ?, employee_city = ?, employee_state = ?,
            employee_pincode = ?, nominee_name = ?, nominee_gender = ?, nominee_dob = ?,
            nominee_relationship = ?, insurance_status = ?, insurance_policy_number = ?,
            insurance_provider = ?, insurance_start_date = ?, insurance_end_date = ?,
            coverage_amount = ?, insurance_eligibility_status = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    
    $stmt->bind_param(
        "ssssssssssssssssssssssssi",
        $data['brandName'] ?? '',
        $data['storeName'] ?? '',
        $data['employeeNo'] ?? '',
        $data['employeeName'] ?? '',
        $data['employeeEmail'] ?? '',
        $data['employeePhone'] ?? '',
        $data['employeeGender'] ?? '',
        $data['employeeDOB'] ?? '',
        $data['panNumber'] ?? '',
        $data['employeeAddress'] ?? '',
        $data['employeeCity'] ?? '',
        $data['employeeState'] ?? '',
        $data['employeePinCode'] ?? '',
        $data['nomineeName'] ?? '',
        $data['nomineeGender'] ?? '',
        $data['nomineeDOB'] ?? '',
        $data['nomineeRelationship'] ?? '',
        $data['insuranceStatus'] ?? '',
        $data['insurancePolicyNumber'] ?? '',
        $data['insuranceProvider'] ?? '',
        $data['insuranceStartDate'] ?? '',
        $data['insuranceEndDate'] ?? '',
        $data['coverageAmount'] ?? '',
        $data['insuranceEligibilityStatus'] ?? '',
        $id
    );
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Rider updated successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update rider']);
    }
    
    $stmt->close();
}

function deleteRider($conn) {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing rider ID']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM riders WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Rider deleted successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete rider']);
    }
    
    $stmt->close();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

?>
