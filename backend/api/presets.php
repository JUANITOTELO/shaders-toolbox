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

if ($method === 'GET') {
    $categoryId = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;
    if ($categoryId) {
        $stmt = $db->prepare("SELECT * FROM presets WHERE category_id = :category_id ORDER BY id DESC");
        $stmt->bindParam(':category_id', $categoryId);
    } else {
        $stmt = $db->prepare("SELECT * FROM presets ORDER BY id DESC");
    }
    $stmt->execute();
    $presets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($presets);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!empty($data['name']) && !empty($data['glsl_code'])) {
        $categoryId = !empty($data['category_id']) ? intval($data['category_id']) : null;
        $markdownDoc = !empty($data['markdown_doc']) ? $data['markdown_doc'] : '';
        $description = $data['description'] ?? '';

        $stmt = $db->prepare("INSERT INTO presets (category_id, name, description, glsl_code, markdown_doc) VALUES (:category_id, :name, :description, :glsl_code, :markdown_doc)");
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':glsl_code', $data['glsl_code']);
        $stmt->bindParam(':markdown_doc', $markdownDoc);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Preset created successfully.", "id" => $db->lastInsertId()]);
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
        $categoryId = !empty($data['category_id']) ? intval($data['category_id']) : null;
        $markdownDoc = !empty($data['markdown_doc']) ? $data['markdown_doc'] : '';
        $description = $data['description'] ?? '';

        $stmt = $db->prepare("UPDATE presets SET category_id = :category_id, name = :name, description = :description, glsl_code = :glsl_code, markdown_doc = :markdown_doc WHERE id = :id");
        $stmt->bindParam(':id', $data['id']);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':glsl_code', $data['glsl_code']);
        $stmt->bindParam(':markdown_doc', $markdownDoc);
        
        if ($stmt->execute()) {
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
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
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
