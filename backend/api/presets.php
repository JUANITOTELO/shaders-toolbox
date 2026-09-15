<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

function formatPresetResponse($row) {
    return [
        'id' => isset($row['id']) ? intval($row['id']) : null,
        'category_id' => isset($row['category_id']) && $row['category_id'] !== null ? intval($row['category_id']) : null,
        'name' => $row['name'],
        'description' => $row['description'] ?? '',
        'glsl_code' => $row['glsl_code'] ?? '',
        'markdown_doc' => $row['markdown_doc'] ?? '',
        'difficulty' => $row['difficulty'] ?? 'Beginner',
        'order_index' => isset($row['order_index']) ? intval($row['order_index']) : 0,
        'challenge_json' => $row['challenge_json'] ?? '',
        'created_at' => $row['created_at'] ?? null
    ];
}

if ($method === 'GET') {
    $categoryId = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;
    if ($categoryId !== null) {
        $stmt = $db->prepare("SELECT * FROM presets WHERE category_id = :category_id ORDER BY id DESC");
        $stmt->execute([':category_id' => $categoryId]);
    } else {
        $stmt = $db->prepare("SELECT * FROM presets ORDER BY id DESC");
        $stmt->execute();
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $presets = array_map('formatPresetResponse', $rows);
    echo json_encode($presets);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!empty($data['name']) && !empty($data['glsl_code'])) {
        $categoryId = isset($data['category_id']) && $data['category_id'] !== null && $data['category_id'] !== '' ? intval($data['category_id']) : null;
        $markdownDoc = !empty($data['markdown_doc']) ? $data['markdown_doc'] : '';
        $description = $data['description'] ?? '';

        $stmt = $db->prepare("INSERT INTO presets (category_id, name, description, glsl_code, markdown_doc) VALUES (:category_id, :name, :description, :glsl_code, :markdown_doc)");
        $success = $stmt->execute([
            ':category_id' => $categoryId,
            ':name' => $data['name'],
            ':description' => $description,
            ':glsl_code' => $data['glsl_code'],
            ':markdown_doc' => $markdownDoc
        ]);
        
        if ($success) {
            http_response_code(201);
            echo json_encode(["message" => "Preset created successfully.", "id" => intval($db->lastInsertId())]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create preset."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data."]);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!empty($data['id']) && !empty($data['name']) && !empty($data['glsl_code'])) {
        $categoryId = isset($data['category_id']) && $data['category_id'] !== null && $data['category_id'] !== '' ? intval($data['category_id']) : null;
        $markdownDoc = !empty($data['markdown_doc']) ? $data['markdown_doc'] : '';
        $description = $data['description'] ?? '';

        $stmt = $db->prepare("UPDATE presets SET category_id = :category_id, name = :name, description = :description, glsl_code = :glsl_code, markdown_doc = :markdown_doc WHERE id = :id");
        $success = $stmt->execute([
            ':id' => intval($data['id']),
            ':category_id' => $categoryId,
            ':name' => $data['name'],
            ':description' => $description,
            ':glsl_code' => $data['glsl_code'],
            ':markdown_doc' => $markdownDoc
        ]);
        
        if ($success) {
            echo json_encode(["message" => "Preset updated successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update preset."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data for update."]);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $_GET['id'] ?? ($data['id'] ?? null);
    
    if (!empty($id)) {
        $stmt = $db->prepare("DELETE FROM presets WHERE id = :id");
        if ($stmt->execute([':id' => intval($id)])) {
            echo json_encode(["message" => "Preset deleted successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to delete preset."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Missing preset ID."]);
    }
}
?>
