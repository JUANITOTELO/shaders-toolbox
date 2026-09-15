<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (file_exists(__DIR__ . '/config/database.php')) {
    require_once __DIR__ . '/config/database.php';
} else {
    require_once __DIR__ . '/../config/database.php';
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->prepare("SELECT * FROM categories ORDER BY id ASC");
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($categories);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!empty($data['name'])) {
        $name = trim($data['name']);
        $slug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $name));
        $parentId = !empty($data['parent_id']) ? intval($data['parent_id']) : null;
        $icon = !empty($data['icon']) ? trim($data['icon']) : 'folder';

        $stmt = $db->prepare("INSERT INTO categories (parent_id, name, slug, icon) VALUES (:parent_id, :name, :slug, :icon)");
        $stmt->bindParam(':parent_id', $parentId);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':slug', $slug);
        $stmt->bindParam(':icon', $icon);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Folder created successfully.", "id" => $db->lastInsertId()]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create folder."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Folder name is required."]);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $_GET['id'] ?? ($data['id'] ?? null);

    if (!empty($id)) {
        $stmt = $db->prepare("DELETE FROM categories WHERE id = :id");
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Folder deleted successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to delete folder."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Missing folder ID."]);
    }
}
?>
